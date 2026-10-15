'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

import './ImageTrail.css';

interface ImageTrailProps {
  items?: string[];
  size?: number | string;
  aspectRatio?: number;
  radius?: number | string;
  threshold?: number;
  lifetime?: number;
  appearScale?: number;
  zoom?: number;
  flash?: number;
  exitScale?: number;
  drift?: number;
  rotation?: number;
  sizeVariance?: number;
  alignToMotion?: boolean;
  stack?: number;
  tilt?: number;
  className?: string;
}

interface TrailConfig {
  threshold: number;
  lifetime: number;
  appearScale: number;
  zoom: number;
  flash: number;
  exitScale: number;
  drift: number;
  rotation: number;
  sizeVariance: number;
  alignToMotion: boolean;
  stack: number;
  tilt: number;
}

interface TrailImage {
  el: HTMLElement;
  inner: HTMLElement;
}

const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;

const toCssLength = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

const createTrail = (container: HTMLDivElement, config: React.MutableRefObject<TrailConfig>) => {
  const images: TrailImage[] = Array.from(container.querySelectorAll<HTMLElement>('[data-trail-image]')).map(el => ({
    el,
    inner: el.firstElementChild as HTMLElement
  }));
  const total = images.length;
  const query = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const mouse = { x: 0, y: 0 };
  const last = { x: 0, y: 0 };
  const cache = { x: 0, y: 0 };
  const visible: TrailImage[] = [];
  let started = false;
  let raf = 0;
  let index = -1;
  let zIndex = 1;
  let active = 0;
  let lastAngle = 0;
  let destroyed = false;

  const settle = () => {
    active = Math.max(0, active - 1);
    if (!active && !visible.length) zIndex = 1;
  };

  const retire = (img: TrailImage) => {
    const cfg = config.current;
    gsap.to(img.el, {
      duration: 0.4,
      ease: 'power4',
      opacity: 0,
      scale: cfg.exitScale,
      onComplete: () => {
        if (!active && !visible.length) zIndex = 1;
      }
    });
  };

  const spawn = () => {
    const cfg = config.current;
    if (!total) return;
    index = (index + 1) % total;
    const img = images[index];
    const width = img.el.offsetWidth;
    const height = img.el.offsetHeight;
    const dx = mouse.x - last.x;
    const dy = mouse.y - last.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    let fromAngle = gsap.utils.random(-cfg.rotation, cfg.rotation);
    let toAngle = fromAngle * 0.4;
    if (cfg.alignToMotion) {
      fromAngle = lastAngle;
      toAngle = angle;
      while (toAngle - fromAngle > 180) toAngle -= 360;
      while (toAngle - fromAngle < -180) toAngle += 360;
      lastAngle = toAngle;
    }
    const scale = 1 + gsap.utils.random(-0.5, 0.6) * cfg.sizeVariance;
    const box = container.getBoundingClientRect();
    const tiltX = box.height ? -((mouse.y - box.height / 2) / (box.height / 2)) * cfg.tilt : 0;
    const tiltY = box.width ? ((mouse.x - box.width / 2) / (box.width / 2)) * cfg.tilt : 0;
    const drift = cfg.drift > 0;
    const slide = drift ? 0.6 * cfg.drift : 0;

    ++zIndex;
    ++active;
    gsap.killTweensOf(img.el);
    gsap.killTweensOf(img.inner);
    const visibleIndex = visible.indexOf(img);
    if (visibleIndex >= 0) visible.splice(visibleIndex, 1);

    const timeline = gsap.timeline({ onComplete: settle });
    timeline.fromTo(
      img.el,
      {
        opacity: 1,
        scale: cfg.appearScale * scale,
        zIndex,
        x: cache.x - width / 2,
        y: cache.y - height / 2,
        rotation: fromAngle,
        rotationX: tiltX * 0.5,
        rotationY: tiltY * 0.5
      },
      {
        duration: drift ? 0.9 : 0.4,
        ease: drift ? 'power2' : 'power1',
        scale,
        x: mouse.x - width / 2 + dx * slide,
        y: mouse.y - height / 2 + dy * slide,
        rotation: toAngle,
        rotationX: tiltX,
        rotationY: tiltY
      },
      0
    );
    if (cfg.zoom !== 1 || cfg.flash > 0) {
      timeline.fromTo(
        img.inner,
        { scale: cfg.zoom, filter: `brightness(${1 + cfg.flash * 1.5})` },
        { duration: 0.5, ease: 'power1', scale: 1, filter: 'brightness(1)' },
        0
      );
    }

    if (cfg.stack > 0) {
      visible.push(img);
      const keep = Math.max(1, Math.min(Math.round(cfg.stack), total - 1));
      while (visible.length > keep) {
        const old = visible.shift();
        if (old) retire(old);
      }
      return;
    }

    timeline.to(
      img.el,
      {
        duration: 0.4,
        ease: drift ? 'expo' : 'power3',
        opacity: 0,
        scale: cfg.exitScale * scale
      },
      cfg.lifetime
    );
    if (drift) {
      timeline.to(
        img.el,
        {
          duration: 1.5,
          ease: 'power4',
          x: `+=${dx * cfg.drift * 1.2}`,
          y: `+=${dy * cfg.drift * 1.2}`
        },
        cfg.lifetime
      );
    }
  };

  const loop = () => {
    raf = 0;
    if (destroyed) return;
    const cfg = config.current;
    cache.x = lerp(cache.x, mouse.x, 0.1);
    cache.y = lerp(cache.y, mouse.y, 0.1);
    if (!query?.matches && Math.hypot(mouse.x - last.x, mouse.y - last.y) > cfg.threshold) {
      spawn();
      last.x = mouse.x;
      last.y = mouse.y;
    }
    if (Math.abs(cache.x - mouse.x) > 0.5 || Math.abs(cache.y - mouse.y) > 0.5) {
      raf = requestAnimationFrame(loop);
    }
  };

  const onMove = (e: MouseEvent | TouchEvent) => {
    const rect = container.getBoundingClientRect();
    const point = 'touches' in e ? e.touches[0] : e;
    if (!point) return;
    mouse.x = point.clientX - rect.left;
    mouse.y = point.clientY - rect.top;
    if (!started) {
      started = true;
      cache.x = last.x = mouse.x;
      cache.y = last.y = mouse.y;
    }
    if (!raf) raf = requestAnimationFrame(loop);
  };

  container.addEventListener('mousemove', onMove);
  container.addEventListener('touchmove', onMove, { passive: true });

  return () => {
    destroyed = true;
    if (raf) cancelAnimationFrame(raf);
    container.removeEventListener('mousemove', onMove);
    container.removeEventListener('touchmove', onMove);
    images.forEach(img => {
      gsap.killTweensOf(img.el);
      gsap.killTweensOf(img.inner);
    });
  };
};

