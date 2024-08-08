import { useState, useRef, useEffect } from "react";
import { useSpring, animated } from "@react-spring/web";

const Magnet = ({ children, padding = 100, disabled = false }) => {
  // this does nothing right now but you can use if if you want
  const [isActive, setIsActive] = useState(false);
  const magnetRef = useRef(null);

  // Define spring for animated position
  const [{ x, y }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    config: { tension: 300, friction: 30 },
  }));

  useEffect(() => {
    if (disabled) {
      // Reset animation when disabled
      api.start({ x: 0, y: 0 });
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
          // Calculate the offset for the spring animation
          const offsetX = (e.clientX - centerX) / 2;
          const offsetY = (e.clientY - centerY) / 2;
          api.start({ x: offsetX, y: offsetY });
        } else {
          setIsActive(false);
          api.start({ x: 0, y: 0 });
        }
      }
    };

    // Attach mouse move event listener
    window.addEventListener("mousemove", handleMouseMove);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [padding, api, disabled]);

  return (
    <div ref={magnetRef} style={{ position: "relative", display: "inline-block" }}>
      <animated.div
        style={{
          transform: x.to((x) => `translate3d(${x}px, ${y.get()}px, 0)`),
          willChange: "transform",
        }}
      >
        {children}
      </animated.div>
    </div>
  );
};

export default Magnet;