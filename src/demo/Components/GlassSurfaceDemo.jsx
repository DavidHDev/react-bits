import { useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  FavouriteIcon,
  Home01Icon,
  NextIcon,
  PauseIcon,
  PreviousIcon,
  Search01Icon,
  UserIcon
} from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import { glassSurface } from '../../constants/code/Components/glassSurfaceCode';
import GlassSurface from '../../content/Components/GlassSurface/GlassSurface';
import logo from '../../assets/logos/react-bits-logo-small.svg';

const DRIFT = [24, 16];

const LOOK = {
  borderWidth: 0.07,
  brightness: 50,
  opacity: 0.93,
  blur: 11,
  displace: 0.5,
  backgroundOpacity: 0.1,
  saturation: 1,
  distortionScale: -180,
  redOffset: 0,
  greenOffset: 10,
  blueOffset: 20
};

const DEFAULT_PROPS = {
  preset: 'tabs',
  width: 320,
  height: 76,
  borderRadius: 38,
  ...LOOK,
  refraction: true,
  renderer: 'auto'
};

const PRESETS = {
  tabs: { ...LOOK, width: 320, height: 76, borderRadius: 38 },
  lens: { ...LOOK, width: 200, height: 200, borderRadius: 100, borderWidth: 0.12, distortionScale: -240 },
  player: { ...LOOK, width: 260, height: 96, borderRadius: 30 },
  prism: {
    ...LOOK,
    width: 320,
    height: 76,
    borderRadius: 38,
    distortionScale: -220,
    redOffset: 0,
    greenOffset: 28,
    blueOffset: 56
  },
  frost: { ...LOOK, width: 320, height: 76, borderRadius: 38, displace: 3, backgroundOpacity: 0.28 },
  logo: { ...LOOK, width: 280, height: 280, borderRadius: 38 }
};

const RENDERER_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'svg', label: 'SVG' },
  { value: 'webgl', label: 'WebGL' },
  { value: 'frosted', label: 'Frosted' }
];

const PRESET_OPTIONS = [
  { value: 'tabs', label: 'Tab Bar' },
  { value: 'lens', label: 'Lens' },
  { value: 'player', label: 'Player' },
  { value: 'prism', label: 'Prism' },
  { value: 'frost', label: 'Frost' },
  { value: 'logo', label: 'Logo' }
];

const CONTENT = {
  tabs: [Home01Icon, Search01Icon, FavouriteIcon, UserIcon],
  prism: [Home01Icon, Search01Icon, FavouriteIcon, UserIcon],
  frost: [Home01Icon, Search01Icon, FavouriteIcon, UserIcon],
  player: [PreviousIcon, PauseIcon, NextIcon],
  lens: [],
  logo: []
};

const propData = [
  { name: 'children', type: 'ReactNode', default: '-', description: 'Content shown on the glass.' },
  {
    name: 'width',
    type: 'number | string',
    default: '200',
    description: "Width in px, or any CSS value like '100%'."
  },
  {
    name: 'height',
    type: 'number | string',
    default: '80',
    description: "Height in px, or any CSS value like '100vh'."
  },
  { name: 'borderRadius', type: 'number', default: '20', description: 'Corner radius in px. Not used with a shape.' },
  {
    name: 'shape',
    type: 'string',
    default: '-',
    description:
      'URL of an SVG or transparent PNG that gives the glass its outline, fitted inside the width and height. Files from another origin need CORS headers.'
  },
  {
    name: 'refraction',
    type: 'boolean',
    default: 'true',
    description:
      'Bends what is behind the glass at its edges. Set it to false to use the frosted glass look everywhere.'
  },
  {
    name: 'renderer',
    type: "'auto' | 'svg' | 'webgl'",
    default: "'auto'",
    description:
      'How the glass bends light. Auto uses SVG filters in Chromium, which bend anything behind the glass, and WebGL in Safari and Firefox when a backdrop is given. Without a backdrop, those browsers get a frosted glass look. WebGL forces the WebGL glass whenever a backdrop is given.'
  },
  {
    name: 'backdrop',
    type: 'RefObject<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement>',
    default: '-',
    description:
      'The image, video or canvas behind the glass. WebGL can only bend what it is given, so pass this to get real refraction outside Chromium. Images from another origin need CORS headers.'
  },
  {
    name: 'distortionScale',
    type: 'number',
    default: '-180',
    description: 'How strongly the edge bends what is behind it. Negative values pull the view inward.'
  },
  {
    name: 'borderWidth',
    type: 'number',
    default: '0.07',
    description: 'Width of the bending edge, as a fraction of the shorter side.'
  },
  {
    name: 'blur',
    type: 'number',
    default: '11',
    description: 'Softness of the transition from the bending edge to the calm center, in px.'
  },
  {
    name: 'brightness',
    type: 'number',
    default: '50',
    description: 'Brightness of the calm center, in %. 50 leaves it undistorted.'
  },
  {
    name: 'opacity',
    type: 'number',
    default: '0.93',
    description: 'How strongly the calm center holds the view still, from 0 to 1.'
  },
  {
    name: 'displace',
    type: 'number',
    default: '0',
    description: 'Blurs the light coming through the glass, for a frosted look.'
  },
  {
    name: 'redOffset',
    type: 'number',
    default: '0',
    description: 'Extra bending for the red channel. Different offsets split light into colored fringes.'
  },
  { name: 'greenOffset', type: 'number', default: '10', description: 'Extra bending for the green channel.' },
  { name: 'blueOffset', type: 'number', default: '20', description: 'Extra bending for the blue channel.' },
  {
    name: 'backgroundOpacity',
    type: 'number',
    default: '0',
    description: 'Opacity of a soft frosted tint over the glass, from 0 to 1.'
  },
  { name: 'saturation', type: 'number', default: '1', description: 'Saturation of what is seen through the glass.' },
  {
    name: 'xChannel',
    type: "'R' | 'G' | 'B'",
    default: "'R'",
    description: 'Channel of the displacement map that moves pixels sideways.'
  },
  {
    name: 'yChannel',
    type: "'R' | 'G' | 'B'",
    default: "'G'",
    description: 'Channel of the displacement map that moves pixels up and down.'
  },
  {
    name: 'mixBlendMode',
    type: 'BlendMode',
    default: "'difference'",
    description: 'How the two edge gradients of the displacement map are combined.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the glass.' },
  { name: 'style', type: 'CSSProperties', default: '{}', description: 'Inline styles for the glass.' }
];

const GlassSurfaceDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const stageRef = useRef(null);
  const backdropRef = useRef(null);
  const glassRef = useRef(null);
  const inputRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const shown = useRef({ x: 0, y: 0 });
  const drag = useRef(null);
  const drift = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, time: 0, frame: 0 });
  const [stageWidth, setStageWidth] = useState(0);
  const [upload, setUpload] = useState(null);

  const place = () => {
    const stage = stageRef.current;
    const glass = glassRef.current;
    if (!stage || !glass) return;
    const { x: driftX, y: driftY } = drift.current;
    const ratio = window.devicePixelRatio || 1;
    const limitX = Math.max(0, (stage.clientWidth - glass.offsetWidth) / 2 - 16);
    const limitY = Math.max(0, (stage.clientHeight - glass.offsetHeight) / 2 - 16);
    const leanX = driftX * DRIFT[0];
    const leanY = driftY * DRIFT[1];
    const grab = drag.current;
    const x = Math.min(limitX, Math.max(-limitX, grab ? grab.pointerX - grab.x : offset.current.x + leanX));
    const y = Math.min(limitY, Math.max(-limitY, grab ? grab.pointerY - grab.y : offset.current.y + leanY));
    if (grab) offset.current = { x: x - leanX, y: y - leanY };
    shown.current = { x, y };
    glass.style.transform = `translate(${Math.round(x * ratio) / ratio}px, ${Math.round(y * ratio) / ratio}px)`;
  };

  const step = now => {
    const state = drift.current;
    const dt = Math.min(0.05, (now - state.time) / 1000);
    state.time = now;
    state.vx += (50 * (state.tx - state.x) - 14 * state.vx) * dt;
    state.vy += (50 * (state.ty - state.y) - 14 * state.vy) * dt;
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    const resting =
      Math.abs(state.tx - state.x) + Math.abs(state.ty - state.y) + Math.abs(state.vx) + Math.abs(state.vy) < 0.0005;
    if (resting) {
      state.x = state.tx;
      state.y = state.ty;
      state.vx = 0;
      state.vy = 0;
    }
    place();
    state.frame = resting ? 0 : requestAnimationFrame(step);
  };

  const wake = () => {
    const state = drift.current;
    if (state.frame) return;
    state.time = performance.now();
    state.frame = requestAnimationFrame(step);
  };

  useEffect(() => {
    place();
  });

  useEffect(() => {
    const stage = stageRef.current;
    const state = drift.current;
    if (!stage) return undefined;
    const observer = new ResizeObserver(() => {
      setStageWidth(stage.clientWidth);
      place();
    });
    observer.observe(stage);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    };
  }, []);

  useEffect(() => {
    if (!upload) return undefined;
    return () => URL.revokeObjectURL(upload.url);
  }, [upload]);

  const onStageMove = event => {
    const stage = stageRef.current;
    const grab = drag.current;
    if (grab) {
      grab.pointerX = event.clientX;
      grab.pointerY = event.clientY;
      place();
    }
    if (stage && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const rect = stage.getBoundingClientRect();
      drift.current.tx = Math.min(1, Math.max(-1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      drift.current.ty = Math.min(1, Math.max(-1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
      wake();
    }
  };

  const onStageLeave = () => {
    drift.current.tx = 0;
    drift.current.ty = 0;
    wake();
  };

  const onPointerDown = event => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX - shown.current.x,
      y: event.clientY - shown.current.y,
      pointerX: event.clientX,
      pointerY: event.clientY
    };
    glassRef.current.style.cursor = 'grabbing';
  };

  const onPointerUp = () => {
    drag.current = null;
    if (glassRef.current) glassRef.current.style.cursor = 'grab';
  };

  const onFile = event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUpload({ url: URL.createObjectURL(file), name: file.name });
  };

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps[name]]));
    updateProps({
      ...base,
      ...PRESETS[value],
      refraction: settings.refraction,
      renderer: settings.renderer,
      preset: value
    });
  };

  const resetAll = () => {
    resetProps();
    setUpload(null);
  };

  const icons = CONTENT[preset] ?? CONTENT.tabs;
  const shape = preset === 'logo' ? upload?.url || logo : undefined;

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetAll}
      hasChanges={hasChanges}
      demoOnlyProps={['preset']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            ref={stageRef}
            position="relative"
            className="demo-container"
            h={500}
            p={0}
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
            onPointerMove={onStageMove}
            onPointerLeave={onStageLeave}
          >
            <img
              ref={backdropRef}
              src={`/assets/demo/${theme === 'light' ? 'day' : 'night'}-sky.webp`}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            />
            <Box
              ref={glassRef}
              cursor="grab"
              userSelect="none"
              style={{ touchAction: 'none' }}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <GlassSurface
                {...settings}
                backdrop={backdropRef}
                shape={shape}
                width={stageWidth ? Math.min(settings.width, stageWidth - 32) : settings.width}
              >
                {icons.length > 0 && (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-around"
                    w="100%"
                    px={3}
                    color={theme === 'light' ? '#18181b' : '#ffffff'}
                  >
                    {icons.map((icon, index) => (
                      <HugeiconsIcon key={index} icon={icon} size={preset === 'player' ? 28 : 24} strokeWidth={1.8} />
                    ))}
                  </Box>
                )}
              </GlassSurface>
            </Box>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            {preset === 'logo' && (
              <div className="scrubber">
                <button
                  type="button"
                  className="scrubber-track scrubber-track--select"
                  onClick={() => inputRef.current?.click()}
                >
                  <span className="scrubber-label">Upload</span>
                  <span className="scrubber-select-right">
                    <span
                      className="scrubber-value"
                      style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {upload ? upload.name : 'SVG or PNG'}
                    </span>
                  </span>
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/svg+xml,image/png,image/webp"
                  hidden
                  onChange={onFile}
                />
              </div>
            )}
            <PreviewSelect
              title="Renderer"
              options={RENDERER_OPTIONS}
              value={settings.refraction ? settings.renderer : 'frosted'}
              onChange={value =>
                updateProps(
                  value === 'frosted' ? { refraction: false, renderer: 'auto' } : { refraction: true, renderer: value }
                )
              }
            />
            <PreviewSlider
              title="Width"
              min={120}
              max={600}
              step={2}
              value={settings.width}
              valueUnit="px"
              onChange={value => updateProp('width', value)}
            />
            <PreviewSlider
              title="Height"
              min={48}
              max={320}
              step={2}
              value={settings.height}
              valueUnit="px"
              onChange={value => updateProp('height', value)}
            />
            {preset !== 'logo' && (
              <PreviewSlider
                title="Border Radius"
                min={0}
                max={160}
                step={1}
                value={settings.borderRadius}
                valueUnit="px"
                onChange={value => updateProp('borderRadius', value)}
              />
            )}
            <PreviewSlider
              title="Distortion Scale"
              min={-300}
              max={300}
              step={10}
              value={settings.distortionScale}
              onChange={value => updateProp('distortionScale', value)}
            />
            <PreviewSlider
              title="Border Width"
              min={0}
              max={0.3}
              step={0.01}
              value={settings.borderWidth}
              onChange={value => updateProp('borderWidth', value)}
            />
            <PreviewSlider
              title="Blur"
              min={0}
              max={30}
              step={1}
              value={settings.blur}
              valueUnit="px"
              onChange={value => updateProp('blur', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0}
              max={100}
              step={1}
              value={settings.brightness}
              valueUnit="%"
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.01}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSlider
              title="Displace"
              min={0}
              max={5}
              step={0.1}
              value={settings.displace}
              onChange={value => updateProp('displace', value)}
            />
            <PreviewSlider
              title="Red Offset"
              min={-50}
              max={50}
              step={1}
              value={settings.redOffset}
              onChange={value => updateProp('redOffset', value)}
            />
            <PreviewSlider
              title="Green Offset"
              min={-50}
              max={50}
              step={1}
              value={settings.greenOffset}
              onChange={value => updateProp('greenOffset', value)}
            />
            <PreviewSlider
              title="Blue Offset"
              min={-50}
              max={50}
              step={1}
              value={settings.blueOffset}
              onChange={value => updateProp('blueOffset', value)}
            />
            <PreviewSlider
              title="Background Opacity"
              min={0}
              max={1}
              step={0.01}
              value={settings.backgroundOpacity}
              onChange={value => updateProp('backgroundOpacity', value)}
            />
            <PreviewSlider
              title="Saturation"
              min={0}
              max={3}
              step={0.1}
              value={settings.saturation}
              onChange={value => updateProp('saturation', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={glassSurface} componentName="GlassSurface" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GlassSurfaceDemo;