export default function ImageTrail({
  items = [],
  size = 190,
  aspectRatio = 1.1,
  radius = 15,
  threshold = 80,
  lifetime = 0.4,
  appearScale = 1,
  zoom = 1,
  flash = 0,
  exitScale = 0.2,
  drift = 0,
  rotation = 0,
  sizeVariance = 0,
  alignToMotion = false,
  stack = 0,
  tilt = 0,
  className = ''
}: ImageTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = useRef<TrailConfig>({} as TrailConfig);
  config.current = {
    threshold,
    lifetime,
    appearScale,
    zoom,
    flash,
    exitScale,
    drift,
    rotation,
    sizeVariance,
    alignToMotion,
    stack,
    tilt
  };

  useEffect(() => {
    if (!containerRef.current) return;
    return createTrail(containerRef.current, config);
  }, [items]);

  return (
    <div
      className={`content ${className}`.trim()}
      ref={containerRef}
      style={
        {
          '--trail-size': toCssLength(size),
          '--trail-aspect': String(aspectRatio),
          '--trail-radius': toCssLength(radius),
          perspective: tilt ? '1000px' : undefined
        } as React.CSSProperties
      }
    >
      {items.map((url, i) => (
        <div className="content__img" data-trail-image="" key={i}>
          <div className="content__img-inner" style={{ backgroundImage: `url(${url})` }} />
        </div>
      ))}
    </div>
  );
}
