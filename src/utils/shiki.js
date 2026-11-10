const LIMIT = 40;
const cache = new Map();
const waiting = new Map();
let worker = null;
let broken = typeof Worker === 'undefined';
let count = 0;

const direct = (code, language) => import('./shiki-render').then(module => module.renderCode(code, language));

const fail = () => {
  broken = true;
  worker?.terminate();
  worker = null;
  waiting.forEach(job => direct(job.code, job.language).then(job.resolve, job.reject));
  waiting.clear();
};

const connect = () => {
  if (worker || broken) return worker;
  try {
    worker = new Worker(new URL('./shiki.worker.js', import.meta.url), { type: 'module' });
  } catch {
    broken = true;
    return null;
  }
  worker.onmessage = event => {
    const { id, html, error } = event.data || {};
    const job = waiting.get(id);
    if (!job) return;
    waiting.delete(id);
    if (error) job.reject(new Error(error));
    else job.resolve(html);
  };
  worker.onerror = fail;
  worker.onmessageerror = fail;
  return worker;
};

const render = (code, language) => {
  const target = connect();
  if (!target) return direct(code, language);
  return new Promise((resolve, reject) => {
    count += 1;
    waiting.set(count, { code, language, resolve, reject });
    target.postMessage({ id: count, code, language });
  });
};

const keyOf = (code, language) => `${language}\u0000${code}`;

export const peekHighlight = (code, language = 'jsx') => cache.get(keyOf(String(code), language))?.html || '';

export const highlightCode = (code, language = 'jsx') => {
  const source = String(code);
  const key = keyOf(source, language);
  const known = cache.get(key);
  if (known) {
    cache.delete(key);
    cache.set(key, known);
    return known.promise;
  }
  const entry = { html: '', promise: null };
  entry.promise = render(source, language).then(
    html => {
      entry.html = html;
      return html;
    },
    error => {
      if (cache.get(key) === entry) cache.delete(key);
      throw error;
    }
  );
  cache.set(key, entry);
  if (cache.size > LIMIT) cache.delete(cache.keys().next().value);
  return entry.promise;
};
