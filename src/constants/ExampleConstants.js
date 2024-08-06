export const CODE_EXAMPLES = {
  // ! SPLIT-TEXT ------------------------------------------------------------------------
  splitText: {
    installation: `npm install @react-spring/web`,
    usage: `import { SplitText } from "./SplitText";

<SplitText text="Hello!" className="custom-class" delay={50} />`,
    code: `import { useSprings, animated } from '@react-spring/web';
import { useEffect, useRef, useState } from 'react';

import './SplitText.scss';

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
  },

  // ! BLUR-TEXT ------------------------------------------------------------------------
  blurText: {
    installation: `npm install @react-spring/web`,
    usage: `import { BlurText } from "./BlurText";

<BlurText text="Isn't this so cool?!" className="custom-class" delay={50} />`,
    code: `import { useRef, useEffect, useState } from 'react';
import { useSprings, animated } from '@react-spring/web';

import './BlurText.scss';

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
}`
  },

  // ! BLOB-CURSOR ------------------------------------------------------------------------
  blobCursor: {
    installation: `npm i @react-spring/web react-use-measure`,
    usage: `import BlobCursor from './BlobCursor'
    
<BlobCursor />`,
    code: `import useMeasure from 'react-use-measure'
import { useTrail, animated } from '@react-spring/web'

import './BlobCursor.scss';

const fast = { tension: 1200, friction: 40 }
const slow = { mass: 10, tension: 200, friction: 50 }
const trans = (x, y) =>
  \`translate3d(\${x}px,\${y}px,0) translate3d(-50%,-50%,0)\`

export default function BlobCursor() {
  const [trail, api] = useTrail(3, i => ({
    xy: [0, 0],
    config: i === 0 ? fast : slow,
  }))
  const [ref, { left, top }] = useMeasure()

  const handleMouseMove = e => {
    api.start({ xy: [e.clientX - left, e.clientY - top] })
  }

  return (
    <div className='container'>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="blob">
          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="30" />
          <feColorMatrix
            in="blur"
            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 30 -7"
          />
        </filter>
      </svg>
      <div ref={ref} className='main' onMouseMove={handleMouseMove}>
        {trail.map((props, index) => (
          <animated.div key={index} style={{ transform: props.xy.to(trans) }} />
        ))}
      </div>
    </div>
  )
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
  }
}