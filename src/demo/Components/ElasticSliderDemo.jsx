import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AirplaneModeIcon,
  BluetoothIcon,
  Moon02Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  Sun03Icon,
  SunDimIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMute02Icon,
  Wifi01Icon
} from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import ElasticSlider from '../../content/Components/ElasticSlider/ElasticSlider';
import { elasticSlider } from '../../constants/code/Components/elasticSliderCode';
import './ElasticSliderDemo.css';

const SONG = 217;

const PHOTOS = {
  light: '/assets/demo/day-sky.webp',
  dark: '/assets/demo/night-sky.webp'
};

const TOGGLES = [
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi01Icon },
  { id: 'bluetooth', label: 'Bluetooth', icon: BluetoothIcon },
  { id: 'airplane', label: 'Airplane Mode', icon: AirplaneModeIcon },
  { id: 'focus', label: 'Do Not Disturb', icon: Moon02Icon }
];

const ICON_SETS = {
  volume: [VolumeLowIcon, VolumeHighIcon],
  brightness: [SunDimIcon, Sun03Icon]
};

const clock = seconds => {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

const signed = value => {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : rounded < 0 ? `\u2212${-rounded}` : '0';
};

const LOOK = {
  orientation: 'horizontal',
  icons: 'volume',
  iconPlacement: 'outside',
  valuePosition: 'top',
  thickness: 6,
  activeThickness: 12,
  radius: 40,
  restOpacity: 0.7,
  fillFrom: 0,
  isStepped: false,
  stepSize: 10,
  ticks: false,
  thumb: false,
  jumpToClick: true
};

const PRESETS = {
  line: {},
  pill: {
    icons: 'brightness',
    iconPlacement: 'inside',
    valuePosition: 'inside',
    thickness: 44,
    activeThickness: 48,
    radius: 14,
    restOpacity: 1
  },
  vertical: {
    orientation: 'vertical',
    iconPlacement: 'inside',
    valuePosition: 'none',
    thickness: 64,
    activeThickness: 68,
    radius: 22,
    restOpacity: 1,
    jumpToClick: false
  },
  stepped: {
    icons: 'none',
    valuePosition: 'bubble',
    thickness: 6,
    activeThickness: 10,
    restOpacity: 1,
    isStepped: true,
    stepSize: 10,
    ticks: true,
    thumb: true
  }
};

const DEFAULT_PROPS = {
  demo: 'player',
  preset: 'line',
  fillColor: '',
  maxStretch: 50,
  bounce: 0.5,
  growOnHover: true,
  wheel: false,
  ...LOOK
};

const DEMO_OPTIONS = [
  { value: 'player', label: 'Player' },
  { value: 'control', label: 'Control Center' },
  { value: 'editor', label: 'Editor' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'line', label: 'Line' },
  { value: 'pill', label: 'Pill' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'stepped', label: 'Stepped' }
];

const ORIENTATION_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' }
];

const ICON_OPTIONS = [
  { value: 'volume', label: 'Volume' },
  { value: 'brightness', label: 'Brightness' },
  { value: 'none', label: 'None' }
];

const PLACEMENT_OPTIONS = [
  { value: 'outside', label: 'Outside' },
  { value: 'inside', label: 'Inside' }
];

const VALUE_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bubble', label: 'Bubble' },
  { value: 'inside', label: 'Inside' },
  { value: 'none', label: 'None' }
];

