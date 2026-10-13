'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const SVG_NS = 'http://www.w3.org/2000/svg';

const NOISE_EFFECTS = ['dissolve', 'mist', 'pixel'];

const LEVELS = Array.from({ length: 33 }, (_, i) => 1 / (1 + Math.exp(-10.8 * (i / 32 - 0.5))));

let maskCount = 0;

const toSeconds = value => (typeof value === 'number' && value > 10 ? value / 1000 : value);

const clamp01 = value => Math.min(Math.max(value, 0), 1);

const smoothstep = (from, to, value) => {
  const t = clamp01((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};

const noiseFor = (kind, size) => {
  if (kind === 'mist') {
    return { frequency: Math.min(Math.max(4 / size, 0.004), 0.02), octaves: 3, edge: 0.35, blur: 10, block: 0 };
  }
  if (kind === 'pixel') {
    const block = 2 * Math.round(Math.min(Math.max(size / 32, 6), 24) / 2);
    return { frequency: 0.5 / block, octaves: 1, edge: 0.06, blur: 0, block };
  }
  return { frequency: 0.6, octaves: 1, edge: 0.15, blur: 0, block: 0 };
};

const createNoiseMask = (target, kind, floor, extraBlur) => {
  const box = target.getBoundingClientRect();
  const { frequency, octaves, edge, blur, block } = noiseFor(kind, Math.sqrt(Math.max(box.width * box.height, 1)));
  const node = (name, attrs, parent) => {
    const child = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => child.setAttribute(key, String(value)));
    parent.appendChild(child);
    return child;
  };
  const svg = node('svg', { width: 0, height: 0, 'aria-hidden': 'true' }, document.body);
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  const id = `fade-content-mask-${(maskCount += 1)}`;
  const filter = node(
    'filter',
    { id, x: '-10%', y: '-10%', width: '120%', height: '120%', 'color-interpolation-filters': 'sRGB' },
    svg
  );
  node(
    'feTurbulence',
    {
      type: 'fractalNoise',
      baseFrequency: frequency,
      numOctaves: octaves,
      seed: Math.floor(Math.random() * 1000),
      result: 'noise'
    },
    filter
  );
  let source = 'noise';
  if (block > 0) {
    const dot = block / 2 - 1;
    node(
      'feColorMatrix',
      { in: 'noise', type: 'matrix', values: '1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1', result: 'gray' },
      filter
    );
    node('feFlood', { x: dot, y: dot, width: 2, height: 2, 'flood-color': '#000', result: 'dot' }, filter);
    node('feComposite', { in: 'dot', in2: 'dot', width: block, height: block, result: 'cell' }, filter);
    node('feTile', { in: 'cell', result: 'grid' }, filter);
    node('feComposite', { in: 'gray', in2: 'grid', operator: 'in', result: 'samples' }, filter);
    node('feMorphology', { in: 'samples', operator: 'dilate', radius: dot, result: 'blocks' }, filter);
    source = 'blocks';
  }
  node(
    'feColorMatrix',
    { in: source, type: 'matrix', values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.43 0 0 0 -0.21' },
    filter
  );
  const curve = node('feFuncA', { type: 'table' }, node('feComponentTransfer', { result: 'mask' }, filter));
  node('feComposite', { in: 'SourceGraphic', in2: 'mask', operator: 'in' }, filter);

  const url = `url(#${id})`;
  const blurFrom = blur + extraBlur;
  const state = { progress: 0 };
  let drawn = -1;

  const render = () => {
    const progress = state.progress;
    if (progress === drawn) return;
    drawn = progress;
    if (progress >= 1) {
      target.style.filter = '';
      target.style.visibility = 'inherit';
      return;
    }
    const front = progress * (1 + 2 * edge) - edge;
    curve.setAttribute(
      'tableValues',
      LEVELS.map(level => (floor + (1 - floor) * (1 - smoothstep(front - edge, front + edge, level))).toFixed(3)).join(
        ' '
      )
    );
    target.style.filter = blurFrom > 0 ? `${url} blur(${(blurFrom * (1 - progress)).toFixed(2)}px)` : url;
    target.style.visibility = progress <= 0 && floor <= 0 ? 'hidden' : 'inherit';
  };

  render();

  return {
    state,
    render,
    remove: () => {
      svg.remove();
      target.style.filter = '';
    }
  };
};

const getLooks = (effect, blur, initialOpacity) => {
  const soften = amount => `blur(${amount}px)`;
  if (effect === 'focus') {
    return [
      { from: { autoAlpha: initialOpacity }, to: { autoAlpha: 1 }, share: 0.6 },
      { from: { filter: soften(12 + blur), scale: 0.97 }, to: { filter: soften(0), scale: 1 }, share: 1 }
    ];
  }
  if (effect === 'develop') {
    return [
      { from: { autoAlpha: initialOpacity }, to: { autoAlpha: 1 }, share: 0.5 },
      {
        from: { filter: `grayscale(1) contrast(0.55) brightness(1.3) ${soften(blur)}` },
        to: { filter: `grayscale(0) contrast(1) brightness(1) ${soften(0)}` },
        share: 1
      }
    ];
  }
  if (blur > 0) {
    return [
      { from: { autoAlpha: initialOpacity, filter: soften(blur) }, to: { autoAlpha: 1, filter: soften(0) }, share: 1 }
    ];
  }
  return [{ from: { autoAlpha: initialOpacity }, to: { autoAlpha: 1 }, share: 1 }];
};

const FadeContent = ({
  children,
  container,
  effect = 'fade',
  blur = false,
  duration = 1,
  ease = 'power2.out',
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  stagger = 0,
  staggerFrom = 'start',
  trigger = 'scroll',
  once = true,
  exit = false,
  scrub = false,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = 'power2.in',
  onStart,
  onComplete,
  onDisappearanceComplete,
  className = '',
  style,
  ...props
}) => {
  const ref = useRef(null);
  const callbacksRef = useRef({ onStart, onComplete, onDisappearanceComplete });
  callbacksRef.current = { onStart, onComplete, onDisappearanceComplete };

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const source = container || document.getElementById('snap-main-container') || null;
    const scroller = typeof source === 'string' ? document.querySelector(source) : source;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let masks = [];
    let follow = null;

    const ctx = gsap.context(() => {
      const targets = stagger > 0 && el.children.length ? Array.from(el.children) : [el];
      gsap.set(el, { visibility: 'visible' });

      if (reduce) {
        callbacksRef.current.onComplete?.();
        return;
      }

      const seconds = Math.max(toSeconds(duration) || 0, 0.01);
      const blurAmount = blur === true ? 10 : Math.max(Number(blur) || 0, 0);
      const startOpacity = clamp01(Number(initialOpacity) || 0);
      const staggerVars = stagger > 0 ? { stagger: { each: toSeconds(stagger), from: staggerFrom } } : {};
      const noisy = NOISE_EFFECTS.includes(effect);
      const looks = noisy ? [] : getLooks(effect, blurAmount, startOpacity);

      if (noisy) masks = targets.map(target => createNoiseMask(target, effect, startOpacity, blurAmount));
      const proxies = masks.map(mask => mask.state);
      const draw = () => masks.forEach(mask => mask.render());

      const reveal = (timeline, position) => {
        if (noisy) {
          timeline.fromTo(
            proxies,
            { progress: 0 },
            { progress: 1, duration: seconds, ease, ...staggerVars, onUpdate: draw },
            position
          );
          return;
        }
        looks.forEach(look =>
          timeline.fromTo(
            targets,
            look.from,
            { ...look.to, duration: seconds * look.share, ease, ...staggerVars },
            position
          )
        );
      };

      const conceal = (timeline, vars) => {
        if (noisy) {
          timeline.to(proxies, { progress: 0, ...vars, onUpdate: draw }, 0);
          return;
        }
        looks.forEach(look => timeline.to(targets, { ...look.from, ...vars }, 0));
      };

      const settle = () => {
        if (noisy) {
          masks.forEach(mask => mask.remove());
          masks = [];
          return;
        }
        gsap.set(targets, { clearProps: 'filter,transform' });
      };

      const scrubbing = scrub && trigger !== 'mount';
      const replaying = !once || exit;
      const disappearing = disappearAfter > 0 && !replaying && !scrubbing;

      const tl = gsap.timeline({
        paused: true,
        onStart: () => callbacksRef.current.onStart?.(),
        onComplete: () => {
          callbacksRef.current.onComplete?.();
          if (scrubbing) return;
          if (disappearing) {
            const out = gsap.timeline({
              delay: toSeconds(disappearAfter),
              onComplete: () => callbacksRef.current.onDisappearanceComplete?.()
            });
            conceal(out, {
              duration: Math.max(toSeconds(disappearDuration) || 0, 0.01),
              ease: disappearEase,
              ...staggerVars
            });
            return;
          }
          if (!replaying || !noisy) settle();
        }
      });
      reveal(tl, scrubbing ? 0 : Math.max(toSeconds(delay) || 0, 0));

      if (trigger === 'mount') {
        tl.play();
        return;
      }

      const measure = () => {
        const view = scroller ? scroller.getBoundingClientRect() : { top: 0, height: window.innerHeight };
        const scrolled = scroller ? scroller.scrollTop : window.scrollY;
        const box = el.getBoundingClientRect();
        return {
          height: view.height,
          scrolled,
          limit: scroller
            ? scroller.scrollHeight - scroller.clientHeight
            : document.documentElement.scrollHeight - window.innerHeight,
          top: box.top - view.top + scrolled,
          bottom: box.bottom - view.top + scrolled
        };
      };

      if (scrubbing) {
        const smoothing = scrub === true ? 0 : Math.max(Number(scrub) || 0, 0);
        const update = () => {
          const { height, scrolled, limit, top, bottom } = measure();
          const zone = height * Math.min(Math.max((1 - 2 * threshold) * 0.4, 0.05), 0.4);
          const revealed = Math.min(top - height * (1 - threshold) + zone, limit);
          let visible = clamp01((scrolled - revealed) / zone + 1);
          if (exit) {
            const outStart = Math.max(bottom - height * threshold - zone, 0);
            const outEnd = Math.max(bottom - height * threshold, outStart + zone / 2);
            visible = Math.min(visible, 1 - clamp01((scrolled - outStart) / (outEnd - outStart)));
          }
          visible = Math.round(visible * 1000) / 1000;
          if (smoothing > 0) {
            follow = gsap.to(tl, { progress: visible, duration: smoothing, ease: 'power3.out', overwrite: true });
          } else {
            tl.progress(visible);
          }
        };
        ScrollTrigger.create({
          trigger: el,
          scroller,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: update,
          onRefresh: update
        });
        update();
        return;
      }

      ScrollTrigger.create({
        trigger: el,
        scroller,
        start: () => {
          const { height, limit, top } = measure();
          const start = top - height * (1 - threshold);
          return start > limit ? limit - 1 : start;
        },
        end: exit ? `bottom ${threshold * 100}%` : undefined,
        once: !replaying,
        onEnter: () => tl.play(),
        onLeave: exit ? () => tl.reverse() : undefined,
        onEnterBack: exit ? () => tl.play() : undefined,
        onLeaveBack: once ? undefined : () => tl.reverse()
      });
    }, el);

    return () => {
      follow?.kill();
      ctx.revert();
      masks.forEach(mask => mask.remove());
    };
  }, [
    container,
    effect,
    blur,
    duration,
    ease,
    delay,
    threshold,
    initialOpacity,
    stagger,
    staggerFrom,
    trigger,
    once,
    exit,
    scrub,
    disappearAfter,
    disappearDuration,
    disappearEase
  ]);

  return (
    <div ref={ref} className={className} style={{ visibility: 'hidden', ...style }} {...props}>
      {children}
    </div>
  );
};

export default FadeContent;
