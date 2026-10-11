import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script\b[^>]*\bid=["']rb-boot-script["'][^>]*>([\s\S]*?)<\/script>/);
const style = html.match(/<style\b[^>]*\bid=["']rb-boot-style["'][^>]*>([\s\S]*?)<\/style>/);

function runBoot({
  savedTheme = null,
  storageThrows = false,
  storageAccessThrows = false,
  overlayPresent = true
} = {}) {
  assert.ok(script, 'index.html must include the inline boot script');
  const attributes = new Map();
  const timers = new Map();
  const events = new Map();
  const storageReads = [];
  const clearedTimers = [];
  let nextTimer = 0;
  const state = { attributes, timers, events, storageReads, clearedTimers, overlayPresent, overlayRemovals: 0 };
  const overlay = {
    remove() {
      state.overlayPresent = false;
      state.overlayRemovals++;
    }
  };
  const window = {
    addEventListener(type, handler) {
      if (!events.has(type)) events.set(type, new Set());
      events.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      events.get(type)?.delete(handler);
    }
  };
  const sandbox = {
    window,
    document: {
      documentElement: {
        setAttribute: (name, value) => attributes.set(name, String(value)),
        removeAttribute: name => attributes.delete(name)
      },
      getElementById: id => (id === 'rb-boot-loader' && state.overlayPresent ? overlay : null)
    },
    setTimeout(callback, delay) {
      const id = ++nextTimer;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      clearedTimers.push(id);
      timers.delete(id);
    }
  };
  Object.defineProperty(sandbox, 'localStorage', {
    get() {
      if (storageAccessThrows) throw new Error('Storage access is blocked');
      return {
        getItem(key) {
          storageReads.push(key);
          if (storageThrows) throw new Error('Storage read failed');
          return savedTheme;
        }
      };
    }
  });
  vm.runInNewContext(script[1], sandbox, { filename: 'index.html#rb-boot-script', timeout: 1000 });
  return {
    ...state,
    state,
    window,
    dispatchPageShow(persisted) {
      for (const handler of [...(events.get('pageshow') ?? [])]) handler({ persisted });
    },
    fireTimer(id) {
      const timer = timers.get(id);
      assert.ok(timer, `Timer ${id} must be pending`);
      timers.delete(id);
      timer.callback();
    }
  };
}

function assertFinished(boot) {
  assert.equal(boot.attributes.has('data-rb-boot'), false);
  assert.equal(boot.state.overlayPresent, false);
  assert.equal(boot.timers.size, 0);
  assert.equal(boot.events.get('pageshow')?.size ?? 0, 0);
  assert.equal(Object.hasOwn(boot.window, '__RB_FINISH_BOOT__'), false);
}

function cssRule(selector) {
  assert.ok(style, 'index.html must include inline boot styles');
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return style[1].match(new RegExp(`(?:^|})\\s*${escaped}\\s*{([^}]*)}`))?.[1] ?? '';
}

for (const [savedTheme, expectedTheme] of [
  ['light', 'light'],
  ['dark', 'dark'],
  [null, 'dark'],
  ['system', 'dark'],
  ['LIGHT', 'dark'],
  [' light ', 'dark']
]) {
  test(`boot applies ${expectedTheme} for stored theme ${JSON.stringify(savedTheme)}`, () => {
    const boot = runBoot({ savedTheme });
    assert.deepEqual(boot.storageReads, ['react-bits-theme']);
    assert.equal(boot.attributes.get('data-theme'), expectedTheme);
    assert.equal(boot.attributes.has('data-rb-boot'), true);
    assert.equal(typeof boot.window.__RB_FINISH_BOOT__, 'function');
  });
}

test('blocked storage access and failed reads both fall back to dark without interrupting boot', () => {
  for (const options of [{ storageThrows: true }, { storageAccessThrows: true }]) {
    const boot = runBoot(options);
    assert.equal(boot.attributes.get('data-theme'), 'dark');
    assert.equal(boot.attributes.has('data-rb-boot'), true);
    boot.window.__RB_FINISH_BOOT__();
    assertFinished(boot);
  }
});

test('completion reveals the app, removes the overlay, and clears every boot resource idempotently', () => {
  const boot = runBoot({ savedTheme: 'light' });
  const finish = boot.window.__RB_FINISH_BOOT__;
  const [deadline] = boot.timers.keys();
  assert.equal(boot.events.get('pageshow')?.size, 1);
  finish();
  assertFinished(boot);
  assert.ok(boot.clearedTimers.includes(deadline));
  assert.equal(boot.attributes.get('data-theme'), 'light');
  assert.equal(boot.state.overlayRemovals, 1);
  assert.doesNotThrow(() => finish());
  assertFinished(boot);
  assert.equal(boot.state.overlayRemovals, 1);
});

test('completion also succeeds when the overlay is missing', () => {
  const boot = runBoot({ overlayPresent: false });
  boot.window.__RB_FINISH_BOOT__();
  assertFinished(boot);
  assert.equal(boot.state.overlayRemovals, 0);
});

test('the independent ten-second watchdog reveals the app when its JavaScript never finishes loading', () => {
  const boot = runBoot();
  assert.equal(boot.timers.size, 1);
  const [[deadline, timer]] = boot.timers;
  assert.equal(timer.delay, 10000);
  boot.fireTimer(deadline);
  assertFinished(boot);
  assert.equal(boot.state.overlayRemovals, 1);
});

test('only a persisted pageshow completes boot, so bfcache restores cannot leave the app hidden', () => {
  const boot = runBoot();
  boot.dispatchPageShow(false);
  assert.equal(boot.attributes.has('data-rb-boot'), true);
  assert.equal(boot.state.overlayPresent, true);
  assert.equal(boot.timers.size, 1);
  boot.dispatchPageShow(true);
  assertFinished(boot);
  boot.dispatchPageShow(true);
  assert.equal(boot.state.overlayRemovals, 1);
});

test('the boot script and styles run before app markup, and the overlay survives prerender replacement', () => {
  assert.ok(script);
  assert.ok(style);
  const appStart = html.indexOf('<!--rb-app-start-->');
  const appEnd = html.indexOf('<!--rb-app-end-->');
  const overlay = html.match(/<div\b[^>]*\bid=["']rb-boot-loader["'][^>]*>/);
  assert.ok(appStart >= 0 && appEnd > appStart, 'prerender replacement markers must exist in order');
  assert.ok(overlay, 'boot overlay must be present in initial HTML');
  assert.ok(script.index < html.indexOf('</head>'));
  assert.ok(style.index < html.indexOf('</head>'));
  assert.ok(overlay.index < appStart || overlay.index > appEnd, 'overlay must be outside replaced app markup');
  const prerendered = html.replace(
    /<!--rb-app-start-->[\s\S]*?<!--rb-app-end-->/,
    '<!--rb-app-start--><div id="root"><h1>Prerendered route</h1></div><!--rb-app-end-->'
  );
  assert.ok(prerendered.includes(overlay[0]));
  assert.ok(prerendered.includes(script[0]));
  assert.ok(prerendered.includes(style[0]));
});

test('without JavaScript the overlay is hidden and the app remains visible', () => {
  const htmlTag = html.match(/<html\b[^>]*>/)?.[0];
  assert.ok(htmlTag);
  assert.doesNotMatch(htmlTag, /data-rb-boot/);
  assert.match(cssRule('#rb-boot-loader'), /\bdisplay:\s*none\s*;/);
  assert.match(cssRule('html[data-rb-boot] #root'), /\bvisibility:\s*hidden\s*;/);
  assert.match(cssRule('html[data-rb-boot] #rb-boot-loader'), /\bdisplay:\s*(?:flex|grid|block)\s*;/);
  assert.doesNotMatch(cssRule('#root'), /\b(?:visibility:\s*hidden|display:\s*none)\s*;/);
  assert.doesNotMatch(html.match(/<div\b[^>]*\bid=["']root["'][^>]*>/)?.[0] ?? '', /\bhidden\b/);
});
