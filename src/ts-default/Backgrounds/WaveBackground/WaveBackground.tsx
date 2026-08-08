import { useEffect, useRef } from 'react';
import './WaveBackground.css';

interface WaveBackgroundProps {
  speed?: number;
  colorWaveStart?: string;
  colorWaveEnd?: string;
  wavePointsColor?: string;
  rows?: number;
  cols?: number;
  spacing?: number;
}

interface Point3D {
  x: number;
  z: number;
  y: number;
}

interface Point2D {
  x: number;
  y: number;
  z: number;
  h: number;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export default function WaveBackground({
  speed = 1,
  colorWaveStart = '#0072ce',
  colorWaveEnd = '#00d2ff',
  wavePointsColor = '#00ffff',
  rows = 65,
  cols = 85,
  spacing = 40
}: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    function resize() {
      if (!canvas) return;
      width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }

    window.addEventListener('resize', resize);
    resize();

    const points: Point3D[] = [];
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        points.push({
          x: (x - cols / 2) * spacing,
          z: (z - rows / 2) * spacing,
          y: 0
        });
      }
    }

    let time = 0;
    let targetRotX = 1.1;
    let targetRotY = 0;
    let rotX = 1.1;
    let rotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX - width / 2;
      const mouseY = e.clientY - height / 2;
      targetRotY = mouseX * 0.0002;
      targetRotX = 1.1 + mouseY * 0.0002;
    };

    const handleMouseLeave = () => {
      targetRotY = 0;
      targetRotX = 1.1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let animationId: number;
    let isAnimating = true;

    function animate() {
      if (!isAnimating) return;
      ctx!.clearRect(0, 0, width, height);
      time += 0.008 * speed;

      rotX += (targetRotX - rotX) * 0.02;
      rotY += (targetRotY - rotY) * 0.02;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      const points2D: Point2D[][] = [];

      for (let z = 0; z < rows; z++) {
        points2D[z] = [];
        for (let x = 0; x < cols; x++) {
          const index = z * cols + x;
          const p = points[index];

          const y = Math.sin(p.x * 0.015 + time) * 60 + Math.cos(p.z * 0.02 + time) * 50;

          const x1 = p.x * cosY + p.z * sinY;
          const z1 = -p.x * sinY + p.z * cosY;

          const y2 = y * cosX - z1 * sinX;
          const z2 = y * sinX + z1 * cosX;

          const distance = 1200;
          const scale = 1000 / (distance + z2);
          const x3 = x1 * scale + width / 2;
          const y3 = y2 * scale + height / 2 + 150;

          points2D[z].push({ x: x3, y: y3, z: z2, h: y });
        }
      }

      const startRGB = hexToRgb(colorWaveStart) || { r: 0, g: 114, b: 206 };
      const endRGB = hexToRgb(colorWaveEnd) || { r: 0, g: 210, b: 255 };
      const pointRGB = hexToRgb(wavePointsColor) || { r: 0, g: 255, b: 255 };

      for (let z = 0; z < rows - 1; z++) {
        for (let x = 0; x < cols - 1; x++) {
          const p = points2D[z][x];
          const right = points2D[z][x + 1];
          const down = points2D[z + 1][x];

          const opacity = Math.max(0, 1 - (p.z / 800));
          if (opacity <= 0.01) continue;

          const intensity = Math.max(0, Math.min(1, (p.h + 100) / 200));
          
          const r = Math.floor(startRGB.r + (endRGB.r - startRGB.r) * intensity);
          const g = Math.floor(startRGB.g + (endRGB.g - startRGB.g) * intensity);
          const b = Math.floor(startRGB.b + (endRGB.b - startRGB.b) * intensity);

          ctx!.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.6})`;
          ctx!.lineWidth = intensity > 0.6 ? 2 : 1;

          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(right.x, right.y);
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(down.x, down.y);
          ctx!.stroke();

          if (intensity > 0.8) {
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${pointRGB.r}, ${pointRGB.g}, ${pointRGB.b}, ${opacity})`;
            ctx!.shadowBlur = 10;
            ctx!.shadowColor = wavePointsColor;
            ctx!.fill();
            ctx!.shadowBlur = 0;
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      isAnimating = false;
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [speed, colorWaveStart, colorWaveEnd, wavePointsColor, rows, cols, spacing]);

  return (
    <div className="wave-background-container">
      <canvas ref={canvasRef} id="global-wave-canvas" />
      <div className="gradient-overlay-wave" />
    </div>
  );
}
