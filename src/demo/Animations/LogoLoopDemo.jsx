import { Box } from '@chakra-ui/react';
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiVercel,
  SiGithub,
  SiDocker,
  SiPrisma,
  SiSupabase,
  SiStripe
} from 'react-icons/si';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import LogoLoop from '../../content/Animations/LogoLoop/LogoLoop';
import { logoLoop } from '../../constants/code/Animations/logoLoopCode';

const items = [
  { node: <SiReact />, title: 'React', href: 'https://react.dev', hoverColor: '#61dafb' },
  { node: <SiNextdotjs />, title: 'Next.js', href: 'https://nextjs.org' },
  { node: <SiTypescript />, title: 'TypeScript', href: 'https://www.typescriptlang.org', hoverColor: '#3178c6' },
  { node: <SiTailwindcss />, title: 'Tailwind CSS', href: 'https://tailwindcss.com', hoverColor: '#38bdf8' },
  { node: <SiVercel />, title: 'Vercel', href: 'https://vercel.com' },
  { node: <SiGithub />, title: 'GitHub', href: 'https://github.com' },
  { node: <SiDocker />, title: 'Docker', href: 'https://www.docker.com', hoverColor: '#2496ed' },
  { node: <SiPrisma />, title: 'Prisma', href: 'https://www.prisma.io' },
  { node: <SiSupabase />, title: 'Supabase', href: 'https://supabase.com', hoverColor: '#3ecf8e' },
  { node: <SiStripe />, title: 'Stripe', href: 'https://stripe.com', hoverColor: '#635bff' }
];

const LOOK = {
  layout: 'line',
  direction: 'left',
  labels: 'none',
  speed: 100,
  hoverSpeed: 0,
  logoHeight: 48,
  gap: 56,
  bend: 0.5,
  focus: 0,
  magnify: 0,
  muted: 0,
  tiltX: 0,
  tiltY: 0,
  fadeOut: true,
  fadeOutWidth: 0.12,
  scrollBoost: 0,
  step: false,
  scaleOnHover: true
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  draggable: true,
  intro: true,
  useCustomRender: false
};

const PRESETS = {
  classic: {},
  minimal: { logoHeight: 36, gap: 72, speed: 60, muted: 0.6, scaleOnHover: false },
  stack: { labels: 'inline', logoHeight: 32, gap: 56, speed: 80, scaleOnHover: false },
  dock: { magnify: 0.8, labels: 'hover', muted: 0.5, logoHeight: 44, gap: 44, scaleOnHover: false },
  spotlight: { focus: 0.7, step: true, labels: 'hover', muted: 0.4, logoHeight: 44, scaleOnHover: false },
  wave: { layout: 'wave', bend: 0.6, scaleOnHover: false },
  arc: { layout: 'arc', bend: 0.6, scaleOnHover: false },
  orbit: { layout: 'orbit', bend: 0.6, scaleOnHover: false },
  perspective: { tiltX: 6, tiltY: -32, speed: 120, scaleOnHover: false },
  vertical: { direction: 'up', focus: 0.5, logoHeight: 40, gap: 40, scaleOnHover: false }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'stack', label: 'Stack' },
  { value: 'dock', label: 'Dock' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'wave', label: 'Wave' },
  { value: 'arc', label: 'Arc' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'perspective', label: 'Perspective' },
  { value: 'vertical', label: 'Vertical' }
];

const LAYOUT_OPTIONS = [
  { value: 'line', label: 'Line' },
  { value: 'wave', label: 'Wave' },
  { value: 'arc', label: 'Arc' },
  { value: 'orbit', label: 'Orbit' }
];

const DIRECTION_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' }
];

const LABEL_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'inline', label: 'Inline' },
  { value: 'below', label: 'Below' },
  { value: 'hover', label: 'On Hover' }
];

