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

function Stage() {
  return (
    <svg className="tl-stage" viewBox="-270 -160 540 320" fill="none" stroke="currentColor" strokeWidth="1">
      <ellipse cx="0" cy="122" rx="262" ry="22" vectorEffect="non-scaling-stroke" />
      <path d="M-262 122V132A262 22 0 0 0 262 132V122" vectorEffect="non-scaling-stroke" />
      <rect className="tl-solid" x="-246" y="-60" width="138" height="158" rx="13" vectorEffect="non-scaling-stroke" />
      <rect x="-239" y="-53" width="124" height="144" rx="7" vectorEffect="non-scaling-stroke" />
      <rect className="tl-solid" x="-160" y="-106" width="320" height="208" rx="12" vectorEffect="non-scaling-stroke" />
      <rect x="-152" y="-98" width="304" height="192" rx="5" vectorEffect="non-scaling-stroke" />
      <circle cx="0" cy="-102" r="1.4" vectorEffect="non-scaling-stroke" />
      <path
        className="tl-solid"
        d="M-178 102H178L194 110Q197 114 192 114H-192Q-197 114 -194 110Z"
        vectorEffect="non-scaling-stroke"
      />
      <path d="M-24 114Q-22 110.5 -17 110.5H17Q22 110.5 24 114" vectorEffect="non-scaling-stroke" />
      <rect className="tl-solid" x="132" y="-24" width="76" height="156" rx="16" vectorEffect="non-scaling-stroke" />
      <rect x="137" y="-19" width="66" height="146" rx="12" vectorEffect="non-scaling-stroke" />
      <rect x="158" y="-13" width="24" height="6" rx="3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const BARS = Array.from({ length: 31 }, (_, index) => {
  const t = (index + 0.5) / 31;
  const swell = 0.58 * Math.exp(-(((t - 0.32) / 0.17) ** 2)) + 0.42 * Math.exp(-(((t - 0.7) / 0.19) ** 2));
  const grain = 0.78 + 0.22 * Math.sin(index * 2.3) * Math.cos(index * 0.7);
  const half = 14 + 196 * swell * grain;
  const x = 8 + index * 12.8;
  return `M${x.toFixed(2)} ${(CY - half).toFixed(2)}L${x.toFixed(2)} ${(CY + half).toFixed(2)}`;
});

function Waveform() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1">
      {BARS.map(d => (
        <path key={d} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
}

const ART = {
  'background-studio': Waves,
  'shape-magic': Contours,
  'texture-lab': Halftone,
  'sound-lab': Waveform
};

const SCENES = {
  'center-stage': Stage
};

export default function ToolBackdrop({ id, lit = false }) {
  const Scene = SCENES[id];
  if (Scene) {
    return (
      <div className={`tl-backdrop tl-backdrop--scene${lit ? ' tl-backdrop--lit' : ''}`} aria-hidden="true">
        <Scene />
      </div>
    );
  }
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
