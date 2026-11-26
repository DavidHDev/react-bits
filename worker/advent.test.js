import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createCipheriv, createHmac, randomBytes } from 'node:crypto';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import worker from './index.js';

const vault = '/assets/advent/vault/';
const secret = randomBytes(32);
const otherSecret = randomBytes(32);
const malformedSecret = 'invalid.mock.key!';
const hmac = label => createHmac('sha256', secret).update(`rb-advent-2026/${label}`).digest();
const keyCheck = hmac('key-check').toString('hex');
const secrets = [secret, otherSecret, hmac(1), hmac(24)].flatMap(bytes => [
  bytes.toString('base64'),
  bytes.toString('hex')
]);
secrets.push(malformedSecret, keyCheck);

const seal = (day, bytes) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', hmac(day), iv);
  return Buffer.concat([iv, cipher.update(bytes), cipher.final(), cipher.getAuthTag()]);
};

const example = part => ({ fixture: part });
const sealedExample = (day, part) => seal(day, gzipSync(JSON.stringify(example(part))));
const firstOpens = Date.UTC(2026, 10, 30, 10);
const lastOpens = Date.UTC(2026, 11, 23, 10);

function fixture(files = {}) {
  const requested = [];
  const env = {
    ADVENT_KEY: secret.toString('base64'),
    ASSETS: {
      async fetch(request) {
        const path = new URL(request.url).pathname;
        requested.push(path);
        const file = path.startsWith(vault) ? files[path.slice(vault.length)] : undefined;
        return file === undefined ? new Response(null, { status: 404 }) : new Response(file);
      }
    }
  };

  async function call(path, method = 'GET', host = 'reactbits.dev') {
    const request = new Request(`https://${host}/api/advent/${path}`, { method });
    const response = await worker.fetch(request, env);
    const body = await response.text();
    const serialized = JSON.stringify([body, [...response.headers]]);
    assert.ok(!secrets.some(value => serialized.includes(value)), 'Response exposed test key material');
    return { response, body };
  }

  return { env, requested, call };
}

function uncached(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers.get('cache-control') ?? '', /\bno-store\b/i);
}

for (const [day, opens] of [
  [1, firstOpens],
  [24, lastOpens]
]) {
  test(`day ${day} releases both parts at precisely its UTC+14 boundary`, async t => {
    const stamp = String(day).padStart(2, '0');
    const files = Object.fromEntries(['gift', 'meta'].map(part => [`${stamp}.${part}.bin`, sealedExample(day, part)]));
    const { call, requested } = fixture(files);
    const clock = t.mock.method(Date, 'now', () => opens - 1);
    for (const part of ['gift', 'meta']) {
      const { response, body } = await call(`${day}/${part}`);
      uncached(response, 403);
      assert.deepEqual(JSON.parse(body), { locked: true, opens: new Date(opens).toISOString() });
    }
    assert.deepEqual(requested, []);

    clock.mock.mockImplementation(() => opens);
    for (const part of ['gift', 'meta']) {
      const { response, body } = await call(`${day}/${part}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /application\/json/);
      assert.deepEqual(JSON.parse(body), example(part));
    }
  });
}

test('invalid day segments and unknown parts return 404 without fetching assets', async () => {
  const { call, requested } = fixture();
  for (const path of ['0/gift', '25/gift', '1.5/meta', 'abc/gift', '01x/gift', '1e0/gift', '1/unknown']) {
    const { response } = await call(path);
    uncached(response, 404);
  }
  assert.deepEqual(requested, []);
});

test('HEAD has GET status and headers with an empty body before and after release', async t => {
  const { call } = fixture({ '01.gift.bin': sealedExample(1, 'gift') });
  const clock = t.mock.method(Date, 'now', () => firstOpens - 1);
  for (const now of [firstOpens - 1, firstOpens]) {
    clock.mock.mockImplementation(() => now);
    const get = await call('1/gift');
    const head = await call('1/gift', 'HEAD');
    assert.equal(head.response.status, get.response.status);
    for (const header of ['content-type', 'cache-control']) {
      assert.equal(head.response.headers.get(header), get.response.headers.get(header));
    }
    assert.equal(head.body, '');
  }
});

test('unsupported methods return 405 and advertise GET and HEAD', async () => {
  const { call, requested } = fixture();
  for (const path of ['1/gift', 'health']) {
    const { response } = await call(path, 'POST');
    uncached(response, 405);
    assert.deepEqual(
      response.headers
        .get('allow')
        ?.split(',')
        .map(s => s.trim())
        .sort(),
      ['GET', 'HEAD']
    );
  }
  assert.deepEqual(requested, []);
});

test('only a local request can use the clock override', async t => {
  t.mock.method(Date, 'now', () => firstOpens - 1);
  const { call, env, requested } = fixture({ '01.gift.bin': sealedExample(1, 'gift') });
  env.ADVENT_NOW = new Date(firstOpens).toISOString();
  const remote = await call('1/gift');
  uncached(remote.response, 403);
  assert.deepEqual(requested, []);
  for (const host of ['localhost:8787', '127.0.0.1:8787']) {
    const local = await call('1/gift', 'GET', host);
    assert.equal(local.response.status, 200);
    assert.deepEqual(JSON.parse(local.body), example('gift'));
  }
  env.ADVENT_NOW = 'invalid';
  const invalid = await call('1/gift', 'GET', 'localhost');
  uncached(invalid.response, 403);
});

test('missing, incorrect, and malformed keys return an uncached error', async t => {
  t.mock.method(Date, 'now', () => firstOpens);
  const { call, env } = fixture({ '01.meta.bin': sealedExample(1, 'meta') });
  for (const key of [undefined, otherSecret.toString('base64'), malformedSecret]) {
    env.ADVENT_KEY = key;
    const { response, body } = await call('1/meta');
    uncached(response, 503);
    assert.deepEqual(JSON.parse(body), { error: 'unavailable' });
  }
});

test('missing assets and damaged payloads return uncached errors', async t => {
  t.mock.method(Date, 'now', () => firstOpens);
  const damaged = sealedExample(1, 'meta');
  damaged[damaged.length - 1] ^= 1;
  for (const [file, status] of [
    [undefined, 404],
    [Buffer.alloc(3), 503],
    [damaged, 503],
    [seal(1, Buffer.from('invalid gzip fixture')), 503]
  ]) {
    const { call } = fixture({ '01.meta.bin': file });
    const { response, body } = await call('1/meta');
    uncached(response, status);
    if (status === 503) assert.deepEqual(JSON.parse(body), { error: 'unavailable' });
  }
});

test('health reports only key status and is never cached', async () => {
  for (const [key, check, status, state] of [
    [secret.toString('base64'), keyCheck, 200, 'ok'],
    [undefined, keyCheck, 503, 'missing'],
    [otherSecret.toString('base64'), keyCheck, 503, 'mismatch'],
    [malformedSecret, keyCheck, 503, 'mismatch'],
    [secret.toString('base64'), 'invalid fixture check', 503, 'mismatch'],
    [secret.toString('base64'), undefined, 503, 'mismatch']
  ]) {
    const { call, env, requested } = fixture({ 'key.check': check });
    env.ADVENT_KEY = key;
    const get = await call('health');
    uncached(get.response, status);
    assert.deepEqual(JSON.parse(get.body), { key: state });
    const head = await call('health', 'HEAD');
    uncached(head.response, status);
    assert.equal(head.body, '');
    assert.ok(requested.every(path => path === `${vault}key.check`));
  }
});
