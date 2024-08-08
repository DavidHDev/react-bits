import { useRef, useEffect } from "react";
import { useSpring, animated, to } from "@react-spring/web";
import { useGesture } from "react-use-gesture";

import './FollowCursor.scss';

// Utility functions for calculating rotations
const calcX = (y, ly) =>
  -(y - ly - window.innerHeight / 2) / 20;
const calcY = (x, lx) => (x - lx - window.innerWidth / 2) / 20;

// Function to handle wheel translations
const wheel = (y) => {
  const imgHeight = window.innerWidth * 0.3 - 20;
  return `translateY(${-imgHeight * (y < 0 ? 6 : 1) - (y % (imgHeight * 5))}px`;
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

          </div>
        </animated.div>
      </animated.div>
    </div>
  );
}
