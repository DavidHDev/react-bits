export const CODE_EXAMPLES = {
  // ! SPLIT-TEXT ------------------------------------------------------------------------
  splitText: {
    installation: `npm install @react-spring/web`,
    usage: `import { SplitText } from "./SplitText";

<SplitText text="Hello!" className="custom-class" delay={50} />`,
    code: `import { useSprings, animated } from '@react-spring/web';
import { useEffect, useRef, useState } from 'react';

import './SplitText.css';

export const SplitText = ({ text, className = '', delay = 100 }) => {
  const letters = text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current); // Unobserve after triggering the animation
        }
      },
      { threshold: 0.1, rootMargin: '-100px' }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  const springs = useSprings(
    letters.length,
    letters.map((_, i) => ({
      from: { opacity: 0, transform: 'translate3d(0,40px,0)' },
      to: inView
        ? async (next) => {
          await next({ opacity: 1, transform: 'translate3d(0,-10px,0)' });
          await next({ opacity: 1, transform: 'translate3d(0,0,0)' });
        }
        : { opacity: 0, transform: 'translate3d(0,40px,0)' },
      delay: i * delay,
    }))
  );

  return (
    <p className={\`split-parent \${className}\`} ref={ref}>
      {springs.map((props, index) => (
        <animated.span key={index} style={props} className="letter">
          {letters[index] === ' ' ? '\u00A0' : letters[index]}
        </animated.span>
      ))}
    </p>
  );
};`,
    css: `.letter {
  display: inline-block;
  will-change: transform, opacity;
}

.split-parent {
  display: inline;
  overflow: hidden;
}`,
    tailwind: `import { useSprings, animated } from '@react-spring/web';
import { useEffect, useRef, useState } from 'react';

export const SplitText = ({ text, className = '', delay = 100 }) => {
  const letters = text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current); // Unobserve after triggering the animation
        }
      },
      { threshold: 0.1, rootMargin: '-100px' }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  const springs = useSprings(
    letters.length,
    letters.map((_, i) => ({
      from: { opacity: 0, transform: 'translate3d(0,40px,0)' },
      to: inView
        ? async (next) => {
            await next({ opacity: 1, transform: 'translate3d(0,-10px,0)' });
            await next({ opacity: 1, transform: 'translate3d(0,0,0)' });
          }
        : { opacity: 0, transform: 'translate3d(0,40px,0)' },
      delay: i * delay,
    }))
  );

  return (
    <p
      className={\`inline-block overflow-hidden \${className}\`}
      ref={ref}
    >
      {springs.map((props, index) => (
        <animated.span
          key={index}
          style={props}
          className="inline-block transform will-change-transform will-change-opacity"
        >
          {letters[index] === ' ' ? ' ' : letters[index]}
        </animated.span>
      ))}
    </p>
  );
};
`
  },

  // ! BLUR-TEXT ------------------------------------------------------------------------
  blurText: {
    installation: `npm install @react-spring/web`,
    usage: `import { BlurText } from "./BlurText";

<BlurText text="Isn't this so cool?!" className="custom-class" delay={50} />`,
    code: `import { useRef, useEffect, useState } from 'react';
import { useSprings, animated } from '@react-spring/web';

import './BlurText.css';

export const BlurText = ({ text, delay = 200, className = '' }) => {
  const words = text.split(' ');
  const [inView, setInView] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current); // Unobserve after triggering the animation
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  const springs = useSprings(
    words.length,
    words.map((_, i) => ({
      from: { filter: 'blur(10px)', opacity: 0, transform: 'translate3d(0,-50px,0)' },
      to: inView
        ? async (next) => {
          await next({ filter: 'blur(5px)', opacity: 0.5, transform: 'translate3d(0,5px,0)' });
          await next({ filter: 'blur(0px)', opacity: 1, transform: 'translate3d(0,0,0)' });
        }
        : { filter: 'blur(10px)', opacity: 0 },
      delay: i * delay,
    }))
  );

  return (
    <p ref={ref} className={className}>
      {springs.map((props, index) => (
        <animated.span key={index} style={props} className="word">
          {words[index]}&nbsp;
        </animated.span>
      ))}
    </p>
  );
};`,
    css: `.word {
  display: inline-block;
  will-change: transform, filter, opacity;
}`,
    tailwind: `import { useRef, useEffect, useState } from 'react';
import { useSprings, animated } from '@react-spring/web';

export const BlurText = ({ text, delay = 200, className = '' }) => {
  const words = text.split(' ');
  const [inView, setInView] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current); // Unobserve after triggering the animation
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  const springs = useSprings(
    words.length,
    words.map((_, i) => ({
      from: { filter: 'blur(10px)', opacity: 0, transform: 'translate3d(0,-50px,0)' },
      to: inView
        ? async (next) => {
            await next({ filter: 'blur(5px)', opacity: 0.5, transform: 'translate3d(0,5px,0)' });
            await next({ filter: 'blur(0px)', opacity: 1, transform: 'translate3d(0,0,0)' });
          }
        : { filter: 'blur(10px)', opacity: 0 },
      delay: i * delay,
    }))
  );

  return (
    <p ref={ref} className={\`inline-block \${className}\`}>
      {springs.map((props, index) => (
        <animated.span
          key={index}
          style={props}
          className="inline-block will-change-transform will-change-filter will-change-opacity"
        >
          {words[index]}&nbsp;
        </animated.span>
      ))}
    </p>
  );
};`
  },

  // ! BLOB-CURSOR ------------------------------------------------------------------------
  blobCursor: {
    installation: `npm i @react-spring/web`,
    usage: `import BlobCursor from './BlobCursor'
    
<BlobCursor />`,
    code: `import { useTrail, animated } from '@react-spring/web'
import { useRef, useEffect, useCallback } from 'react';

import './BlobCursor.css';

const fast = { tension: 1200, friction: 40 };
const slow = { mass: 10, tension: 200, friction: 50 };
const trans = (x, y) => \`translate3d(\${x}px,\${y}px,0) translate3d(-50%,-50%,0)\`;

export default function BlobCursor({ blobType = 'circle', fillColor = '#00f0ff' }) {
  const [trail, api] = useTrail(3, i => ({
    xy: [0, 0],
    config: i === 0 ? fast : slow,
  }));

  const ref = useRef();

  const updatePosition = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      return { left: rect.left, top: rect.top };
    }
    return { left: 0, top: 0 };
  }, []);

  const handleMove = e => {
    const { left, top } = updatePosition();
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    api.start({ xy: [x - left, y - top] });
  };

  useEffect(() => {
    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updatePosition]);

  return (
    <div className='container'>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="blob">
          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="30" />
          <feColorMatrix
            in="blur"
            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 35 -10"
          />
        </filter>
      </svg>
      <div
        ref={ref}
        className='main'
        onMouseMove={handleMove}
        onTouchMove={handleMove}
      >
        {trail.map((props, index) => (
          <animated.div key={index} style={{
            transform: props.xy.to(trans),
            borderRadius: blobType === 'circle' ? '50%' : '0%',
            backgroundColor: fillColor
          }} />
        ))}
      </div>
    </div>
  );
}`,
    css: `.container {
  width: 100%;
  height: 100%;
}

.main > div {
  position: absolute;
  will-change: transform;
  border-radius: 50%;
  background: lightcoral;
  box-shadow: 10px 10px 5px 0px rgba(0, 0, 0, 0.75);
  opacity: 0.6;
}

.main > div:nth-child(1) {
  width: 60px;
  height: 60px;
}

.main > div:nth-child(2) {
  width: 125px;
  height: 125px;
}

.main > div:nth-child(3) {
  width: 75px;
  height: 75px;
}

.main > div::after {
  content: "";
  position: absolute;
  top: 20px;
  left: 20px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
}

.main > div:nth-child(2)::after {
  top: 35px;
  left: 35px;
  width: 35px;
  height: 35px;
}

.main > div:nth-child(3)::after {
  top: 25px;
  left: 25px;
  width: 25px;
  height: 25px;
}

.main {
  position: absolute;
  width: 100%;
  height: 100%;
  filter: url("#blob");
  overflow: hidden;
  background: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  cursor: default;
}`
  },


  // ! WAVE-TEXT ------------------------------------------------------------------------
  waveText: {
    installation: `npm install @react-spring/web`,
    usage: `import WaveText from './WaveText'

<WaveText />`,
    code: `import { useEffect, useState } from 'react'
import { useSpring, animated } from '@react-spring/web'

import './WaveText.css';

const AnimFeTurbulence = animated('feTurbulence')
const AnimFeDisplacementMap = animated('feDisplacementMap')

export default function WaveText() {
  // Set the initial state to true to trigger the animation on mount
  const [open, setOpen] = useState(true)

  // Optionally, use useEffect to ensure the animation starts on mount
  useEffect(() => {
    setOpen(true)
  }, [])

  const [{ freq, factor, scale, opacity }] = useSpring(() => ({
    reverse: open,
    from: { factor: 150, opacity: 1, scale: 1, freq: '0.0, 0.0' },
    to: { factor: 10, opacity: 0, scale: 0.9, freq: '0.0175, 0.0' },
    config: { duration: 3000 },
  }))

  return (
    <div className="container">
      <animated.svg className="svg-width" style={{ scale, opacity }} viewBox="0 0 1278 446">
        <defs>
          <filter id="waves">
            <AnimFeTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" result="TURB" seed="8" />
            <AnimFeDisplacementMap
              xChannelSelector="R"
              yChannelSelector="G"
              in="SourceGraphic"
              in2="TURB"
              result="DISP"
              scale={factor}
            />
          </filter>
        </defs>
        <g filter="url(#waves)">

          {/* Replace this path with your desired SVG path */}
          <path
            d="M179.53551,113.735463 C239.115435,113.735463 292.796357,157.388081 292.796357,245.873118 L292.796357,415.764388 L198.412318,415.764388 L198.412318,255.311521 C198.412318,208.119502 171.866807,198.681098 151.220299,198.681098 C131.753591,198.681098 94.5898754,211.658904 94.5898754,264.749925 L94.5898754,415.764388 L0.205836552,415.764388 L0.205836552,0.474616471 L94.5898754,0.474616471 L94.5898754,151.489079 C114.646484,127.893069 145.321296,113.735463 179.53551,113.735463 Z M627.269795,269.469127 C627.269795,275.95803 626.679895,285.396434 626.089994,293.065137 L424.344111,293.065137 C432.012815,320.790448 457.378525,340.257156 496.901841,340.257156 C520.497851,340.257156 554.712065,333.768254 582.437376,322.560149 L608.392987,397.47748 C608.392987,397.47748 567.09997,425.202792 494.54224,425.202792 C376.562192,425.202792 325.240871,354.414762 325.240871,269.469127 C325.240871,183.343692 377.152092,113.735463 480.974535,113.735463 C574.178773,113.735463 627.269795,171.545687 627.269795,269.469127 Z M424.344111,236.434714 L528.166554,236.434714 C528.166554,216.378105 511.649347,189.242694 476.255333,189.242694 C446.17042,189.242694 424.344111,216.378105 424.344111,236.434714 Z M659.714308,0.474616471 L754.098347,0.474616471 L754.098347,415.764388 L659.714308,415.764388 L659.714308,0.474616471 Z M810.13887,0.474616471 L904.522909,0.474616471 L904.522909,415.764388 L810.13887,415.764388 L810.13887,0.474616471 Z M1097.42029,113.735463 C1191.80433,113.735463 1257.87315,183.343692 1257.87315,269.469127 C1257.87315,355.594563 1192.98413,425.202792 1097.42029,425.202792 C997.727148,425.202792 936.967423,355.594563 936.967423,269.469127 C936.967423,183.343692 996.547347,113.735463 1097.42029,113.735463 Z M1097.42029,340.257156 C1133.9941,340.257156 1163.48912,308.402543 1163.48912,269.469127 C1163.48912,230.535711 1133.9941,198.681098 1097.42029,198.681098 C1060.84647,198.681098 1031.35146,230.535711 1031.35146,269.469127 C1031.35146,308.402543 1060.84647,340.257156 1097.42029,340.257156 Z"
            fill="#ffffff"
          />
          {/* Replace this path with your desired SVG path */}
        </g>
      </animated.svg>
    </div>
  )
}`,
    css: `.svg-width {
  width: 350px;
}

.container {
  display: flex;
  align-items: center;
  height: 100%;
  justify-content: center;
}`,
    tailwind: `import { useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';

const AnimFeTurbulence = animated('feTurbulence');
const AnimFeDisplacementMap = animated('feDisplacementMap');

export default function WaveText() {
  // Set the initial state to true to trigger the animation on mount
  const [open, setOpen] = useState(true);

  // Optionally, use useEffect to ensure the animation starts on mount
  useEffect(() => {
    setOpen(true);
  }, []);

  const [{ freq, factor, scale, opacity }] = useSpring(() => ({
    reverse: open,
    from: { factor: 150, opacity: 1, scale: 1, freq: '0.0, 0.0' },
    to: { factor: 10, opacity: 0, scale: 0.9, freq: '0.0175, 0.0' },
    config: { duration: 3000 },
  }));

  return (
    <div className="flex items-center justify-center h-full">
      <animated.svg
        className="w-[350px]"
        style={{ scale, opacity }}
        viewBox="0 0 1278 446"
      >
        <defs>
          <filter id="waves">
            <AnimFeTurbulence
              type="fractalNoise"
              baseFrequency={freq}
              numOctaves="2"
              result="TURB"
              seed="8"
            />
            <AnimFeDisplacementMap
              xChannelSelector="R"
              yChannelSelector="G"
              in="SourceGraphic"
              in2="TURB"
              result="DISP"
              scale={factor}
            />
          </filter>
        </defs>
        <g filter="url(#waves)">
          {/* Replace this path with your desired SVG path */}
          <path
            d="M179.53551,113.735463 C239.115435,113.735463 292.796357,157.388081 292.796357,245.873118 L292.796357,415.764388 L198.412318,415.764388 L198.412318,255.311521 C198.412318,208.119502 171.866807,198.681098 151.220299,198.681098 C131.753591,198.681098 94.5898754,211.658904 94.5898754,264.749925 L94.5898754,415.764388 L0.205836552,415.764388 L0.205836552,0.474616471 L94.5898754,0.474616471 L94.5898754,151.489079 C114.646484,127.893069 145.321296,113.735463 179.53551,113.735463 Z M627.269795,269.469127 C627.269795,275.95803 626.679895,285.396434 626.089994,293.065137 L424.344111,293.065137 C432.012815,320.790448 457.378525,340.257156 496.901841,340.257156 C520.497851,340.257156 554.712065,333.768254 582.437376,322.560149 L608.392987,397.47748 C608.392987,397.47748 567.09997,425.202792 494.54224,425.202792 C376.562192,425.202792 325.240871,354.414762 325.240871,269.469127 C325.240871,183.343692 377.152092,113.735463 480.974535,113.735463 C574.178773,113.735463 627.269795,171.545687 627.269795,269.469127 Z M424.344111,236.434714 L528.166554,236.434714 C528.166554,216.378105 511.649347,189.242694 476.255333,189.242694 C446.17042,189.242694 424.344111,216.378105 424.344111,236.434714 Z M659.714308,0.474616471 L754.098347,0.474616471 L754.098347,415.764388 L659.714308,415.764388 L659.714308,0.474616471 Z M810.13887,0.474616471 L904.522909,0.474616471 L904.522909,415.764388 L810.13887,415.764388 L810.13887,0.474616471 Z M1097.42029,113.735463 C1191.80433,113.735463 1257.87315,183.343692 1257.87315,269.469127 C1257.87315,355.594563 1192.98413,425.202792 1097.42029,425.202792 C997.727148,425.202792 936.967423,355.594563 936.967423,269.469127 C936.967423,183.343692 996.547347,113.735463 1097.42029,113.735463 Z M1097.42029,340.257156 C1133.9941,340.257156 1163.48912,308.402543 1163.48912,269.469127 C1163.48912,230.535711 1133.9941,198.681098 1097.42029,198.681098 C1060.84647,198.681098 1031.35146,230.535711 1031.35146,269.469127 C1031.35146,308.402543 1060.84647,340.257156 1097.42029,340.257156 Z"
            fill="#ffffff"
          />
          {/* Replace this path with your desired SVG path */}
        </g>
      </animated.svg>
    </div>
  );
}`
  },


  // ! ANIMATED-CONTAINER ------------------------------------------------------------------------
  animatedContainer: {
    installation: `npm install @react-spring/web`,
    usage: `import AnimatedContainer from './AnimatedContainer'

<AnimatedContainer reverse={true} direction='vertical' distance={100}>
    {/* Anything placed inside this container will be animated into view */}
</AnimatedContainer>`,
    code: `import { useRef, useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';

export const AnimatedContainer = ({ children, distance = 100, direction = 'vertical', reverse = false }) => {
  const [inView, setInView] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current); // Unobserve after triggering the animation
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  const directions = {
    vertical: "Y",
    horizontal: "X"
  }

  const springProps = useSpring({
    from: { transform: \`translate\${directions[direction]}(\${reverse ? \`-\${distance}px\` : \`\${distance}px\`})\` },
    to: inView ? { transform: \`translate\${directions[direction]}(0px)\` } : \`translate\${directions[direction]}(\${reverse && '-'}\${distance}px)\`,
    config: { tension: 50, friction: 25 },
  });

  return (
    <animated.div ref={ref} style={springProps}>
      {children}
    </animated.div>
  );
};`
  },

  // ! FADE ------------------------------------------------------------------------
  fade: {
    usage: `import Fade from './Fade'
    
<Fade blur={true}>
    {/* Anything placed inside this container will be fade into view */}
</Fade>`,
    code: `import { useRef, useEffect, useState } from 'react';

const Fade = ({ children, blur = false }) => {
  const [inView, setInView] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current); // Unobserve after triggering the animation
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transition: 'opacity 1s ease-out, filter 1s ease-out',
        filter: blur ? (inView ? 'blur(0px)' : 'blur(10px)') : 'none',
      }}
    >
      {children}
    </div>
  );
};

export default Fade;`
  },

  // ! STACK ------------------------------------------------------------------------
  stack: {
    installation: `npm i @react-spring/web react-use-gesture`,
    usage: `import Stack from './Stack'
    
<Stack />`,
    code: `import { useState } from 'react';
import { useSprings, animated, to as interpolate } from '@react-spring/web';
import { useDrag } from 'react-use-gesture';

import './Stack.css';

const cards = ['🍎', '🍊', '🍋', '🍐', '🍏', '🍉'];

const to = (i) => ({
  x: 0,
  y: i * -4,
  scale: 1,
  rot: -10 + Math.random() * 20,
  delay: i * 100,
});
const from = () => ({ x: 0, rot: 0, scale: 1.5, y: -1000 });

const trans = (r, s) =>
  \`rotateY(\${r / 10}deg) rotateZ(\${r}deg) scale(\${s})\`;

function Stack() {
  const [gone] = useState(() => new Set());
  const [props, api] = useSprings(cards.length, (i) => ({
    ...to(i),
    from: from(i),
  }));
  const bind = useDrag(
    ({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
      const trigger = velocity > 0.2;
      const dir = xDir < 0 ? -1 : 1;
      if (!down && trigger) gone.add(index);
      api.start((i) => {
        if (index !== i) return;
        const isGone = gone.has(index);
        const x = isGone
          ? (200 + window.innerWidth) * dir
          : down
            ? mx
            : 0;
        const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0);
        const scale = down ? 1.1 : 1;
        return {
          x,
          rot,
          scale,
          delay: undefined,
          config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
        };
      });
      if (!down && gone.size === cards.length)
        setTimeout(() => {
          gone.clear();
          api.start((i) => to(i));
        }, 600);
    }
  );
  return (
    <>
      {props.map(({ x, y, rot, scale }, i) => (
        <animated.div className='stack' key={i} style={{ x, y }}>
          {/* Update the card content to display whatever you want */}
          <animated.div
            {...bind(i)}
            style={{
              transform: interpolate([rot, scale], trans),
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '300px',
              height: '300px',
              backgroundColor: '#000',
              border: '1px solid #ffffff1c',
              borderRadius: '10px',
              fontSize: '90px', // Adjust font size as needed
              fontWeight: 'bold',
            }}
          >
            {cards[i]}
          </animated.div>
        </animated.div>
      ))}
    </>
  );
}

export default Stack;`,
    css: `.stack {
  position: absolute;
  top: 20%;
  width: 200px;
  height: 250px;
  will-change: transform;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}

.stack > div {
  background-size: auto 85%;
  background-repeat: no-repeat;
  background-position: center center;
  width: 45vh;
  max-width: 200px;
  height: 85vh;
  max-height: 250px;
  will-change: transform;
  user-select: none;
  border-radius: 10px;
  box-shadow: 0 5px 50px rgba(129, 129, 129, 0.05);

  &:hover {
    cursor: grab;
  }

  &:active {
    cursor: grabbing;
  }
}`
  },

  // ! FOLLOW-CURSOR ------------------------------------------------------------------------
  followCursor: {
    installation: `npm i @react-spring/web react-use-gesture`,
    usage: `import FollowCursor from './FollowCursor'

<FollowCursor />`,
    code: `import { useRef, useEffect } from "react";
import { useSpring, animated, to } from "@react-spring/web";
import { useGesture } from "react-use-gesture";

import './FollowCursor.css';

// Utility functions for calculating rotations
const calcX = (y, ly) => \`-(y - ly - window.innerHeight / 2) / 20;\`
const calcY = (x, lx) => \`(x - lx - window.innerWidth / 2) / 20;\`

// Function to handle wheel translations
const wheel = (y) => {
  const imgHeight = window.innerWidth * 0.3 - 20;
  return \`translateY(\${-imgHeight * (y < 0 ? 6 : 1) - (y % (imgHeight * 5))}px\`;
};

// Utility to detect if the device is mobile
const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export default function FollowCursor() {
  const domTarget = useRef(null);

  // Spring configuration for animations
  const [{ x, y, rotateX, rotateY, rotateZ, zoom, scale }, api] = useSpring(
    () => ({
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
      zoom: 0,
      x: 0,
      y: 0,
      config: { mass: 5, tension: 350, friction: 40 },
    })
  );

  const [{ wheelY }, wheelApi] = useSpring(() => ({ wheelY: 0 }));

  useEffect(() => {
    if (!isMobile()) {
      // For desktop: Add mouse move listener to follow cursor
      const handleMouseMove = (event) => {
        const px = event.clientX;
        const py = event.clientY;

        api({
          x: px - window.innerWidth / 2,
          y: py - window.innerHeight / 2,
          rotateX: calcX(py, y.get()),
          rotateY: calcY(px, x.get()),
          scale: 1.1,
        });
      };

      // Add event listener
      window.addEventListener("mousemove", handleMouseMove);

      // Clean up listener on component unmount
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
    } else {
      // Prevent default gestures on iOS
      const preventDefault = (e) => e.preventDefault();
      document.addEventListener("gesturestart", preventDefault);
      document.addEventListener("gesturechange", preventDefault);

      return () => {
        document.removeEventListener("gesturestart", preventDefault);
        document.removeEventListener("gesturechange", preventDefault);
      };
    }
  }, [api, y, x]);

  // Apply gestures for mobile drag
  useGesture(
    {
      onDrag: ({ active, offset: [x, y] }) =>
        api({ x, y, rotateX: 0, rotateY: 0, scale: active ? 1 : 1.1 }),
      onPinch: ({ offset: [d, a] }) => api({ zoom: d / 200, rotateZ: a }),
    },
    { domTarget, eventOptions: { passive: false }, enabled: isMobile() }
  );

  // Handle wheel gesture for desktop
  useGesture(
    {
      onWheel: ({ event, offset: [, y] }) => {
        event.preventDefault();
        wheelApi.set({ wheelY: y });
      },
    },
    { domTarget, eventOptions: { passive: false } }
  );

  return (
    <div className="container">
      <animated.div
        ref={domTarget}
        className="card"
        style={{
          transform: "perspective(600px)",
          x,
          y,
          scale: to([scale, zoom], (s, z) => s + z),
          rotateX,
          rotateY,
          rotateZ,
        }}
      >
        <animated.div style={{ transform: wheelY.to(wheel) }}>
          <div>
            {/* ADD OTHER THINGS YOU NEED HERE */}
          </div>
        </animated.div>
      </animated.div>
    </div>
  );
}`,
    css: `// Customize the card below as you desire

.card {
  position: absolute;
  width: 100px;
  height: 100px;
  background: url("https://res.cloudinary.com/practicaldev/image/fetch/s--8mUhEkXE--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_66%2Cw_800/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/km2w1ppw3yw9pd9na7mu.gif");
  background-size: cover;
  border-radius: 5px;
  box-shadow: 0px 10px 30px -5px rgba(0, 0, 0, 0.3);
  transition:
    box-shadow 0.5s,
    opacity 0.5s;
  will-change: transform;
  border: 1px solid white;
  overflow: hidden;
  touch-action: none;
}

.card:hover {
  box-shadow: 0px 30px 100px -10px rgba(0, 0, 0, 0.4);
}

.card > div {
  will-change: transform;
  height: 100%;
  margin: 0vw 0;
}

.card > div > * {
  height: 100%;
  background-size: cover;
  background-position: center center;
  margin: 0vw 0;
}`
  },

  // ! MAGNET ------------------------------------------------------------------------
  magnet: {
    usage: `import Magnet from './Magnet'

<Magnet padding={50} disabled={false}>
    <p>Star React Bits on GitHub!</p>
</Magnet>`,
    code: `import { useState, useRef, useEffect } from "react";

const Magnet = ({ children, padding = 100, disabled = false }) => {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const magnetRef = useRef(null);

  useEffect(() => {
    if (disabled) {
      // Reset position when disabled
      setPosition({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e) => {
      if (magnetRef.current) {
        const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const distX = Math.abs(centerX - e.clientX);
        const distY = Math.abs(centerY - e.clientY);

        // Check if the mouse is within the padding area
        if (distX < width / 2 + padding && distY < height / 2 + padding) {
          setIsActive(true);
          // Calculate the offset
          const offsetX = (e.clientX - centerX) / 2;
          const offsetY = (e.clientY - centerY) / 2;
          setPosition({ x: offsetX, y: offsetY });
        } else {
          setIsActive(false);
          setPosition({ x: 0, y: 0 });
        }
      }
    };

    // Attach mouse move event listener
    window.addEventListener("mousemove", handleMouseMove);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [padding, disabled]);

  return (
    <div ref={magnetRef} style={{ position: "relative", display: "inline-block" }}>
      <div
        style={{
          transform: \`translate3d(\${position.x}px, \${position.y}px, 0)\`,
          transition: isActive ? "transform 0.3s ease-out" : "transform 0.5s ease-in-out",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;`
  },

  // ! DOCK ------------------------------------------------------------------------

  dock: {
    installation: `npm i @react-spring/web`,
    usage: `import Dock from './Dock';

<Dock collapsible={false} position="left" responsive="bottom" />`,
    code: `import { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import './Dock.css'; // Import your CSS for styling

const Dock = ({ position = 'bottom', collapsible = false, responsive = 'bottom' }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [isDockVisible, setDockVisible] = useState(!collapsible);
  const [currentPosition, setCurrentPosition] = useState(position);

  const dockItems = ['🍕', '🍔', '🌭', '🌮', '🌯'];

  const handleMouseEnter = (index) => {
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const handleParentMouseEnter = () => {
    if (collapsible) {
      setDockVisible(true);
    }
  };

  const handleParentMouseLeave = () => {
    if (collapsible) {
      setDockVisible(false);
    }
  };

  // Update position based on screen size and responsive prop
  useEffect(() => {
    const updatePosition = () => {
      if (responsive && window.innerWidth <= 768) { // Adjust threshold as needed
        setCurrentPosition(responsive);
      } else {
        setCurrentPosition(position);
      }
    };

    updatePosition(); // Initial update

    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [position, responsive, collapsible]);

  const getDockStyle = () => {
    const flexDirection = currentPosition === 'left' || currentPosition === 'right' ? 'column' : 'row';
    return { flexDirection };
  };

  const scaleSpring = (index) => {
    const translateValue = (() => {
      if (hoverIndex === index) {
        switch (currentPosition) {
          case 'left':
            return 'translateX(5px) translateY(0px)';
          case 'right':
            return 'translateX(-5px) translateY(0px)';
          case 'top':
            return 'translateX(0px) translateY(5px)';
          case 'bottom':
            return 'translateX(0px) translateY(-5px)';
          default:
            return 'translateX(0px) translateY(0px)';
        }
      } else {
        return 'translateX(0px) translateY(0px)';
      }
    })();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSpring({
      transform:
        hoverIndex === index
          ? \`scale(1.5) \${translateValue}\`
          : hoverIndex !== null && Math.abs(hoverIndex - index) === 1
            ? \`scale(1.3) translateX(0px) translateY(0px)\`
            : \`scale(1) translateX(0px) translateY(0px)\`,
      config: { tension: 200, friction: 15 },
    });
  };

  const visibilitySpring = useSpring({
    opacity: isDockVisible ? 1 : 0,
    config: { tension: 120, friction: 14 },
  });

  return (
    <div
      className={\`dock-container \${currentPosition}\`}
      onMouseEnter={handleParentMouseEnter}
      onMouseLeave={handleParentMouseLeave}
    >
      <animated.div className="dock" style={{ ...getDockStyle(), ...visibilitySpring }}>
        {dockItems.map((item, index) => (
          <animated.div
            key={item}
            className="dock-item"
            style={scaleSpring(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {item}
          </animated.div>
        ))}
      </animated.div>
    </div>
  );
};

export default Dock;`,
    css: `// Adjust the CSS to fit your needs

.dock-container {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
}

.dock {
  display: flex;
  pointer-events: auto;
  border: 1px solid #ffffff1c;
  padding: 0.8em;
  border-radius: 20px;
  transition:
    opacity 0.2s ease-out,
    transform 0.2s ease-out;
}

/* Dock item styles */
.dock-item {
  background-color: #000;
  margin: 5px;
  width: 50px;
  height: 50px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ffffff1c;
  display: flex;
  position: relative;
  z-index: 0;
  font-size: 1.5em;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.1s ease-out,
    background-color 0.3s ease-out;
  will-change: transform;
  cursor: pointer;
  pointer-events: auto;
}

.dock-item:hover {
  z-index: 2;
  background-color: #111;
  transition: background-color 0.3s ease;
}

/* Positioning styles */
.dock-container.left {
  top: 0;
  left: 1em;
  justify-content: flex-start;
  align-items: center;
  height: 100%;
}

.dock-container.right {
  top: 0;
  right: 1em;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}

.dock-container.top {
  top: 1em;
  left: 0;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
}

.dock-container.bottom {
  bottom: 1em;
  left: 0;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
}
`
  },

  // ! MAGNET ------------------------------------------------------------------------
  masonry: {
    installation: `npm i @react-spring/web`,
    usage: `import Masonry from './Masonry'
    
const data = [
  { id: 1, image: 'https://picsum.photos/id/10/200/300', height: 400 },
  { id: 2, image: 'https://picsum.photos/id/14/200/300', height: 300 },
  { id: 3, image: 'https://picsum.photos/id/15/200/300', height: 300 },
  { id: 4, image: 'https://picsum.photos/id/16/200/300', height: 300 },
  { id: 5, image: 'https://picsum.photos/id/17/200/300', height: 300 },
  { id: 6, image: 'https://picsum.photos/id/19/200/300', height: 300 },
  { id: 7, image: 'https://picsum.photos/id/37/200/300', height: 200 },
  { id: 8, image: 'https://picsum.photos/id/39/200/300', height: 300 },
  { id: 9, image: 'https://picsum.photos/id/85/200/300', height: 200 },
  { id: 10, image: 'https://picsum.photos/id/103/200/300', height: 400 }
];

<Masonry data={data} />`,
    code: `import { useState, useEffect, useMemo, useRef } from 'react';
import { useTransition, a } from '@react-spring/web';

import './Masonry.css';

function Masonry({ data }) {
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const updateColumns = () => {
      if (window.matchMedia('(min-width: 1500px)').matches) {
        setColumns(5);
      } else if (window.matchMedia('(min-width: 1000px)').matches) {
        setColumns(4);
      } else if (window.matchMedia('(min-width: 600px)').matches) {
        setColumns(3);
      } else {
        setColumns(1); // Breakpoint for mobile devices
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const ref = useRef();
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (ref.current) {
        setWidth(ref.current.offsetWidth);
      }
    };

    handleResize(); // Set initial width
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [ref]);

  const [heights, gridItems] = useMemo(() => {
    let heights = new Array(columns).fill(0);
    let gridItems = data.map((child) => {
      const column = heights.indexOf(Math.min(...heights));
      const x = (width / columns) * column;
      const y = (heights[column] += child.height / 2) - child.height / 2;
      return { ...child, x, y, width: width / columns, height: child.height / 2 };
    });
    return [heights, gridItems];
  }, [columns, data, width]);

  const transitions = useTransition(gridItems, {
    keys: (item) => item.id, // Use a unique key based on the id
    from: ({ x, y, width, height }) => ({ x, y, width, height, opacity: 0 }),
    enter: ({ x, y, width, height }) => ({ x, y, width, height, opacity: 1 }),
    update: ({ x, y, width, height }) => ({ x, y, width, height }),
    leave: { height: 0, opacity: 0 },
    config: { mass: 5, tension: 500, friction: 100 },
    trail: 25,
  });

  // Render the grid
  return (
    <div ref={ref} className='masonry' style={{ height: Math.max(...heights) }}>
      {transitions((style, item) => (
        <a.div key={item.id} style={style}>
          <div
            style={{
              backgroundColor: '#ffffff', // Set background if needed
              width: '100%',
              height: '100%',
              backgroundImage: \`url(\${item.image})\`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </a.div>
      ))}
    </div>
  );
}

export default Masonry;`,
    css: `.masonry {
  position: relative;
  width: 100%;
  height: 100%;
}

.masonry > div {
  position: absolute;
  will-change: transform, width, height, opacity;
  padding: 15px;
}

.masonry > div > div {
  position: relative;
  background-size: cover;
  background-position: center center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  text-transform: uppercase;
  font-size: 10px;
  line-height: 10px;
  border-radius: 4px;
  box-shadow: 0px 10px 50px -10px rgba(0, 0, 0, 0.2);
  transition: 0.3s ease;

  &:hover {
    transform: scale(1.1);
    transition: 0.3s ease;
  }
}`
  },

  // ! SHINY-TEXT ------------------------------------------------------------------------
  shinyText: {
    usage: `import ShinyText from './ShinyText';
    
<ShinyText text="Just some shiny text!" disabled={false} speed={3} className='custom-class' />`,
    code: `import './ShinyText.css';

const ShinyText = ({ text, disabled = false, speed = 5, className = '' }) => {
  const animationDuration = \`\${speed}s\`;

  return (
    <div
      className={\`shiny-text \${disabled ? 'disabled' : ''} \${className}\`}
      style={{ animationDuration }}
    >
      {text}
    </div>
  );
};

export default ShinyText;`,
    css: `.shiny-text {
  color: #b5b5b5a4; /* Adjust this color to change intensity/style */
  background: linear-gradient(
    120deg,
    rgba(255, 255, 255, 0) 40%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(255, 255, 255, 0) 60%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  display: inline-block;
  animation: shine 5s linear infinite;
}

@keyframes shine {
  0% {
    background-position: 100%;
  }
  100% {
    background-position: -100%;
  }
}

.shiny-text.disabled {
  animation: none;
}`,
    tailwind: `const ShinyText = ({ text, disabled = false, speed = 5, className = '' }) => {
  const animationDuration = \`\${speed}s\`;

  return (
    <div
      className={\`text-[#b5b5b5a4] bg-clip-text inline-block \${disabled ? '' : 'animate-shine'} \${className}\`}
      style={{
        backgroundImage: 'linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration: animationDuration,
      }}
    >
      {text}
    </div>
  );
};

export default ShinyText;

// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shine: {
          '0%': { 'background-position': '100%' },
          '100%': { 'background-position': '-100%' },
        },
      },
      animation: {
        shine: 'shine 5s linear infinite',
      },
    },
  },
  plugins: [],
};`
  },

  // ! GRADIENT-TEXT ------------------------------------------------------------------------
  gradientText: {
    usage: `import GradientText from './GradientText'
    
<GradientText
  colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} // Custom gradient colors
  animationSpeed={3} // Custom animation speed in seconds
  showBorder={false} // Show or hide border
  className="custom-class" // Add one or more custom classes
>
  Add a splash of color!
</GradientText>`,
    code: `import "./GradientText.css";

export default function GradientText({
  children,
  className = "",
  colors = ["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"], // Default colors
  animationSpeed = 8, // Default animation speed in seconds
  showBorder = false, // Default overlay visibility
}) {
  const gradientStyle = {
    backgroundImage: \`linear-gradient(to right, \${colors.join(", ")})\`,
    animationDuration: \`\${animationSpeed}s\`,
  };

  return (
    <div className={\`animated-gradient-text \${className}\`}>
      {showBorder && <div className="gradient-overlay" style={gradientStyle}></div>}
      <div className="text-content" style={gradientStyle}>{children}</div>
    </div>
  );
}`,
    css: `.animated-gradient-text {
  position: relative;
  margin: 0 auto;
  display: flex;
  max-width: fit-content;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-radius: 1.25rem; /* 20px */
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition: box-shadow 0.5s ease-out;
  overflow: hidden;
  cursor: pointer;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: 300% 100%;
  animation: gradient linear infinite;
  border-radius: inherit;
  z-index: 0;
  pointer-events: none;

  &:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    border-radius: inherit;
    width: calc(100% - 2px);
    height: calc(100% - 2px);
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background-color: #000;
    z-index: -1;
  }
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.text-content {
  display: inline-block;
  position: relative;
  z-index: 2;
  background-size: 300% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: gradient linear infinite;
}`,
    tailwind: `export default function GradientText({
  children,
  className = "",
  colors = ["#ffaa40", "#9c40ff", "#ffaa40"], // Default colors
  animationSpeed = 8, // Default animation speed in seconds
  showBorder = false, // Default overlay visibility
}) {
  const gradientStyle = {
    backgroundImage: \`linear-gradient(to right, \${colors.join(", ")})\`,
    animationDuration: \`\${animationSpeed}s\`, // This will be applied directly to the style
  };

  return (
    <div
      className={\`relative mx-auto flex max-w-fit flex-row items-center justify-center rounded-[1.25rem] font-medium backdrop-blur transition-shadow duration-500 overflow-hidden cursor-pointer \${className}\`}
    >
      {showBorder && (
        <div
          className="absolute inset-0 bg-cover z-0 pointer-events-none animate-gradient"
          style={{
            ...gradientStyle,
            backgroundSize: "300% 100%",
            // Direct animation style will override Tailwind animation duration
          }}
        >
          <div
            className="absolute inset-0 bg-black rounded-[1.25rem] z-[-1]"
            style={{
              width: "calc(100% - 2px)",
              height: "calc(100% - 2px)",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          ></div>
        </div>
      )}
      <div
        className="inline-block relative z-2 text-transparent bg-cover animate-gradient"
        style={{
          ...gradientStyle,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          backgroundSize: "300% 100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
    
// tailwind.config.js

module.exports = {
  theme: {
    extend: {
      keyframes: {
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        gradient: 'gradient 8s linear infinite', // Use the keyframes defined above
      },
    },
  },
  plugins: [],
};`
  }
}