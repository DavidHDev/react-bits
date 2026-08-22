import React, { useRef, useEffect, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

const Shuffle = ({
  text,
  className = '',
  style = {},
  shuffleDirection = 'right',
  duration = 0.35,
  maxDelay = 0,
  ease = 'power3.out',
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onShuffleComplete,
  shuffleTimes = 1,
  animationMode = 'evenodd',
  loop = false,
  loopDelay = 0,
  stagger = 0.03,
  scrambleCharset = '',
  colorFrom,
  colorTo,
  triggerOnce = true,
  respectReducedMotion = true,
  triggerOnHover = true
}) => {
  const ref = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [ready, setReady] = useState(false);

  const splitRef = useRef(null);
  const wrappersRef = useRef([]);
  const tlRef = useRef(null);
  const playingRef = useRef(false);
  const hoverHandlerRef = useRef(null);

  const userHasFont = useMemo(
    () => (style && style.fontFamily) || (className && /font[-[]/i.test(className)),
    [style, className]
  );

  const scrollTriggerStart = useMemo(() => {
    const startPct = (1 - threshold) * 100;
    const mm = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin || '');
    const mv = mm ? parseFloat(mm[1]) : 0;
    const mu = mm ? mm[2] || 'px' : 'px';
    const sign = mv === 0 ? '' : mv < 0 ? `-=${Math.abs(mv)}${mu}` : `+=${mv}${mu}`;
    return `top ${startPct}%${sign}`;
  }, [threshold, rootMargin]);

  useEffect(() => {
    if ('fonts' in document) {
      if (document.fonts.status === 'loaded') setFontsLoaded(true);
      else document.fonts.ready.then(() => setFontsLoaded(true));
    } else setFontsLoaded(true);
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;

      if (respectReducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        onShuffleComplete?.();
        return;
      }

      const el = ref.current;

      let computedFont = '';
      if (userHasFont) {
        computedFont = style.fontFamily || getComputedStyle(el).fontFamily || '';
      } else {
        computedFont = `'Press Start 2P', sans-serif`;
      }

      const start = scrollTriggerStart;

      const removeHover = () => {
        if (hoverHandlerRef.current && ref.current) {
          ref.current.removeEventListener('mouseenter', hoverHandlerRef.current);
          hoverHandlerRef.current = null;
        }
      };

      const teardown = () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
        if (wrappersRef.current.length) {
          wrappersRef.current.forEach(wrap => {
            const inner = wrap.firstElementChild;
            const orig = inner?.querySelector('[data-orig="1"]');
            if (orig && wrap.parentNode) wrap.parentNode.replaceChild(orig, wrap);
          });
          wrappersRef.current = [];
        }
        try {
          splitRef.current?.revert();
        } catch {
          /* noop */
        }
        splitRef.current = null;
        playingRef.current = false;
      };

      const build = () => {
        teardown();

        splitRef.current = new GSAPSplitText(el, {
          type: 'chars',
          // `leading-normal` overrides the parent's `leading-none` on the char
          // itself: the clip wrapper is sized from this box, and a line-height
          // of 1 makes the mask shorter than the glyph, clipping descenders.
          charsClass: 'shuffle-char leading-normal',
          wordsClass: 'shuffle-word',
          linesClass: 'shuffle-line',
          smartWrap: true,
          reduceWhiteSpace: false
        });

        const chars = splitRef.current.chars || [];
        wrappersRef.current = [];

        const rolls = Math.max(1, Math.floor(shuffleTimes));
        const rand = set => set.charAt(Math.floor(Math.random() * set.length)) || '';

        chars.forEach(ch => {
          const parent = ch.parentElement;
          if (!parent) return;

          const w = ch.getBoundingClientRect().width;
          const h = ch.getBoundingClientRect().height;
          if (!w) return;

          const wrap = document.createElement('span');
          wrap.className = 'inline-block overflow-hidden text-left';
          Object.assign(wrap.style, {
            width: w + 'px',
            height: shuffleDirection === 'up' || shuffleDirection === 'down' ? h + 'px' : 'auto',
            verticalAlign: 'bottom'
          });

          const inner = document.createElement('span');
          inner.className =
            'inline-block will-change-transform origin-left transform-gpu ' +
            (shuffleDirection === 'up' || shuffleDirection === 'down' ? 'whitespace-normal' : 'whitespace-nowrap');

          parent.insertBefore(wrap, ch);
          wrap.appendChild(inner);

          const firstOrig = ch.cloneNode(true);
          firstOrig.className =
            'text-left ' + (shuffleDirection === 'up' || shuffleDirection === 'down' ? 'block' : 'inline-block');
          Object.assign(firstOrig.style, { width: w + 'px', fontFamily: computedFont });

          ch.setAttribute('data-orig', '1');
          ch.className =
            'text-left ' + (shuffleDirection === 'up' || shuffleDirection === 'down' ? 'block' : 'inline-block');
          Object.assign(ch.style, { width: w + 'px', fontFamily: computedFont });

          inner.appendChild(firstOrig);
          for (let k = 0; k < rolls; k++) {
            const c = ch.cloneNode(true);
            if (scrambleCharset) c.textContent = rand(scrambleCharset);
            c.className =
              'text-left ' + (shuffleDirection === 'up' || shuffleDirection === 'down' ? 'block' : 'inline-block');
            Object.assign(c.style, { width: w + 'px', fontFamily: computedFont });
            inner.appendChild(c);
          }
          inner.appendChild(ch);

          const steps = rolls + 1;

          if (shuffleDirection === 'right' || shuffleDirection === 'down') {
            const firstCopy = inner.firstElementChild;
            const real = inner.lastElementChild;
            if (real) inner.insertBefore(real, inner.firstChild);
            if (firstCopy) inner.appendChild(firstCopy);
          }

          let startX = 0;
          let finalX = 0;
          let startY = 0;
          let finalY = 0;

          if (shuffleDirection === 'right') {
            startX = -steps * w;
            finalX = 0;
          } else if (shuffleDirection === 'left') {
            startX = 0;
            finalX = -steps * w;
          } else if (shuffleDirection === 'down') {
            startY = -steps * h;
            finalY = 0;
          } else if (shuffleDirection === 'up') {
            startY = 0;
            finalY = -steps * h;
          }

          if (shuffleDirection === 'left' || shuffleDirection === 'right') {
            gsap.set(inner, { x: startX, y: 0, force3D: true });
            inner.setAttribute('data-start-x', String(startX));
            inner.setAttribute('data-final-x', String(finalX));
          } else {
            gsap.set(inner, { x: 0, y: startY, force3D: true });
            inner.setAttribute('data-start-y', String(startY));
            inner.setAttribute('data-final-y', String(finalY));
          }

          if (colorFrom) inner.style.color = colorFrom;
          wrappersRef.current.push(wrap);
        });
      };

      const inners = () => wrappersRef.current.map(w => w.firstElementChild);

      const randomizeScrambles = () => {
        if (!scrambleCharset) return;
        wrappersRef.current.forEach(w => {
          const strip = w.firstElementChild;
          if (!strip) return;
          const kids = Array.from(strip.children);
          for (let i = 1; i < kids.length - 1; i++) {
            kids[i].textContent = scrambleCharset.charAt(Math.floor(Math.random() * scrambleCharset.length));
          }
        });
      };

      const cleanupToStill = () => {
        wrappersRef.current.forEach(w => {
          const strip = w.firstElementChild;
          if (!strip) return;
          const real = strip.querySelector('[data-orig="1"]');
          if (!real) return;
          strip.replaceChildren(real);
          strip.style.transform = 'none';
          strip.style.willChange = 'auto';
        });
      };

      const play = () => {
        const strips = inners();
        if (!strips.length) return;

        playingRef.current = true;
        const isVertical = shuffleDirection === 'up' || shuffleDirection === 'down';

        const tl = gsap.timeline({
          smoothChildTiming: true,
          repeat: loop ? -1 : 0,
          repeatDelay: loop ? loopDelay : 0,
          onRepeat: () => {
            if (scrambleCharset) randomizeScrambles();
            if (isVertical) {
              gsap.set(strips, { y: (i, t) => parseFloat(t.getAttribute('data-start-y') || '0') });
            } else {
              gsap.set(strips, { x: (i, t) => parseFloat(t.getAttribute('data-start-x') || '0') });
            }
            onShuffleComplete?.();
          },
          onComplete: () => {
            playingRef.current = false;
            if (!loop) {
              cleanupToStill();
              if (colorTo) gsap.set(strips, { color: colorTo });
              onShuffleComplete?.();
              armHover();
            }
          }
        });

        const addTween = (targets, at) => {
          const vars = {
            duration,
            ease,
            force3D: true,
            stagger: animationMode === 'evenodd' ? stagger : 0
          };
          if (isVertical) {
            vars.y = (i, t) => parseFloat(t.getAttribute('data-final-y') || '0');
          } else {
            vars.x = (i, t) => parseFloat(t.getAttribute('data-final-x') || '0');
          }

          tl.to(targets, vars, at);

          if (colorFrom && colorTo) tl.to(targets, { color: colorTo, duration, ease }, at);
        };

        if (animationMode === 'evenodd') {
          const odd = strips.filter((_, i) => i % 2 === 1);
          const even = strips.filter((_, i) => i % 2 === 0);
          const oddTotal = duration + Math.max(0, odd.length - 1) * stagger;
          const evenStart = odd.length ? oddTotal * 0.7 : 0;
          if (odd.length) addTween(odd, 0);
          if (even.length) addTween(even, evenStart);
        } else {
          strips.forEach(strip => {
            const d = Math.random() * maxDelay;
            const vars = {
              duration,
              ease,
              force3D: true
            };
            if (isVertical) {
              vars.y = parseFloat(strip.getAttribute('data-final-y') || '0');
            } else {
              vars.x = parseFloat(strip.getAttribute('data-final-x') || '0');
            }
            tl.to(strip, vars, d);
            if (colorFrom && colorTo) tl.fromTo(strip, { color: colorFrom }, { color: colorTo, duration, ease }, d);
          });
        }

        tlRef.current = tl;
      };

      const armHover = () => {
        if (!triggerOnHover || !ref.current) return;
        removeHover();
        const handler = () => {
          if (playingRef.current) return;
          build();
          if (scrambleCharset) randomizeScrambles();
          play();
        };
        hoverHandlerRef.current = handler;
        ref.current.addEventListener('mouseenter', handler);
      };

      const create = () => {
        build();
        if (scrambleCharset) randomizeScrambles();
        play();
        armHover();
        setReady(true);
      };

      const st = ScrollTrigger.create({ trigger: el, start, once: triggerOnce, onEnter: create });

      return () => {
        st.kill();
        removeHover();
        teardown();
        setReady(false);
      };
    },
    {
      dependencies: [
        text,
        duration,
        maxDelay,
        ease,
        scrollTriggerStart,
        fontsLoaded,
        shuffleDirection,
        shuffleTimes,
        animationMode,
        loop,
        loopDelay,
        stagger,
        scrambleCharset,
        colorFrom,
        colorTo,
        triggerOnce,
        respectReducedMotion,
        triggerOnHover,
        onShuffleComplete,
        userHasFont
      ],
      scope: ref
    }
  );

  const baseTw = 'inline-block whitespace-normal break-words will-change-transform uppercase text-[4rem] leading-none';
  const classes = useMemo(
    () => `${baseTw} ${ready ? 'visible' : 'invisible'} ${className}`.trim(),
    [baseTw, ready, className]
  );
  const Tag = tag || 'p';
  const commonStyle = useMemo(() => ({ textAlign, ...style }), [textAlign, style]);

  return React.createElement(Tag, { ref: ref, className: classes, style: commonStyle }, text);
};

export default Shuffle;
