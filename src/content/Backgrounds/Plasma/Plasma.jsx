'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import './Plasma.css';

const hexToRgb = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 0.5, 0.2];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertex = `#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const ORIGINAL_QUALITY = 60;

const buildFragment = (iterations) => {
  return `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;   
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseInteractive;
uniform float uQuality;
uniform float uStepScale;
uniform float uLightMode;
out vec4 fragColor;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;
  
  vec2 mouseOffset = (uMouse - center) * 0.0002;
  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);
  
  float i, d, z, T = iTime * uSpeed * uDirection;
  vec3 O, p, S;

  for (vec2 r = iResolution.xy, Q; ++i < 60.0; O += o.w/d*o.xyz) {
    p = z*normalize(vec3(C-.5*r,r.y)); 
    p.z -= 4.; 
    S = p;
    d = p.y-T;
    
    p.x += .4*(1.+p.y)*sin(d + p.x*0.1)*cos(.34*d + p.x*0.05); 
    Q = p.xz *= mat2(cos(p.y+vec4(0,11,33,0)-T)); 
    z += d = (abs(sqrt(length(Q*Q)) - .25*(5.+S.y))/3.+8e-4) * uStepScale;
    o = 1.+sin(S.y+p.z*.5+S.z-length(S-p)+vec4(2,1,0,8));
    if (i >= uQuality) break;
  }
  
  o.xyz = tanh(O/1e4);
}