const propData = [
  { name: 'value', type: 'number', default: '-', description: 'Controlled value. Pair it with onChange.' },
  { name: 'defaultValue', type: 'number', default: '50', description: 'Starting value when uncontrolled.' },
  { name: 'startingValue', type: 'number', default: '0', description: 'Lowest value of the range.' },
  { name: 'maxValue', type: 'number', default: '100', description: 'Highest value of the range.' },
  { name: 'isStepped', type: 'boolean', default: 'false', description: 'Snaps the value to stepSize increments.' },
  { name: 'stepSize', type: 'number', default: '1', description: 'Size of each step when isStepped is on.' },
  { name: 'onChange', type: '(value: number) => void', default: '-', description: 'Called as the value changes.' },
  {
    name: 'onChangeEnd',
    type: '(value: number) => void',
    default: '-',
    description: 'Called when a drag, key press or scroll finishes.'
  },
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
    description: 'Direction of the track. Vertical sliders fill from the bottom.'
  },
  {
    name: 'leftIcon',
    type: 'ReactNode',
    default: 'volume low icon',
    description: 'Icon at the start of the track. Pass null to hide it.'
  },
  {
    name: 'rightIcon',
    type: 'ReactNode',
    default: 'volume high icon',
    description: 'Icon at the end of the track. Pass null to hide it.'
  },
  {
    name: 'iconPlacement',
    type: "'outside' | 'inside'",
    default: "'outside'",
    description: 'Puts the icons beside the track, or inside it once the track is thick enough to hold them.'
  },
  {
    name: 'valuePosition',
    type: "'top' | 'bubble' | 'inside' | 'none'",
    default: "'top'",
    description: 'Where the value shows. Bubble rides above the fill while the slider is active.'
  },
  {
    name: 'formatValue',
    type: '(value: number) => string',
    default: '-',
    description: 'Formats the shown value and the value read by screen readers.'
  },
  {
    name: 'ticks',
    type: 'boolean | number[]',
    default: 'false',
    description:
      'Marks along the track. True marks every step, or every tenth when not stepped. An array marks those values.'
  },
  { name: 'thumb', type: 'boolean', default: 'false', description: 'Shows a round handle at the end of the fill.' },
  {
    name: 'fillFrom',
    type: 'number',
    default: 'startingValue',
    description: 'Value the fill grows from. Set it to the middle of the range for a centered, two-way fill.'
  },
  { name: 'thickness', type: 'number', default: '6', description: 'Track thickness in px at rest.' },
  {
    name: 'activeThickness',
    type: 'number',
    default: '12',
    description: 'Track thickness in px while hovered, focused or dragged.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '-',
    description: 'Corner radius of the track in px. Fully round when left out.'
  },
  {
    name: 'restOpacity',
    type: 'number',
    default: '0.7',
    description: 'Opacity while idle. The slider brightens to full when active.'
  },
  {
    name: 'growOnHover',
    type: 'boolean',
    default: 'true',
    description: 'Hovering activates the slider. When off it only grows while pressed or focused.'
  },
  {
    name: 'maxStretch',
    type: 'number',
    default: '50',
    description: 'Furthest the track stretches in px when pulled past an end. 0 turns the stretch off.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.5',
    description: 'How much the track wobbles as it springs back, from 0 to 0.95.'
  },
  {
    name: 'jumpToClick',
    type: 'boolean',
    default: 'true',
    description: 'Pressing the track jumps to the pointer. When off, dragging moves the value from where it was.'
  },
  { name: 'wheel', type: 'boolean', default: 'false', description: 'Lets the scroll wheel change the value.' },
  {
    name: 'trackColor',
    type: 'string',
    default: "'color-mix(in srgb, currentColor 18%, transparent)'",
    description: 'Color of the empty track.'
  },
  { name: 'rangeColor', type: 'string', default: "'currentColor'", description: 'Color of the fill.' },
  { name: 'iconColor', type: 'string', default: "'currentColor'", description: 'Color of the outside icons.' },
  {
    name: 'contentColor',
    type: 'string',
    default: "'currentColor'",
    description: 'Color of icons, values and ticks over the empty track.'
  },
  {
    name: 'fillContentColor',
    type: 'string',
    default: "'auto'",
    description: 'Color of icons, values and ticks over the fill. Auto picks light or dark from the fill color.'
  },
  { name: 'thumbColor', type: 'string', default: "'#ffffff'", description: 'Color of the handle.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Turns off interaction and dims the slider.' },
  { name: 'ariaLabel', type: 'string', default: "'Slider'", description: 'Accessible name of the slider.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root.' }
];

