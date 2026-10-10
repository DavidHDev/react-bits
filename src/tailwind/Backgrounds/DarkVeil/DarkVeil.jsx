'use client';

import { useEffect, useRef } from 'react';

const QUAD_VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FIELD = `#version 300 es
precision highp float;
uniform vec2 uView;
uniform vec2 uScale;
uniform float uZoom;
uniform vec2 uTurn;
uniform float uTime;
uniform float uFlow;
uniform float uWarp;
uniform vec3 uSeed;
uniform vec4 uPointer;
uniform vec2 uDrag;
uniform float uUnfold;
uniform float uDither;
out vec4 outColor;

vec4 sigmoid(vec4 x) {
  return 1.0 / (1.0 + exp(-x));
}

vec4 cppn(vec2 coordinate, vec3 latent) {
  vec4 buf[8];
  buf[6]=vec4(coordinate.x,coordinate.y,latent.x,latent.y);
  buf[7]=vec4(latent.z,sqrt(coordinate.x*coordinate.x+coordinate.y*coordinate.y),0.,0.);
  buf[0]=mat4(vec4(6.5404263,-3.6126034,0.7590882,-1.13613),vec4(2.4582713,3.1660357,1.2219609,0.06276096),vec4(-5.478085,-6.159632,1.8701609,-4.7742867),vec4(6.039214,-5.542865,-0.90925294,3.251348))*buf[6]+mat4(vec4(0.8473259,-5.722911,3.975766,1.6522468),vec4(-0.24321538,0.5839259,-1.7661959,-5.350116),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(0.21808943,1.1243913,-1.7969975,5.0294676);
  buf[1]=mat4(vec4(-3.3522482,-6.0612736,0.55641043,-4.4719114),vec4(0.8631464,1.7432913,5.643898,1.6106541),vec4(2.4941394,-3.5012043,1.7184316,6.357333),vec4(3.310376,8.209261,1.1355612,-1.165539))*buf[6]+mat4(vec4(5.24046,-13.034365,0.009859298,15.870829),vec4(2.987511,3.129433,-0.89023495,-1.6822904),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-5.9457836,-6.573602,-0.8812491,1.5436668);
  buf[0]=sigmoid(buf[0]);buf[1]=sigmoid(buf[1]);
  buf[2]=mat4(vec4(-15.219568,8.095543,-2.429353,-1.9381982),vec4(-5.951362,4.3115187,2.6393783,1.274315),vec4(-7.3145227,6.7297835,5.2473326,5.9411426),vec4(5.0796127,8.979051,-1.7278991,-1.158976))*buf[6]+mat4(vec4(-11.967154,-11.608155,6.1486754,11.237008),vec4(2.124141,-6.263192,-1.7050359,-0.7021966),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-4.17164,-3.2281182,-4.576417,-3.6401186);
  buf[3]=mat4(vec4(3.1832156,-13.738922,1.879223,3.233465),vec4(0.64300746,12.768129,1.9141049,0.50990224),vec4(-0.049295485,4.4807224,1.4733979,1.801449),vec4(5.0039253,13.000481,3.3991797,-4.5561905))*buf[6]+mat4(vec4(-0.1285731,7.720628,-3.1425676,4.742367),vec4(0.6393625,3.714393,-0.8108378,-0.39174938),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-1.1811101,-21.621881,0.7851888,1.2329718);
  buf[2]=sigmoid(buf[2]);buf[3]=sigmoid(buf[3]);
  buf[4]=mat4(vec4(5.214916,-7.183024,2.7228765,2.6592617),vec4(-5.601878,-25.3591,4.067988,0.4602802),vec4(-10.57759,24.286327,21.102104,37.546658),vec4(4.3024497,-1.9625226,2.3458803,-1.372816))*buf[0]+mat4(vec4(-17.6526,-10.507558,2.2587414,12.462782),vec4(6.265566,-502.75443,-12.642513,0.9112289),vec4(-10.983244,20.741234,-9.701768,-0.7635988),vec4(5.383626,1.4819539,-4.1911616,-4.8444734))*buf[1]+mat4(vec4(12.785233,-16.345072,-0.39901125,1.7955981),vec4(-30.48365,-1.8345358,1.4542528,-1.1118771),vec4(19.872723,-7.337935,-42.941723,-98.52709),vec4(8.337645,-2.7312303,-2.2927687,-36.142323))*buf[2]+mat4(vec4(-16.298317,3.5471997,-0.44300047,-9.444417),vec4(57.5077,-35.609753,16.163465,-4.1534753),vec4(-0.07470326,-3.8656476,-7.0901804,3.1523974),vec4(-12.559385,-7.077619,1.490437,-0.8211543))*buf[3]+vec4(-7.67914,15.927437,1.3207729,-1.6686112);
  buf[5]=mat4(vec4(-1.4109162,-0.372762,-3.770383,-21.367174),vec4(-6.2103205,-9.35908,0.92529047,8.82561),vec4(11.460242,-22.348068,13.625772,-18.693201),vec4(-0.3429052,-3.9905605,-2.4626114,-0.45033523))*buf[0]+mat4(vec4(7.3481627,-4.3661838,-6.3037653,-3.868115),vec4(1.5462853,6.5488915,1.9701879,-0.58291394),vec4(6.5858274,-2.2180402,3.7127688,-1.3730392),vec4(-5.7973905,10.134961,-2.3395722,-5.965605))*buf[1]+mat4(vec4(-2.5132585,-6.6685553,-1.4029363,-0.16285264),vec4(-0.37908727,0.53738135,4.389061,-1.3024765),vec4(-0.70647055,2.0111287,-5.1659346,-3.728635),vec4(-13.562562,10.487719,-0.9173751,-2.6487076))*buf[2]+mat4(vec4(-8.645013,6.5546675,-6.3944063,-5.5933375),vec4(-0.57783127,-1.077275,36.91025,5.736769),vec4(14.283112,3.7146652,7.1452246,-4.5958776),vec4(2.7192075,3.6021907,-4.366337,-2.3653464))*buf[3]+vec4(-5.9000807,-4.329569,1.2427121,8.59503);
  buf[4]=sigmoid(buf[4]);buf[5]=sigmoid(buf[5]);
  buf[6]=mat4(vec4(-1.61102,0.7970257,1.4675229,0.20917463),vec4(-28.793737,-7.1390953,1.5025433,4.656581),vec4(-10.94861,39.66238,0.74318546,-10.095605),vec4(-0.7229728,-1.5483948,0.7301322,2.1687684))*buf[0]+mat4(vec4(3.2547753,21.489103,-1.0194173,-3.3100595),vec4(-3.7316632,-3.3792162,-7.223193,-0.23685838),vec4(13.1804495,0.7916005,5.338587,5.687114),vec4(-4.167605,-17.798311,-6.815736,-1.6451967))*buf[1]+mat4(vec4(0.604885,-7.800309,-7.213122,-2.741014),vec4(-3.522382,-0.12359311,-0.5258442,0.43852118),vec4(9.6752825,-22.853785,2.062431,0.099892326),vec4(-4.3196306,-17.730087,2.5184598,5.30267))*buf[2]+mat4(vec4(-6.545563,-15.790176,-6.0438633,-5.415399),vec4(-43.591583,28.551912,-16.00161,18.84728),vec4(4.212382,8.394307,3.0958717,8.657522),vec4(-5.0237565,-4.450633,-4.4768,-5.5010443))*buf[3]+mat4(vec4(1.6985557,-67.05806,6.897715,1.9004834),vec4(1.8680354,2.3915145,2.5231109,4.081538),vec4(11.158006,1.7294737,2.0738268,7.386411),vec4(-4.256034,-306.24686,8.258898,-17.132736))*buf[4]+mat4(vec4(1.6889864,-4.5852966,3.8534803,-6.3482175),vec4(1.3543309,-1.2640043,9.932754,2.9079645),vec4(-5.2770967,0.07150358,-0.13962056,3.3269649),vec4(28.34703,-4.918278,6.1044083,4.085355))*buf[5]+vec4(6.6818056,12.522166,-3.7075126,-4.104386);
  buf[7]=mat4(vec4(-8.265602,-4.7027016,5.098234,0.7509808),vec4(8.6507845,-17.15949,16.51939,-8.884479),vec4(-4.036479,-2.3946867,-2.6055532,-1.9866527),vec4(-2.2167742,-1.8135649,-5.9759874,4.8846445))*buf[0]+mat4(vec4(6.7790847,3.5076547,-2.8191125,-2.7028968),vec4(-5.743024,-0.27844876,1.4958696,-5.0517144),vec4(13.122226,15.735168,-2.9397483,-4.101023),vec4(-14.375265,-5.030483,-6.2599335,2.9848232))*buf[1]+mat4(vec4(4.0950394,-0.94011575,-5.674733,4.755022),vec4(4.3809423,4.8310084,1.7425908,-3.437416),vec4(2.117492,0.16342592,-104.56341,16.949184),vec4(-5.22543,-2.994248,3.8350096,-1.9364246))*buf[2]+mat4(vec4(-5.900337,1.7946124,-13.604192,-3.8060522),vec4(6.6583457,31.911177,25.164474,91.81147),vec4(11.840538,4.1503043,-0.7314397,6.768467),vec4(-6.3967767,4.034772,6.1714606,-0.32874924))*buf[3]+mat4(vec4(3.4992442,-196.91893,-8.923708,2.8142626),vec4(3.4806502,-3.1846354,5.1725626,5.1804223),vec4(-2.4009497,15.585794,1.2863957,2.0252278),vec4(-71.25271,-62.441242,-8.138444,0.50670296))*buf[4]+mat4(vec4(-12.291733,-11.176166,-7.3474145,4.390294),vec4(10.805477,5.6337385,-0.9385842,-4.7348723),vec4(-12.869276,-7.039391,5.3029537,7.5436664),vec4(1.4593618,8.91898,3.5101583,5.840625))*buf[5]+vec4(2.2415268,-6.705987,-0.98861027,-2.117676);
  buf[6]=sigmoid(buf[6]);buf[7]=sigmoid(buf[7]);
  buf[0]=mat4(vec4(1.6794263,1.3817469,2.9625452,0.),vec4(-1.8834411,-1.4806935,-3.5924516,0.),vec4(-1.3279216,-1.0918057,-2.3124623,0.),vec4(0.2662234,0.23235129,0.44178495,0.))*buf[0]+mat4(vec4(-0.6299101,-0.5945583,-0.9125601,0.),vec4(0.17828953,0.18300213,0.18182953,0.),vec4(-2.96544,-2.5819945,-4.9001055,0.),vec4(1.4195864,1.1868085,2.5176322,0.))*buf[1]+mat4(vec4(-1.2584374,-1.0552157,-2.1688404,0.),vec4(-0.7200217,-0.52666044,-1.438251,0.),vec4(0.15345335,0.15196142,0.272854,0.),vec4(0.945728,0.8861938,1.2766753,0.))*buf[2]+mat4(vec4(-2.4218085,-1.968602,-4.35166,0.),vec4(-22.683098,-18.0544,-41.954372,0.),vec4(0.63792,0.5470648,1.1078634,0.),vec4(-1.5489894,-1.3075932,-2.6444845,0.))*buf[3]+mat4(vec4(-0.49252132,-0.39877754,-0.91366625,0.),vec4(0.95609266,0.7923952,1.640221,0.),vec4(0.30616966,0.15693925,0.8639857,0.),vec4(1.1825981,0.94504964,2.176963,0.))*buf[4]+mat4(vec4(0.35446745,0.3293795,0.59547555,0.),vec4(-0.58784515,-0.48177817,-1.0614829,0.),vec4(2.5271258,1.9991658,4.6846647,0.),vec4(0.13042648,0.08864098,0.30187556,0.))*buf[5]+mat4(vec4(-1.7718065,-1.4033192,-3.3355875,0.),vec4(3.1664357,2.638297,5.378702,0.),vec4(-3.1724713,-2.6107926,-5.549295,0.),vec4(-2.851368,-2.249092,-5.3013067,0.))*buf[6]+mat4(vec4(1.5203838,1.2212278,2.8404984,0.),vec4(1.5210563,1.2651345,2.683903,0.),vec4(2.9789467,2.4364579,5.2347264,0.),vec4(2.2270417,1.8825914,3.8028636,0.))*buf[7]+vec4(-1.5468478,-3.6171484,0.24762098,0.);
  buf[0]=sigmoid(buf[0]);
  return vec4(buf[0].x,buf[0].y,buf[0].z,1.);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

mat2 rotate(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, s, -s, c);
}

void main() {
  vec2 css = gl_FragCoord.xy * uScale;
  vec2 uv = (css * 2.0 - uView) / uView.y;
  uv.y = -uv.y;
  vec2 anchor = vec2(uView.x / uView.y, -1.0);

  vec2 pointer = vec2(uPointer.x * 2.0 - uView.x, uPointer.y * 2.0 - uView.y) / uView.y;
  vec2 offset = uv - pointer;
  float touch = uPointer.z * exp(-dot(offset, offset) / (uPointer.w * uPointer.w));
  uv = pointer + rotate(touch * 0.6) * offset;
  uv -= uDrag * touch;

  float t = uTime;
  uv = rotate(0.06 * uFlow * sin(t * 0.17)) * uv;
  uv += 0.05 * uFlow * vec2(sin(t * 0.21), cos(t * 0.13));
  uv = anchor + mat2(uTurn.x, uTurn.y, -uTurn.y, uTurn.x) * uv * 2.0 / uZoom;
  uv += uWarp * vec2(sin(uv.y * 6.283 + t * 0.5), cos(uv.x * 6.283 + t * 0.5)) * 0.05;

  vec3 latent = uSeed + 0.1 * uFlow * vec3(sin(0.3 * t), sin(0.69 * t), sin(0.44 * t));
  latent += touch * vec3(0.12, -0.1, 0.16);
  latent.z += uUnfold;

  vec3 veil = cppn(uv, latent).rgb;
  veil += (hash(gl_FragCoord.xy) - 0.5) * uDither;
  outColor = vec4(veil, 1.0);
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uField;
uniform vec2 uResolution;
uniform vec2 uTexel;
uniform vec3 uColor;
uniform vec3 uInk;
uniform float uGain;
uniform float uSheen;
uniform float uGlow;
uniform float uPresence;
uniform float uGrain;
uniform float uFade;
uniform float uOpacity;
uniform float uTime;
uniform float uLightMode;
uniform vec4 uLight;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float smootherstep(float edge, float x) {
  float t = clamp(x / max(edge, 0.0001), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float level(vec2 uv, float lod) {
  return textureLod(uField, uv, lod).b;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float base = clamp(level(uv, 0.0), 0.0, 1.0);
  float glow = 0.0;
  glow += level(uv, 2.0) * 0.4;
  glow += level(uv, 3.0) * 0.3;
  glow += level(uv, 4.0) * 0.2;
  glow += level(uv, 5.0) * 0.1;

  float dx = level(uv + vec2(uTexel.x, 0.0), 0.0) - level(uv - vec2(uTexel.x, 0.0), 0.0);
  float dy = level(uv + vec2(0.0, uTexel.y), 0.0) - level(uv - vec2(0.0, uTexel.y), 0.0);
  vec2 slope = vec2(dx / (2.0 * uTexel.x) * (uResolution.y / uResolution.x), dy / (2.0 * uTexel.y));
  vec3 normal = normalize(vec3(-slope * 0.12, 1.0));
  vec2 pixel = gl_FragCoord.xy / uResolution.y;
  vec3 toLight = normalize(vec3(uLight.xy - pixel, 0.7));
  vec3 halfway = normalize(toLight + vec3(0.0, 0.0, 1.0));
  float facing = max(dot(normal, halfway), 0.0);
  float sheen = pow(facing, 40.0) * smoothstep(0.08, 0.7, base);
  float near = uLight.z * exp(-dot(uLight.xy - pixel, uLight.xy - pixel) / 0.2);

  float energy = pow(base, 2.2) * uGain * (1.0 + near * 0.4);
  energy += pow(glow, 2.2) * uGlow * uGain;
  energy *= uPresence;
  vec3 light = uColor * energy;
  light += uColor * energy * energy * 0.35;
  vec3 gleam = mix(uColor * 2.0, vec3(1.0), 0.55);
  light += gleam * sheen * uSheen * (0.8 + near * 0.4) * uPresence;

  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  mask *= uOpacity;
  float grain = (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain;
  float dither = (hash(gl_FragCoord.yx + 31.7) - 0.5) / 255.0;

  float peak = max(light.r, max(light.g, light.b));
  if (uLightMode > 0.5) {
    float cover = 1.0 - exp(-peak * 1.6);
    vec3 ink = mix(uInk, uInk * 0.82, smoothstep(0.5, 1.0, cover));
    ink = mix(ink, vec3(1.0), clamp(sheen * uSheen * 1.5, 0.0, 1.0) * 0.8);
    float alpha = clamp(cover * 0.85 * (1.0 + grain) + dither, 0.0, 1.0) * mask;
    outColor = vec4(ink * alpha, alpha);
  } else {
    vec3 color = 1.0 - exp(-light);
    color = pow(color, vec3(1.0 / 2.2));
    color = clamp(color + grain * peak + dither, 0.0, 1.0) * mask;
    outColor = vec4(color, max(color.r, max(color.g, color.b)));
  }
}`;

