import { useRef, useEffect, useState } from 'react';
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
    from: { transform: `translate${directions[direction]}(${reverse ? `-${distance}px` : `${distance}px`})` },
    to: inView ? { transform: `translate${directions[direction]}(0px)` } : `translate${directions[direction]}(${reverse && '-'}${distance}px)`,
    config: { tension: 50, friction: 25 },
  });

  return (
    <animated.div ref={ref} style={springProps}>
      {children}
    </animated.div>
  );
};