const PlayerScene = ({ theme, fill, physics }) => {
  const [position, setPosition] = useState(84);
  const [volume, setVolume] = useState(64);
  const [playing, setPlaying] = useState(true);
  const seeking = useRef(false);
  const positionRef = useRef(position);
  positionRef.current = position;

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      if (seeking.current) return;
      const next = positionRef.current + 0.25;
      setPosition(Math.min(next, SONG));
      if (next >= SONG) setPlaying(false);
    }, 250);
    return () => clearInterval(timer);
  }, [playing]);

  const line = {
    style: { width: '100%' },
    valuePosition: 'none',
    thickness: 5,
    activeThickness: 9,
    trackColor: 'var(--esd-track)',
    rangeColor: fill || 'var(--esd-fill)',
    iconColor: 'var(--esd-muted)',
    ...physics
  };

  return (
    <div className="esd-card esd-player">
      <img className="esd-player__art" src={PHOTOS[theme]} alt="" draggable={false} />
      <div className="esd-player__meta">
        <strong>Cirrus</strong>
        <span>Open Skies</span>
      </div>

      <div className="esd-player__seek">
        <ElasticSlider
          {...line}
          value={position}
          maxValue={SONG}
          onChange={value => {
            seeking.current = true;
            setPosition(value);
          }}
          onChangeEnd={() => {
            seeking.current = false;
          }}
          leftIcon={null}
          rightIcon={null}
          formatValue={clock}
          ariaLabel="Seek"
        />
        <div className="esd-player__times">
          <span>{clock(position)}</span>
          <span>−{clock(SONG - position)}</span>
        </div>
      </div>

      <div className="esd-player__transport">
        <button type="button" className="esd-icon-button" aria-label="Previous" onClick={() => setPosition(0)}>
          <HugeiconsIcon icon={PreviousIcon} size={22} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="esd-icon-button esd-icon-button--raised"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={() => {
            if (!playing && position >= SONG) setPosition(0);
            setPlaying(value => !value);
          }}
        >
          <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={24} strokeWidth={1.75} />
        </button>
        <button type="button" className="esd-icon-button" aria-label="Next" onClick={() => setPosition(0)}>
          <HugeiconsIcon icon={NextIcon} size={22} strokeWidth={1.75} />
        </button>
      </div>

      <div className="esd-player__volume">
        <ElasticSlider
          {...line}
          value={volume}
          onChange={setVolume}
          leftIcon={<HugeiconsIcon icon={VolumeLowIcon} size={18} strokeWidth={1.75} />}
          rightIcon={<HugeiconsIcon icon={VolumeHighIcon} size={18} strokeWidth={1.75} />}
          ariaLabel="Volume"
        />
      </div>
    </div>
  );
};

const ControlScene = ({ fill, physics }) => {
  const [brightness, setBrightness] = useState(72);
  const [volume, setVolume] = useState(40);
  const [toggles, setToggles] = useState({ wifi: true, bluetooth: true, airplane: false, focus: false });

  const pill = {
    orientation: 'vertical',
    style: { height: 182 },
    thickness: 84,
    activeThickness: 88,
    radius: 28,
    iconPlacement: 'inside',
    valuePosition: 'none',
    rightIcon: null,
    restOpacity: 1,
    jumpToClick: false,
    trackColor: 'var(--esd-well)',
    rangeColor: fill || 'var(--esd-pill-fill)',
    contentColor: 'var(--esd-pill-ink)',
    ...physics
  };
  const volumeIcon = volume <= 0 ? VolumeMute02Icon : volume < 50 ? VolumeLowIcon : VolumeHighIcon;

  return (
    <div className="esd-cc">
      <div className="esd-cc__module">
        {TOGGLES.map(toggle => (
          <button
            key={toggle.id}
            type="button"
            className="esd-cc__toggle"
            aria-label={toggle.label}
            aria-pressed={toggles[toggle.id]}
            data-on={toggles[toggle.id] ? '' : undefined}
            onClick={() => setToggles(state => ({ ...state, [toggle.id]: !state[toggle.id] }))}
          >
            <HugeiconsIcon icon={toggle.icon} size={24} strokeWidth={1.75} />
          </button>
        ))}
      </div>
      <ElasticSlider
        {...pill}
        value={brightness}
        onChange={setBrightness}
        leftIcon={<HugeiconsIcon icon={Sun03Icon} size={26} strokeWidth={1.75} />}
        ariaLabel="Brightness"
      />
      <ElasticSlider
        {...pill}
        value={volume}
        onChange={setVolume}
        leftIcon={<HugeiconsIcon icon={volumeIcon} size={26} strokeWidth={1.75} />}
        ariaLabel="Volume"
      />
    </div>
  );
};

