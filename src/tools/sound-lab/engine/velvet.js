export const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const COMMON = `
const float TAU = 6.28318530718;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float span(float x, float reach) {
  float a = clamp(1.0 - abs(x) / reach, 0.0, 1.0);
  return a * a * (3.0 - 2.0 * a);
}

vec2 ribbon(vec2 q, float k, float amp, float width, float twist, float flow, float turn, float seed, float reach, float soft) {
  float x = q.x;
  float env = span(x, reach);
  float p1 = k * x + flow;
  float p2 = 1.87 * k * x - 0.71 * flow + seed;
  float p3 = 3.07 * k * x + 1.3 * flow + 2.0 * seed;
  float c = amp * env * (sin(p1) + 0.34 * sin(p2) + 0.12 * sin(p3));
  float slope = amp * env * k * (cos(p1) + 0.636 * cos(p2) + 0.368 * cos(p3));
  float th = twist * x + turn;
  float h = width * (0.3 + 0.7 * env) * sqrt(1.0 + slope * slope);
  float u = (q.y - c) / h;
  float cover = (1.0 - smoothstep(1.0 - soft, 1.0 + 0.5 * soft, abs(u))) * env;
  if (cover <= 0.0) return vec2(0.0);
  float bend = th + u * 0.9;
  vec3 n = normalize(vec3(-slope * 0.3, -sin(bend), cos(bend)));
  vec3 key = normalize(vec3(-0.35, 0.75, 0.6));
  float facing = dot(n, key);
  float grazing = 1.0 - n.z * n.z;
  float glint = dot(n, normalize(key + vec3(0.0, 0.0, 1.0)));
  float shade = (0.2 + 0.55 * facing * facing + 0.5 * grazing * grazing + 0.5 * pow(glint * glint, 12.0)) * (1.0 - 0.2 * u * u);
  return vec2(cover, shade);
}

vec3 satinLight(vec4 s) {
  return 1.0 - exp(-s.rgb * 1.4);
}

vec3 satinInk(vec4 s, vec3 ink, vec3 base) {
  float cover = clamp(s.a, 0.0, 1.0);
  float level = dot(s.rgb, vec3(0.333)) / max(cover, 1e-3);
  vec3 deep = ink * 0.6;
  vec3 pale = mix(ink, vec3(1.0), 0.55);
  vec3 cloth = mix(deep, pale, smoothstep(0.25, 1.15, level));
  return mix(base, cloth, cover * 0.94);
}
`;

export const ORB_FRAG = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uFlow;
uniform vec3 uTurn;
uniform float uEnergy;
uniform float uPulse;
uniform vec3 uBands;
uniform float uLight;
uniform vec3 uInk;
uniform vec3 uTint;
uniform float uIntro;
uniform float uHover;

out vec4 fragColor;
${COMMON}
const float BEVEL = 0.3;
const float PULL = 0.34;

vec2 lens(vec2 dir, float r, float strength) {
  float t = clamp((r - (1.0 - BEVEL)) / BEVEL, 0.0, 1.0);
  float curve = 1.0 - sqrt(max(1.0 - t * t, 0.0));
  return dir * (r - PULL * strength * curve);
}

vec4 scene(vec2 q) {
  float e = uEnergy;
  float breath = 0.5 + 0.5 * sin(uTime * 0.7);
  float lift = 1.0 + 2.0 * e + 1.2 * uPulse;
  vec2 a = ribbon(q, 2.6, 0.18 * (0.92 + 0.12 * breath) * (lift + 1.2 * uBands.y + 0.6 * uBands.x), 0.21 * (1.0 + 0.4 * e), 1.9 + 0.8 * e, uFlow.x, uTurn.x, 0.0, 1.25, 0.2);
  vec2 b = ribbon(q + vec2(0.0, 0.06), 3.8, 0.12 * (lift + 1.5 * uBands.z), 0.11 * (1.0 + 0.4 * e), 2.9 + e, uFlow.y, uTurn.y, 1.7, 1.2, 0.26);
  float shine = 1.0 + 0.8 * e + 0.7 * uPulse;
  vec3 light = (uInk * a.x * a.y + uTint * b.x * b.y * 0.55 * (1.0 - 0.6 * a.x)) * shine;
  return vec4(light, 1.0 - (1.0 - a.x) * (1.0 - 0.7 * b.x));
}

vec4 wrap(vec2 dir) {
  float angle = atan(dir.y, dir.x);
  vec4 sum = vec4(0.0);
  float total = 0.0;
  for (int k = -4; k <= 4; k++) {
    float f = float(k);
    float w = exp(-f * f / 7.0);
    sum += scene(vec2(cos(angle + f * 0.045), sin(angle + f * 0.045)) * 0.8) * w;
    total += w;
  }
  return sum / total;
}

