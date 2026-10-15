const WIDTH = 400;
const HEIGHT = 500;

const wavePath = index => {
  const base = 18 + index * 22;
  const amplitude = 10 + 14 * Math.sin((index / 21) * Math.PI);
  const phase = index * 0.19;
  let d = '';
  for (let x = -20; x <= WIDTH + 20; x += 4) {
    const t = x / WIDTH;
    const y = base + amplitude * Math.sin(t * Math.PI * 2.2 + phase) + 7 * Math.sin(t * Math.PI * 0.9 - phase * 0.6);
    d += `${x === -20 ? 'M' : 'L'}${x} ${y.toFixed(2)}`;
  }
  return d;
};

const WAVES = Array.from({ length: 22 }, (_, index) => wavePath(index));

const smooth = t => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

const DOTS = (() => {
  const step = 12;
  const dots = [];
  for (let y = step / 2; y < HEIGHT; y += step) {
    for (let x = step / 2; x < WIDTH; x += step) {
      const ramp = smooth((y / HEIGHT) * 1.15 - (x / WIDTH) * 0.45 + 0.05);
      const r = 4.9 * Math.pow(ramp, 1.25);
      if (r >= 0.35) dots.push([x, y, Number(r.toFixed(2))]);
    }
  }
  return dots;
})();

const CX = WIDTH / 2;
const CY = HEIGHT / 2;

function Waves() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
      {WAVES.map(d => (
        <path key={d} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
}

const contourPath = (radius, exponent) => {
  let d = '';
  for (let step = 0; step <= 160; step++) {
    const angle = (step / 160) * Math.PI * 2;
    const c = Math.cos(angle);
    const v = Math.sin(angle);
    const x = CX + radius * Math.sign(c) * Math.abs(c) ** (2 / exponent);
    const y = CY + radius * Math.sign(v) * Math.abs(v) ** (2 / exponent);
    d += `${step ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d}Z`;
};

const CONTOURS = Array.from({ length: 13 }, (_, index) => {
  const radius = 34 + index * 22;
  return contourPath(radius, 2 + (index / 12) ** 1.4 * 5);
});

function Contours() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      {CONTOURS.map(d => (
        <path key={d} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
}

function Halftone() {
  return (
    <g fill="currentColor">
      {DOTS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
      ))}
    </g>
  );
}

const ART = {
  'background-studio': Waves,
  'shape-magic': Contours,
  'texture-lab': Halftone
};

export default function ToolBackdrop({ id, lit = false }) {
  const Art = ART[id];
  if (!Art) return null;
  return (
    <svg
      className={`tl-backdrop${lit ? ' tl-backdrop--lit' : ''}`}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <Art />
    </svg>
  );
}