bool finite1(float x){ return !(isnan(x) || isinf(x)); }
vec3 sanitize(vec3 c){
  return vec3(
    finite1(c.r) ? c.r : 0.0,
    finite1(c.g) ? c.g : 0.0,
    finite1(c.b) ? c.b : 0.0
  );
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);
  
  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));
  
  float alpha = length(rgb) * uOpacity;
  if (uLightMode > 0.5) {
    vec3 source = clamp(finalColor, 0.0, 1.0);
    float peak = max(source.r, max(source.g, source.b));
    float floorColor = min(source.r, min(source.g, source.b));
    vec3 chroma = (source - vec3(floorColor)) / max(peak - floorColor, 0.0001);
    vec3 pigment = mix(source / max(peak, 0.0001), chroma, 0.68) * 0.72;
    float energy = clamp(length(rgb) / 1.7320508, 0.0, 1.0);
    float coverage = pow(smoothstep(0.035, 0.72, energy), 0.76) * min(uOpacity, 1.0) * 0.9;
    fragColor = vec4(mix(vec3(1.0), pigment, coverage), 1.0);
  } else {
    fragColor = vec4(finalColor, alpha);
  }
}`;
};

export const Plasma = ({
  color = '#ffffff',
  speed = 1,
  direction = 'forward',
  scale = 1,
  opacity = 1,
  mouseInteractive = true,
  renderScale = 0.55,
  maxDpr = 1.5,
  targetFps = 60,
  iterations = 60,
  lightMode = false,
}) => {
  const containerRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const pendingMouse = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const containerEl = containerRef.current;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const useCustomColor = color ? 1.0 : 0.0;
    const customColorRgb = color ? hexToRgb(color) : [1, 1, 1];

    const directionMultiplier = direction === 'reverse' ? -1.0 : 1.0;

    let renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, maxDpr)
      });
    } catch {
      return;
    }
    const gl = renderer.gl;
    if (!gl) return;
    const canvas = gl.canvas;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    // Rendering at renderScale internally, CSS stretches it back up.
    containerEl.appendChild(canvas);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: vertex,
      fragment: buildFragment(iterations),
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uCustomColor: { value: new Float32Array(customColorRgb) },
        uUseCustomColor: { value: useCustomColor },
        uSpeed: { value: speed * 0.4 },
        uDirection: { value: directionMultiplier },
        uScale: { value: scale },
        uOpacity: { value: opacity },
        uMouse: { value: new Float32Array([0, 0]) },
        uMouseInteractive: { value: mouseInteractive ? 1.0 : 0.0 },
        uQuality: { value: iterations },
        uStepScale: { value: ORIGINAL_QUALITY / iterations },
        uLightMode: { value: lightMode ? 1 : 0 },
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    const handleMouseMove = e => {
      if (!mouseInteractive) return;
      const rect = containerEl.getBoundingClientRect();
      // Store the latest position but don't touch GL state here, the rAF loop picks it up once per rendered frame instead of once per mouse event.
      pendingMouse.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    if (mouseInteractive) {
      containerEl.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    let resizePending = false;
    const setSize = () => {
      const rect = containerEl.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width * renderScale));
      const height = Math.max(1, Math.floor(rect.height * renderScale));
      renderer.setSize(width, height);

      // renderer.setSize also sets canvas.style.width/height to match the (scaled-down) drawing buffer - override that so the canvas still stretches to fill its container via CSS while the buffer stays small.
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      const res = program.uniforms.iResolution.value;
      res[0] = gl.drawingBufferWidth;
      res[1] = gl.drawingBufferHeight;
    };

    const ro = new ResizeObserver(() => {
      // Batch rapid resize events (ex. during a window drag) into one setSize per frame.
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(() => {
        resizePending = false;
        setSize();
      });
    });
    ro.observe(containerEl);
    setSize();

    let raf = 0;
    let contextLost = false;
    let isVisible = true;
    let tabVisible = document.visibilityState !== 'hidden';
    const t0 = performance.now();
    const frameInterval = 1000 / targetFps;
    let lastFrameTime = 0;

    const renderStaticFrame = () => {
      program.uniforms.iTime.value = 0;
      renderer.render({ scene: mesh });
    };

    const loop = t => {
      if (contextLost || !isVisible || !tabVisible) return;

      if (t - lastFrameTime < frameInterval) {
        raf = requestAnimationFrame(loop);
        return;
      }
      lastFrameTime = t;

      if (pendingMouse.current) {
        mousePos.current = pendingMouse.current;
        pendingMouse.current = null;
        const mouseUniform = program.uniforms.uMouse.value;
        mouseUniform[0] = mousePos.current.x;
        mouseUniform[1] = mousePos.current.y;
      }

      let timeValue = (t - t0) * 0.001;
      if (direction === 'pingpong') {
        const pingpongDuration = 10;
        const segmentTime = timeValue % pingpongDuration;
        const isForward = Math.floor(timeValue / pingpongDuration) % 2 === 0;
        const u = segmentTime / pingpongDuration;
        const smooth = u * u * (3 - 2 * u);
        const pingpongTime = isForward ? smooth * pingpongDuration : (1 - smooth) * pingpongDuration;
        program.uniforms.uDirection.value = 1.0;
        program.uniforms.iTime.value = pingpongTime;
      } else {
        program.uniforms.iTime.value = timeValue;
      }
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };

    const handleContextLost = (e) => {
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(raf);
    };
    const handleContextRestored = () => {
      contextLost = false;
      if (isVisible && tabVisible && !prefersReducedMotion) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    const io = new IntersectionObserver(([entry]) => {
      const wasVisible = isVisible;
      isVisible = entry.isIntersecting;
      if (isVisible && !wasVisible && !contextLost && tabVisible && !prefersReducedMotion) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    }, { threshold: 0 });
    io.observe(containerEl);

    const handleVisibilityChange = () => {
      tabVisible = document.visibilityState !== 'hidden';
      if (tabVisible && isVisible && !contextLost && !prefersReducedMotion) {
        cancelAnimationFrame(raf);
        lastFrameTime = 0;
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Respect prefers-reduced-motion: paint one frame and stop, rather than running a perpetual animation loop for users who've asked not to see motion.
    if (prefersReducedMotion) {
      renderStaticFrame();
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      if (mouseInteractive && containerEl) {
        containerEl.removeEventListener('mousemove', handleMouseMove);
      }
      try {
        containerEl?.removeChild(canvas);
      } catch {}
    };
  }, [color, speed, direction, scale, opacity, mouseInteractive, renderScale, maxDpr, targetFps, iterations, lightMode]);

  return <div ref={containerRef} className="plasma-container" />;
};

export default Plasma;