void main() {
  vec2 res = uResolution;
  float m = min(res.x, res.y);
  vec2 frag = (gl_FragCoord.xy - 0.5 * res) / m;
  float appear = smoothstep(0.0, 1.0, uIntro);
  float R = 0.44 * mix(0.94, 1.0, appear) * (1.0 + 0.026 * uEnergy + 0.02 * uPulse);
  vec2 p = frag / R;
  float r = length(p);
  float px = 1.0 / (m * R);
  vec2 key = normalize(vec2(-0.55, 0.83));
  float grain = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  if (r > 1.0 + 2.0 * px) {
    float under = exp(-pow((r - 1.0) / 0.09, 2.0)) * smoothstep(0.2, -0.8, p.y);
    fragColor = vec4(vec3(0.0), uLight * 0.06 * under * appear);
    return;
  }
  float inside = clamp((1.0 - r) / px + 0.5, 0.0, 1.0);
  float rr = min(r, 0.9995);
  vec2 dir = r > 1e-5 ? p / r : vec2(0.0, 1.0);
  float t = clamp((rr - (1.0 - BEVEL)) / BEVEL, 0.0, 1.0);
  vec4 S = scene(lens(dir, rr, 1.0));
  if (t > 0.0) {
    vec4 rim = wrap(dir) * pow(t, 1.6);
    S.rgb += rim.rgb * 1.1;
    S.a = 1.0 - (1.0 - S.a) * (1.0 - rim.a * 0.7);
  }
  float fade = smoothstep(0.2, 1.0, uIntro);
  S.rgb *= fade;
  S.a *= fade;
  float lit = pow(max(dot(dir, key), 0.0), 2.0);
  float back = pow(max(dot(dir, -key), 0.0), 3.0);
  float hair = exp(-pow((1.0 - rr) / (0.004 + 1.2 * px), 2.0));
  float bevel = smoothstep(0.0, 1.0, t);
  if (uLight < 0.5) {
    vec3 rgb = satinLight(S);
    rgb += vec3(hair * (0.1 + 0.7 * lit + 0.35 * back) * (1.0 + 0.4 * uHover + 0.5 * uEnergy));
    rgb = (rgb + vec3(0.012)) * inside * appear + grain;
    fragColor = vec4(max(rgb, 0.0), clamp(max(max(rgb.r, rgb.g), rgb.b), 0.0, 1.0));
  } else {
    vec3 body = vec3(0.99, 0.988, 1.0);
    body = mix(body, vec3(0.9, 0.89, 0.965), bevel * (0.35 + 0.35 * back));
    vec3 col = satinInk(S, uInk, body);
    col = mix(col, vec3(0.62, 0.6, 0.72), hair * (0.35 + 0.3 * back));
    col = mix(col, vec3(1.0), hair * lit * 0.6);
    float a = inside * appear;
    fragColor = vec4(clamp(col + grain, 0.0, 1.0) * a, a);
  }
}
`;

export const ART_FRAG = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uLight;
uniform vec3 uInk;
uniform vec3 uTint;
uniform float uSeed;
uniform float uEnvelope[24];

out vec4 fragColor;
${COMMON}
float envelope(float x) {
  float f = clamp(x, 0.0, 1.0) * 23.0;
  int i = int(floor(f));
  int j = min(i + 1, 23);
  return mix(uEnvelope[i], uEnvelope[j], fract(f));
}

void main() {
  vec2 res = uResolution;
  vec2 q = (gl_FragCoord.xy - 0.5 * res) / (0.5 * min(res.x, res.y));
  q.y -= 0.16;
  q *= 1.12;
  float level = envelope(abs(q.x) / 1.12);
  float s = uSeed * TAU;
  vec2 a = ribbon(q, 3.0, 0.2 * (0.35 + 0.9 * level), 0.17 * (0.8 + 0.3 * level), 2.4, s, s * 1.7, 0.0, 1.05, 0.22);
  vec2 b = ribbon(q + vec2(0.0, 0.06), 4.2, 0.13 * (0.3 + 0.9 * level), 0.1 * (0.8 + 0.3 * level), 3.2, s * 2.3, s * 0.6 + 1.0, 1.7, 1.0, 0.28);
  float gain = 0.45 + 0.85 * level;
  vec4 S = vec4((uInk * a.x * a.y + uTint * b.x * b.y * 0.55 * (1.0 - 0.6 * a.x)) * gain, 1.0 - (1.0 - a.x) * (1.0 - 0.7 * b.x));
  float grain = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  if (uLight < 0.5) {
    vec3 rgb = satinLight(S) + grain;
    fragColor = vec4(max(rgb, 0.0), clamp(max(max(rgb.r, rgb.g), rgb.b), 0.0, 1.0));
  } else {
    float cover = clamp(S.a, 0.0, 1.0) * 0.94;
    vec3 cloth = satinInk(S, uInk, uInk);
    fragColor = vec4(clamp(cloth + grain, 0.0, 1.0) * cover, cover);
  }
}
`;

export const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

export const createProgram = (gl, fragment) => {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  return program;
};

export const INK = {
  dark: { ink: [0.95, 0.94, 1.0], tint: [0.8, 0.78, 0.98] },
  light: { ink: [0.56, 0.44, 0.95], tint: [0.7, 0.58, 0.98] }
};

export const themeIsLight = () => document.documentElement.getAttribute('data-theme') === 'light';