const propData = [
  {
    name: 'logos',
    type: 'LogoItem[]',
    default: 'required',
    description:
      'Logos to show. Each item is either { node } for any React node, like an icon, or { src, alt } for an image. Both accept an optional title, href and hoverColor, the brand color a logo takes on when hovered.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '120',
    description: 'Speed in pixels per second. Negative values reverse the direction.'
  },
  {
    name: 'direction',
    type: "'left' | 'right' | 'up' | 'down'",
    default: "'left'",
    description: 'Which way the logos travel.'
  },
  { name: 'width', type: 'number | string', default: "'100%'", description: 'Width of the loop.' },
  { name: 'logoHeight', type: 'number', default: '28', description: 'Height of each logo in pixels.' },
  { name: 'gap', type: 'number', default: '32', description: 'Space between logos in pixels.' },
  {
    name: 'hoverSpeed',
    type: 'number',
    default: 'undefined',
    description:
      'Speed while the loop is hovered or a logo has keyboard focus. 0 pauses it and a small value slows it down. By default it pauses.'
  },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'undefined',
    description: 'Set to false to keep full speed on hover. Ignored when hoverSpeed is set.'
  },
  {
    name: 'fadeOut',
    type: 'boolean',
    default: 'true',
    description: 'Fades the logos out softly at both ends. It is a transparent mask, so it works on any background.'
  },
  {
    name: 'fadeOutWidth',
    type: 'number',
    default: '0.12',
    description: 'Size of each fade as a fraction of the length, from 0 to 0.5.'
  },
  { name: 'scaleOnHover', type: 'boolean', default: 'false', description: 'Grows the hovered logo slightly.' },
  {
    name: 'layout',
    type: "'line' | 'wave' | 'arc' | 'orbit'",
    default: "'line'",
    description: 'Path the logos travel along: a straight line, a wave, an arc, or a ring that turns in 3D.'
  },
  {
    name: 'bend',
    type: 'number',
    default: '0.5',
    description:
      'How strongly the path bends, from -1 to 1. It sets the height of the wave, the curve of the arc or the tilt of the orbit. Negative values flip it.'
  },
  {
    name: 'focus',
    type: 'number',
    default: '0',
    description:
      'A lens in the middle, from 0 to 1. Logos grow and make room as they pass the center while the outer ones dim.'
  },
  {
    name: 'magnify',
    type: 'number',
    default: '0',
    description: 'Dock-style magnification under the cursor, from 0 to 1. Nearby logos move aside to make room.'
  },
  { name: 'tiltX', type: 'number', default: '0', description: 'Tilts the loop back or forward in 3D, in degrees.' },
  { name: 'tiltY', type: 'number', default: '0', description: 'Turns the loop to the side in 3D, in degrees.' },
  {
    name: 'step',
    type: 'boolean',
    default: 'false',
    description: 'Moves one logo at a time and pauses, centering each logo in turn. Speed sets the pace.'
  },
  {
    name: 'muted',
    type: 'number',
    default: '0',
    description: 'Greys out and dims the logos until one is hovered or centered, from 0 to 1.'
  },
  {
    name: 'labels',
    type: "'none' | 'inline' | 'below' | 'hover'",
    default: "'none'",
    description: "Shows each logo's title beside it, below it, or as a small caption when it is hovered or centered."
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'true',
    description: 'Lets people drag or swipe the loop and fling it. Links still open with a normal click.'
  },
  {
    name: 'scrollBoost',
    type: 'number',
    default: '0',
    description: 'Speeds the loop up while the page scrolls and reverses it when scrolling up, from 0 to 1.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Logos fade and rise in from left to right the first time the loop comes into view.'
  },
  {
    name: 'renderItem',
    type: '(item: LogoItem, key: React.Key) => React.ReactNode',
    default: 'undefined',
    description: 'Custom render function for each logo, for full control over how it looks.'
  },
  { name: 'ariaLabel', type: 'string', default: "'Partner logos'", description: 'Accessible name for the loop.' },
  { name: 'className', type: 'string', default: 'undefined', description: 'Extra class names for the container.' },
  { name: 'style', type: 'React.CSSProperties', default: 'undefined', description: 'Inline styles for the container.' }
];

const LogoLoopDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, useCustomRender, ...settings } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const bends = settings.layout !== 'line';

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'useCustomRender']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} p={0} overflow="hidden">
            <RefreshButton onClick={forceRerender} />
            <LogoLoop
              key={key}
              logos={items}
              {...settings}
              ariaLabel="Our tech stack"
              renderItem={
                useCustomRender
                  ? item => (
                      <Box
                        p="0.18em"
                        borderRadius="0.22em"
                        border="1px solid var(--border-primary)"
                        bg="var(--surface-ghost)"
                        lineHeight={0}
                      >
                        {'node' in item ? item.node : <img src={item.src} alt={item.alt} />}
                      </Box>
                    )
                  : undefined
              }
            />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Layout"
              options={LAYOUT_OPTIONS}
              value={settings.layout}
              onChange={value => updateProp('layout', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSelect
              title="Labels"
              options={LABEL_OPTIONS}
              value={settings.labels}
              onChange={value => updateProp('labels', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={300}
              step={10}
              value={settings.speed}
              valueUnit="px/s"
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Hover Speed"
              min={0}
              max={200}
              step={10}
              value={settings.hoverSpeed}
              valueUnit="px/s"
              onChange={value => updateProp('hoverSpeed', value)}
            />
            <PreviewSlider
              title="Logo Height"
              min={20}
              max={100}
              step={2}
              value={settings.logoHeight}
              valueUnit="px"
              onChange={value => updateProp('logoHeight', value)}
            />
            <PreviewSlider
              title="Gap"
              min={10}
              max={120}
              step={2}
              value={settings.gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Bend"
              min={-1}
              max={1}
              step={0.05}
              value={settings.bend}
              isDisabled={!bends}
              onChange={value => updateProp('bend', value)}
            />
            <PreviewSlider
              title="Focus"
              min={0}
              max={1}
              step={0.05}
              value={settings.focus}
              onChange={value => updateProp('focus', value)}
            />
            <PreviewSlider
              title="Magnify"
              min={0}
              max={1}
              step={0.05}
              value={settings.magnify}
              onChange={value => updateProp('magnify', value)}
            />
            <PreviewSlider
              title="Muted"
              min={0}
              max={1}
              step={0.05}
              value={settings.muted}
              onChange={value => updateProp('muted', value)}
            />
            <PreviewSlider
              title="Tilt X"
              min={-60}
              max={60}
              step={1}
              value={settings.tiltX}
              valueUnit="°"
              onChange={value => updateProp('tiltX', value)}
            />
            <PreviewSlider
              title="Tilt Y"
              min={-60}
              max={60}
              step={1}
              value={settings.tiltY}
              valueUnit="°"
              onChange={value => updateProp('tiltY', value)}
            />
            <PreviewSlider
              title="Fade Width"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.fadeOutWidth}
              isDisabled={!settings.fadeOut}
              onChange={value => updateProp('fadeOutWidth', value)}
            />
            <PreviewSlider
              title="Scroll Boost"
              min={0}
              max={1}
              step={0.05}
              value={settings.scrollBoost}
              onChange={value => updateProp('scrollBoost', value)}
            />
            <PreviewSwitch
              title="Fade Out"
              isChecked={settings.fadeOut}
              onChange={value => updateProp('fadeOut', value)}
            />
            <PreviewSwitch title="Step" isChecked={settings.step} onChange={value => updateProp('step', value)} />
            <PreviewSwitch
              title="Draggable"
              isChecked={settings.draggable}
              onChange={value => updateProp('draggable', value)}
            />
            <PreviewSwitch
              title="Scale on Hover"
              isChecked={settings.scaleOnHover}
              onChange={value => updateProp('scaleOnHover', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="Custom Render"
              isChecked={useCustomRender}
              onChange={value => updateProp('useCustomRender', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={logoLoop} componentName="LogoLoop" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LogoLoopDemo;
