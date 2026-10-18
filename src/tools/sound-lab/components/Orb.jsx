import { useEffect, useRef } from 'react';
import { INK, ORB_FRAG, createProgram, themeIsLight } from '../engine/velvet';

const RATES = {
  flow: [0.42, -0.58, 0.3],
  turn: [0.36, 0.52, -0.27]
};

export default function Orb({ player, className = '' }) {
  const canvasRef = useRef(null);
  const hoverRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return undefined;
    const program = createProgram(gl, ORB_FRAG);
    if (!program) return undefined;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    const names = [
      'uResolution',
      'uTime',
      'uFlow',
      'uTurn',
      'uEnergy',
      'uPulse',
      'uBands',
      'uLight',
      'uInk',
      'uTint',
      'uIntro',
      'uHover'
    ];
    const uniforms = Object.fromEntries(names.map(name => [name, gl.getUniformLocation(program, name)]));

    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const maxRatio = window.matchMedia?.('(pointer: coarse)').matches ? 1.5 : 2;
    const state = {
      flow: [0.8, 2.3, 4.1],
      turn: [1.1, 0.3, 2.4],
      energy: 0,
      shown: 0,
      slow: 0,
      pulse: 0,
      bands: [0, 0, 0],
      raw: [0, 0, 0],
      hover: 0,
      start: performance.now(),
      last: performance.now(),
      visible: true,
      light: themeIsLight(),
      quality: 1,
      cost: 1 / 60,
      lag: 0,
      calm: 0
    };
    let frame = 0;

    const resize = () => {
      const ratio = Math.max(0.75, Math.min(window.devicePixelRatio || 1, maxRatio) * state.quality);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const draw = now => {
      frame = 0;
      if (!state.visible || document.hidden) return;
      const gap = Math.max(0, (now - state.last) / 1000);
      const dt = Math.min(0.05, gap);
      state.last = now;
      if (gap < 0.25) {
        state.cost += (gap - state.cost) * 0.05;
        state.lag = state.cost > 0.024 ? state.lag + gap : 0;
        state.calm = state.cost < 0.0135 ? state.calm + gap : 0;
        if (state.lag > 1.5 && state.quality > 0.5) {
          state.quality = Math.max(0.5, state.quality * 0.8);
          state.lag = 0;
        } else if (state.calm > 4 && state.quality < 1) {
          state.quality = Math.min(1, state.quality / 0.8);
          state.calm = 0;
        }
      }
      const level = player ? player.level() : 0;
      const fade = Math.exp(-dt / 0.55);
      state.energy = Math.max(level, state.energy * fade);
      state.shown += (state.energy - state.shown) * (1 - Math.exp(-dt / 0.035));
      if (level - state.slow > 0.06) state.pulse = Math.min(1, state.pulse + (level - state.slow) * 2.6);
      state.pulse *= Math.exp(-dt / 0.3);
      state.slow += (level - state.slow) * (1 - Math.exp(-dt / (level > state.slow ? 0.12 : 0.3)));
      if (player) player.bands(state.raw);
      for (let i = 0; i < 3; i += 1) state.bands[i] = Math.max(state.raw[i], state.bands[i] * fade);
      state.hover += (hoverRef.current - state.hover) * (1 - Math.exp(-dt / 0.15));
      const pace = still ? 0.15 : 1 + 6 * state.shown + 3 * state.pulse + 0.6 * state.hover;
      for (let i = 0; i < 3; i += 1) {
        state.flow[i] += dt * RATES.flow[i] * pace;
        state.turn[i] += dt * RATES.turn[i] * pace;
      }
      resize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const time = (now - state.start) / 1000;
      const palette = state.light ? INK.light : INK.dark;
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, still ? 0 : time);
      gl.uniform3f(uniforms.uFlow, ...state.flow);
      gl.uniform3f(uniforms.uTurn, ...state.turn);
      gl.uniform1f(uniforms.uEnergy, still ? state.shown * 0.5 : state.shown);
      gl.uniform1f(uniforms.uPulse, still ? 0 : state.pulse);
      gl.uniform3f(uniforms.uBands, ...state.bands);
      gl.uniform1f(uniforms.uLight, state.light ? 1 : 0);
      gl.uniform3f(uniforms.uInk, ...palette.ink);
      gl.uniform3f(uniforms.uTint, ...palette.tint);
      gl.uniform1f(uniforms.uIntro, Math.min(1, time / 1.1));
      gl.uniform1f(uniforms.uHover, state.hover);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(draw);
    };

    const wake = () => {
      if (!frame && state.visible && !document.hidden) {
        state.last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

    const visibility = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting);
      wake();
    });
    visibility.observe(canvas);
    const theme = new MutationObserver(() => {
      state.light = themeIsLight();
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    document.addEventListener('visibilitychange', wake);
    wake();

    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      theme.disconnect();
      document.removeEventListener('visibilitychange', wake);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [player]);

  return (
    <canvas
      ref={canvasRef}
      className={`snd-orb-canvas ${className}`}
      aria-hidden="true"
      onPointerEnter={() => {
        hoverRef.current = 1;
      }}
      onPointerLeave={() => {
        hoverRef.current = 0;
      }}
    />
  );
}
