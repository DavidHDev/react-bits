const YEAR = 2026;
const PREFIX = '/assets/advent/vault/';
const label = value => new TextEncoder().encode(`rb-advent-${YEAR}/${value}`);

export const unlockTime = day => Date.UTC(YEAR, 11, day) - 14 * 3600 * 1000;

const masterKey = async secret => {
  const bytes = Uint8Array.from(atob(secret), char => char.charCodeAt(0));
  if (bytes.length !== 32) throw new Error('Invalid key');
  return crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
};

const response = (request, body, status, cache = 'no-store', headers = {}) =>
  new Response(request.method === 'HEAD' ? null : body, {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache, ...headers }
  });

const asset = (request, env, name) => env.ASSETS.fetch(new Request(new URL(PREFIX + name, request.url)));

const health = async (request, env) => {
  if (!env.ADVENT_KEY) return response(request, '{"key":"missing"}', 503);
  try {
    const stored = await asset(request, env, 'key.check');
    const hex = stored.ok ? (await stored.text()).trim() : '';
    if (/^[0-9a-f]{64}$/.test(hex)) {
      const signature = Uint8Array.from(hex.match(/../g), byte => parseInt(byte, 16));
      if (await crypto.subtle.verify('HMAC', await masterKey(env.ADVENT_KEY), signature, label('key-check'))) {
        return response(request, '{"key":"ok"}', 200);
      }
    }
  } catch {
    return response(request, '{"key":"mismatch"}', 503);
  }
  return response(request, '{"key":"mismatch"}', 503);
};

export const serveAdvent = async (request, env, segments) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return response(request, '{"error":"method_not_allowed"}', 405, 'no-store', { allow: 'GET, HEAD' });
  }
  const [segment, part] = segments;
  if (segments.length === 1 && segment === 'health') return health(request, env);
  if (segments.length !== 2 || !/^(?:0?[1-9]|1\d|2[0-4])$/.test(segment) || !['gift', 'meta'].includes(part)) {
    return response(request, '{"error":"not_found"}', 404);
  }
  const day = Number(segment);
  const opens = unlockTime(day);
  const local = ['localhost', '127.0.0.1'].includes(new URL(request.url).hostname);
  const override = local && env.ADVENT_NOW ? Date.parse(env.ADVENT_NOW) : NaN;
  if ((Number.isFinite(override) ? override : Date.now()) < opens) {
    return response(request, JSON.stringify({ locked: true, opens: new Date(opens).toISOString() }), 403);
  }
  try {
    const master = await masterKey(env.ADVENT_KEY);
    const stored = await asset(request, env, `${String(day).padStart(2, '0')}.${part}.bin`);
    if (stored.status === 404) return response(request, '{"error":"not_ready"}', 404);
    if (!stored.ok) return response(request, '{"error":"unavailable"}', 503);
    const bytes = new Uint8Array(await stored.arrayBuffer());
    const raw = await crypto.subtle.sign('HMAC', master, label(day));
    const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
    const packed = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, key, bytes.subarray(12));
    const stream = new Response(packed).body.pipeThrough(new DecompressionStream('gzip'));
    const body = await new Response(stream).arrayBuffer();
    return response(request, body, 200, 'public, max-age=300, s-maxage=3600');
  } catch {
    return response(request, '{"error":"unavailable"}', 503);
  }
};