const INTRO_SECONDS = 1.8;
const MAX_FIELD_PIXELS = 900000;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const variationOffsets = variation => {
  const n = Number(variation) || 0;
  if (!n) return [0, 0, 0];
  const wave = k => {
    const v = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453;
    return v - Math.floor(v) - 0.5;
  };
  return [wave(1), wave(2), wave(3)];
};

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (gl, fragmentSource) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, QUAD_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

export const DarkVeil = ({
  color = '#6b12ff',
  speed = 0.5,
  scale = 1,
  rotation = 0,
  flow = 1,
  warp = 0,
  variation = 0,
  brightness = 1,
  sheen = 0,
  glow = 0.4,
  grain = 0.03,
  quality = 0.5,
  mouseInteraction = true,
  mouseStrength = 1,
  intro = true,
  fade = 0,
  opacity = 1,
  lightMode = false,
  paused = false,
  dpr,
  className = '',
  ...rest
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wakeRef = useRef(null);
  const settings = {
    color: String(color),
    speed,
    scale: Math.max(0.1, scale),
    rotation,
    flow: Math.max(0, flow),
    warp: Math.max(0, warp),
    variation,
    brightness: Math.max(0, brightness),
    sheen: Math.max(0, sheen),
    glow: Math.max(0, glow),
    grain: Math.max(0, grain),
    quality: clamp(quality, 0.25, 1),
    mouseInteraction,
    mouseStrength: Math.max(0, mouseStrength),
    intro,
    fade: clamp(fade, 0, 1),
    opacity: clamp(opacity, 0, 1),
    lightMode,
    paused,
    dpr
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance'
    });
    if (!container || !canvas || !gl) return undefined;

    const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
    const fieldProgram = link(gl, FIELD);
    const compositeProgram = link(gl, COMPOSITE);
    if (!fieldProgram || !compositeProgram) return undefined;

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    const target = { width: 0, height: 0 };
    const sizeTarget = (width, height) => {
      if (target.width === width && target.height === height) return;
      target.width = width;
      target.height = height;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;
      gl.texStorage2D(gl.TEXTURE_2D, levels, floatTargets ? gl.RGBA16F : gl.RGBA8, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    };

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const colorCache = new Map();
    const toLinear = value => {
      if (colorCache.has(value)) return colorCache.get(value);
      let rgb = [1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#ffffff';
        probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r, g, b].map(v => Math.pow(v / 255, 2.2));
      }
      colorCache.set(value, rgb);
      return rgb;
    };

    const view = { width: 1, height: 1, fieldWidth: 1, fieldHeight: 1 };
    const pointer = { x: 0, y: 0, inside: false };
    const state = {
      clock: 0,
      intro: settingsRef.current.intro && !reduce ? 0 : 1,
      touch: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      dragX: 0,
      dragY: 0,
      lightX: 0.5,
      lightY: 0.15
    };
    let raf = 0;
    let last = 0;
    let visible = true;

    const render = () => {
      const s = settingsRef.current;
      const presence = state.intro * state.intro * state.intro * (state.intro * (state.intro * 6 - 15) + 10);
      gl.bindVertexArray(vao);
      sizeTarget(view.fieldWidth, view.fieldHeight);

      const f = fieldProgram.uniforms;
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, target.width, target.height);
      gl.useProgram(fieldProgram.program);
      const angle = (s.rotation * Math.PI) / 180;
      const [sx, sy, sz] = variationOffsets(s.variation);
      gl.uniform2f(f.uView, view.width, view.height);
      gl.uniform2f(f.uScale, view.width / target.width, view.height / target.height);
      gl.uniform1f(f.uZoom, s.scale);
      gl.uniform2f(f.uTurn, Math.cos(angle), Math.sin(angle));
      gl.uniform1f(f.uTime, state.clock);
      gl.uniform1f(f.uFlow, s.flow);
      gl.uniform1f(f.uWarp, s.warp);
      gl.uniform3f(f.uSeed, 0.3948333106474662 + sx, 0.36 + sy, 0.14 + sz);
      gl.uniform4f(f.uPointer, state.x, state.y, state.touch * s.mouseStrength * 0.9, 0.42);
      gl.uniform2f(f.uDrag, (state.dragX * 2) / view.height, (state.dragY * 2) / view.height);
      gl.uniform1f(f.uUnfold, (1 - presence) * 0.45);
      gl.uniform1f(f.uDither, floatTargets ? 0 : 1 / 255);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.generateMipmap(gl.TEXTURE_2D);

      const c = compositeProgram.uniforms;
      const tint = toLinear(s.color);
      const tone = 0.2126 * tint[0] + 0.7152 * tint[1] + 0.0722 * tint[2];
      const depth = Math.min(1, 0.2 / Math.max(tone, 0.001));
      const ink = tint.map(v => Math.pow(Math.min(1, v * depth), 1 / 2.2));
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(compositeProgram.program);
      gl.uniform2f(c.uResolution, canvas.width, canvas.height);
      gl.uniform2f(c.uTexel, 1 / target.width, 1 / target.height);
      gl.uniform3fv(c.uColor, tint);
      gl.uniform3fv(c.uInk, ink);
      gl.uniform1f(c.uGain, 1.15 * s.brightness);
      gl.uniform1f(c.uSheen, 0.5 * s.sheen);
      gl.uniform1f(c.uGlow, s.glow);
      gl.uniform1f(c.uPresence, presence);
      gl.uniform1f(c.uGrain, s.grain);
      gl.uniform1f(c.uFade, s.fade);
      gl.uniform1f(c.uOpacity, s.opacity);
      gl.uniform1f(c.uTime, state.clock % 1000);
      gl.uniform1f(c.uLightMode, s.lightMode ? 1 : 0);
      gl.uniform4f(
        c.uLight,
        (state.lightX * view.width) / view.height,
        1 - state.lightY,
        state.touch * s.mouseStrength,
        0
      );
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(c.uField, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = now => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const moving = !s.paused && !reduce;
      if (moving) state.clock += dt * s.speed;
      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);

      const engaged = s.mouseInteraction && pointer.inside && !reduce;
      if (engaged && state.touch < 0.01) {
        state.x = pointer.x;
        state.y = pointer.y;
      }
      const follow = 1 - Math.exp(-dt * 9);
      const prevX = state.x;
      const prevY = state.y;
      state.x += (pointer.x - state.x) * follow;
      state.y += (pointer.y - state.y) * follow;
      const velX = (state.x - prevX) / Math.max(dt, 0.001);
      const velY = (state.y - prevY) / Math.max(dt, 0.001);
      const dragBlend = 1 - Math.exp(-dt * 5);
      state.dragX += (clamp(velX * 0.12, -120, 120) - state.dragX) * dragBlend;
      state.dragY += (clamp(-velY * 0.12, -120, 120) - state.dragY) * dragBlend;
      state.touch += ((engaged ? 1 : 0) - state.touch) * (1 - Math.exp(-dt * (engaged ? 3 : 1.6)));
      const lightGoalX = engaged ? pointer.x / view.width : 0.5;
      const lightGoalY = engaged ? pointer.y / view.height : 0.15;
      const lightFollow = 1 - Math.exp(-dt * 4);
      state.lightX += (lightGoalX - state.lightX) * lightFollow;
      state.lightY += (lightGoalY - state.lightY) * lightFollow;
      render();

      const settling =
        state.intro < 1 ||
        Math.abs((engaged ? 1 : 0) - state.touch) > 0.002 ||
        Math.abs(state.dragX) + Math.abs(state.dragY) > 0.05 ||
        Math.abs(pointer.x - state.x) + Math.abs(pointer.y - state.y) > 0.3 ||
        Math.abs(lightGoalX - state.lightX) + Math.abs(lightGoalY - state.lightY) > 0.0005;
      if (moving || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      view.width = width;
      view.height = height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      let fieldScale = s.quality;
      if (width * height * fieldScale * fieldScale > MAX_FIELD_PIXELS) {
        fieldScale = Math.sqrt(MAX_FIELD_PIXELS / (width * height));
      }
      view.fieldWidth = Math.max(1, Math.round(width * fieldScale));
      view.fieldHeight = Math.max(1, Math.round(height * fieldScale));
      if (!raf) render();
      wake();
    };

    const onPointerMove = event => {
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
      wake();
    };

    const onPointerLeave = () => {
      pointer.inside = false;
      wake();
    };

    const onVisibility = () => {
      last = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      }
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    let lastQuality = settingsRef.current.quality;
    let lastDpr = settingsRef.current.dpr;
    wakeRef.current = () => {
      const s = settingsRef.current;
      if (s.quality !== lastQuality || s.dpr !== lastDpr) {
        lastQuality = s.quality;
        lastDpr = s.dpr;
        resize();
        return;
      }
      if (!raf) render();
      wake();
    };

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteProgram(fieldProgram.program);
      gl.deleteProgram(compositeProgram.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div
      ref={containerRef}
      className={['relative h-full w-full overflow-hidden', className].filter(Boolean).join(' ')}
      {...rest}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
    </div>
  );
};

export default DarkVeil;