const EditorScene = ({ theme, fill, physics }) => {
  const [exposure, setExposure] = useState(24);
  const [warmth, setWarmth] = useState(-30);
  const [angle, setAngle] = useState(-3);

  const radians = (Math.abs(angle) * Math.PI) / 180;
  const cover = Math.cos(radians) + 2 * Math.sin(radians);
  const changed = exposure !== 0 || warmth !== 0 || angle !== 0;

  const adjust = {
    style: { width: '100%' },
    startingValue: -100,
    maxValue: 100,
    fillFrom: 0,
    ticks: [0],
    thumb: true,
    valuePosition: 'none',
    leftIcon: null,
    rightIcon: null,
    thickness: 4,
    activeThickness: 8,
    restOpacity: 1,
    trackColor: 'var(--esd-track)',
    rangeColor: fill || 'var(--esd-fill)',
    ...physics
  };

  const rows = [
    {
      label: 'Exposure',
      value: exposure,
      text: signed(exposure),
      slider: (
        <ElasticSlider {...adjust} value={exposure} onChange={setExposure} formatValue={signed} ariaLabel="Exposure" />
      )
    },
    {
      label: 'Warmth',
      value: warmth,
      text: signed(warmth),
      slider: <ElasticSlider {...adjust} value={warmth} onChange={setWarmth} formatValue={signed} ariaLabel="Warmth" />
    },
    {
      label: 'Straighten',
      value: angle,
      text: `${signed(angle)}°`,
      slider: (
        <ElasticSlider
          {...adjust}
          value={angle}
          onChange={setAngle}
          startingValue={-10}
          maxValue={10}
          isStepped
          stepSize={1}
          ticks
          formatValue={value => `${signed(value)}°`}
          ariaLabel="Straighten"
        />
      )
    }
  ];

  return (
    <div className="esd-card esd-editor">
      <div className="esd-editor__head">
        <strong>Adjust</strong>
        <button
          type="button"
          className="esd-editor__reset"
          disabled={!changed}
          onClick={() => {
            setExposure(0);
            setWarmth(0);
            setAngle(0);
          }}
        >
          Reset
        </button>
      </div>
      <div className="esd-editor__photo">
        <img
          src={PHOTOS[theme]}
          alt=""
          draggable={false}
          style={{
            filter: `brightness(${(1 + exposure / 220).toFixed(3)}) saturate(${(1 + warmth / 500).toFixed(3)})`,
            transform: `rotate(${angle}deg) scale(${cover.toFixed(4)})`
          }}
        />
        <span
          className="esd-editor__tint"
          style={{
            background: warmth >= 0 ? '#ff8a2a' : '#2a7dff',
            opacity: ((Math.abs(warmth) / 100) * 0.7).toFixed(3)
          }}
        />
      </div>
      <div className="esd-editor__rows">
        {rows.map(row => (
          <div key={row.label}>
            <div className="esd-editor__row-head">
              <span style={{ color: 'inherit' }}>{row.label}</span>
              <span>{row.text}</span>
            </div>
            {row.slider}
          </div>
        ))}
      </div>
    </div>
  );
};

const BasicScene = ({ settings, icons, fill }) => {
  const set = ICON_SETS[icons];
  const vertical = settings.orientation === 'vertical';
  const size = settings.iconPlacement === 'inside' ? 20 : 18;
  return (
    <ElasticSlider
      {...settings}
      style={vertical ? { height: 240 } : { width: 'min(100%, 300px)' }}
      leftIcon={set ? <HugeiconsIcon icon={set[0]} size={size} strokeWidth={1.75} /> : null}
      rightIcon={set ? <HugeiconsIcon icon={set[1]} size={size} strokeWidth={1.75} /> : null}
      rangeColor={fill || undefined}
      ariaLabel="Slider"
    />
  );
};

const ElasticSliderDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { demo, preset, fillColor, icons, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = useColorModeValue('#18181b', '#f4f4f5');
  const basic = demo === 'basic';
  const physics = {
    maxStretch: settings.maxStretch,
    bounce: settings.bounce,
    growOnHover: settings.growOnHover,
    wheel: settings.wheel
  };

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const fitInside = (name, value) => {
    const roomy = settings.thickness >= 28;
    updateProps({
      [name]: value,
      ...(value === 'inside' && !roomy ? { thickness: 44, activeThickness: 48, radius: 14, restOpacity: 1 } : {})
    });
  };

  const computedProps = useMemo(() => (fillColor ? { rangeColor: fillColor } : {}), [fillColor]);

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['demo', 'preset', 'fillColor', 'icons']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <div className="esd-scene" data-theme={theme}>
              {demo === 'player' && <PlayerScene theme={theme} fill={fillColor} physics={physics} />}
              {demo === 'control' && <ControlScene theme={theme} fill={fillColor} physics={physics} />}
              {demo === 'editor' && <EditorScene theme={theme} fill={fillColor} physics={physics} />}
              {basic && <BasicScene settings={settings} icons={icons} fill={fillColor} />}
            </div>
          </Box>

          <Customize>
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={demo}
              onChange={value => updateProp('demo', value)}
            />
            <PreviewSelect
              title="Preset"
              options={PRESET_OPTIONS}
              value={preset}
              isDisabled={!basic}
              onChange={applyPreset}
            />
            <PreviewColorPickerCustom
              title="Fill Color"
              color={fillColor || ink}
              onChange={value => updateProp('fillColor', value)}
            />
            <PreviewSlider
              title="Max Stretch"
              min={0}
              max={120}
              step={1}
              value={settings.maxStretch}
              valueUnit="px"
              onChange={value => updateProp('maxStretch', value)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.95}
              step={0.05}
              value={settings.bounce}
              onChange={value => updateProp('bounce', value)}
            />
            <PreviewSelect
              title="Orientation"
              options={ORIENTATION_OPTIONS}
              value={settings.orientation}
              isDisabled={!basic}
              onChange={value => updateProp('orientation', value)}
            />
            <PreviewSelect
              title="Icons"
              options={ICON_OPTIONS}
              value={icons}
              isDisabled={!basic}
              onChange={value => updateProp('icons', value)}
            />
            <PreviewSelect
              title="Icon Placement"
              options={PLACEMENT_OPTIONS}
              value={settings.iconPlacement}
              isDisabled={!basic || icons === 'none'}
              onChange={value => fitInside('iconPlacement', value)}
            />
            <PreviewSelect
              title="Value"
              options={VALUE_OPTIONS}
              value={settings.valuePosition}
              isDisabled={!basic}
              onChange={value => fitInside('valuePosition', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={2}
              max={80}
              step={1}
              value={settings.thickness}
              valueUnit="px"
              isDisabled={!basic}
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Active Thickness"
              min={2}
              max={84}
              step={1}
              value={settings.activeThickness}
              valueUnit="px"
              isDisabled={!basic}
              onChange={value => updateProp('activeThickness', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={40}
              step={1}
              value={settings.radius}
              displayValue={value => (value >= 40 ? 'Full' : `${value}px`)}
              isDisabled={!basic}
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSlider
              title="Rest Opacity"
              min={0.2}
              max={1}
              step={0.05}
              value={settings.restOpacity}
              isDisabled={!basic}
              onChange={value => updateProp('restOpacity', value)}
            />
            <PreviewSlider
              title="Fill From"
              min={0}
              max={100}
              step={1}
              value={settings.fillFrom}
              isDisabled={!basic}
              onChange={value => updateProp('fillFrom', value)}
            />
            <PreviewSlider
              title="Step Size"
              min={1}
              max={25}
              step={1}
              value={settings.stepSize}
              isDisabled={!basic || !settings.isStepped}
              onChange={value => updateProp('stepSize', value)}
            />
            <PreviewSwitch
              title="Stepped"
              isChecked={settings.isStepped}
              isDisabled={!basic}
              onChange={value => updateProp('isStepped', value)}
            />
            <PreviewSwitch
              title="Ticks"
              isChecked={settings.ticks}
              isDisabled={!basic}
              onChange={value => updateProp('ticks', value)}
            />
            <PreviewSwitch
              title="Thumb"
              isChecked={settings.thumb}
              isDisabled={!basic}
              onChange={value => updateProp('thumb', value)}
            />
            <PreviewSwitch
              title="Grow on Hover"
              isChecked={settings.growOnHover}
              onChange={value => updateProp('growOnHover', value)}
            />
            <PreviewSwitch
              title="Jump to Click"
              isChecked={settings.jumpToClick}
              isDisabled={!basic}
              onChange={value => updateProp('jumpToClick', value)}
            />
            <PreviewSwitch title="Wheel" isChecked={settings.wheel} onChange={value => updateProp('wheel', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={elasticSlider} componentName="ElasticSlider" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ElasticSliderDemo;
