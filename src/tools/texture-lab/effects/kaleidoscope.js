const SHADER = `
uniform float uSegments;
uniform float uRotation;
uniform float uZoom;
uniform vec2 uOffset;

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = (vUv - 0.5) * aspect;
  float r = length(p) / uZoom;
  float a = atan(p.y, p.x) + uRotation;
  float sector = TAU / uSegments;
  a = mod(a, sector);
  a = abs(a - sector * 0.5);
  vec2 q = vec2(cos(a), sin(a)) * r;
  vec2 uv = q / aspect + 0.5 + uOffset;
  uv = abs(fract(uv * 0.5) * 2.0 - 1.0);
  uv = 1.0 - abs(1.0 - uv);
  outColor = vec4(texture(uInput, uv).rgb, 1.0);
}`;

export default {
  id: 'kaleidoscope',
  name: 'Kaleidoscope',
  category: 'distort',
  blend: 'normal',
  description: 'Mirrored slices that turn the image into a mandala.',
  animated: true,
  preview: { params: { spin: 0 } },
  animates: params => params.spin !== 0,
  params: [
    { key: 'segments', label: 'Segments', type: 'number', min: 2, max: 24, step: 1, default: 8 },
    { key: 'zoom', label: 'Zoom', type: 'number', min: 0.2, max: 3, step: 0.01, default: 1 },
    { key: 'rotation', label: 'Rotation', type: 'number', min: 0, max: 360, step: 1, default: 0 },
    { key: 'spin', label: 'Spin', type: 'number', min: -2, max: 2, step: 0.01, default: 0.15 },
    { key: 'pan', label: 'Pan', type: 'number', min: -0.5, max: 0.5, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    return ctx.pass('kaleidoscope', SHADER, {
      input,
      uniforms: {
        uSegments: params.segments,
        uRotation: (params.rotation * Math.PI) / 180 + ctx.time * params.spin * 0.25,
        uZoom: params.zoom,
        uOffset: [params.pan, params.pan * 0.4]
      }
    });
  }
};
