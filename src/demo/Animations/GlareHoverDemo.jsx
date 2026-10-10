import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import GlareHover from '../../content/Animations/GlareHover/GlareHover';
import { glareHover } from '../../constants/code/Animations/glareHoverCode';

const LOOK = {
  mode: 'hover',
  variant: 'streak',
  glareOpacity: 0.5,
  glareSize: 30,
  softness: 0.6,
  glareAngle: -45,
  transitionDuration: 650,
  interval: 3
};

const PRESETS = {
  sweep: { ...LOOK },
  twin: {
    ...LOOK,
    variant: 'twin',
    glareOpacity: 0.6,
    glareSize: 40,
    softness: 0.4,
    glareAngle: -60,
    transitionDuration: 800
  },
  follow: {
    ...LOOK,
    mode: 'follow',
    variant: 'sheen',
    glareOpacity: 0.45,
    glareSize: 55,
    softness: 0.8,
    glareAngle: -30
  },
  shine: {
    ...LOOK,
    mode: 'loop',
    glareOpacity: 0.7,
    glareSize: 16,
    softness: 0.3,
    glareAngle: -60,
    transitionDuration: 900,
    interval: 2.5
  }
};

const DEFAULT_PROPS = {
  preset: 'sweep',
  ...LOOK,
  glareColor: '#ffffff',
  blendMode: 'screen',
  rimGlint: true,
  playOnce: false,
  intro: false
};

const PRESET_OPTIONS = [
  { value: 'sweep', label: 'Sweep' },
  { value: 'twin', label: 'Twin' },
  { value: 'follow', label: 'Follow' },
  { value: 'shine', label: 'Shine' }
];

const MODE_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'follow', label: 'Follow' },
  { value: 'loop', label: 'Loop' },
  { value: 'click', label: 'Click' }
];

const VARIANT_OPTIONS = [
  { value: 'streak', label: 'Streak' },
  { value: 'twin', label: 'Twin' },
  { value: 'sheen', label: 'Sheen' }
];

const BLEND_OPTIONS = [
  { value: 'screen', label: 'Screen' },
  { value: 'normal', label: 'Normal' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' }
];

const propData = [
  { name: 'children', type: 'ReactNode', default: '-', description: 'The content the glare passes over.' },
  {
    name: 'mode',
    type: "'hover' | 'follow' | 'loop' | 'click'",
    default: "'hover'",
    description: 'Sweep on hover, follow the cursor, shine on a timer, or sweep on click.'
  },
  {
    name: 'variant',
    type: "'streak' | 'twin' | 'sheen'",
    default: "'streak'",
    description: 'Shape of the glare: one bright streak, a double streak like glass, or a soft wide sheen.'
  },
  { name: 'glareColor', type: 'string', default: "'#ffffff'", description: 'Color of the glare. Any CSS color.' },
  { name: 'glareOpacity', type: 'number', default: '0.5', description: 'Brightness of the glare, from 0 to 1.' },
  {
    name: 'glareSize',
    type: 'number',
    default: '30',
    description: "Width of the glare as a percentage of the element's diagonal."
  },
  { name: 'softness', type: 'number', default: '0.6', description: 'How soft the core of the glare is, from 0 to 1.' },
  { name: 'glareAngle', type: 'number', default: '-45', description: 'Direction the glare travels, in degrees.' },
  {
    name: 'blendMode',
    type: 'string',
    default: "'screen'",
    description: 'How the glare mixes with the content: screen, normal, overlay or soft-light.'
  },
  {
    name: 'rimGlint',
    type: 'boolean',
    default: 'true',
    description: 'Lets the edge catch the light where the glare crosses it.'
  },
  {
    name: 'transitionDuration',
    type: 'number',
    default: '650',
    description: 'How long one sweep takes, in milliseconds.'
  },
  { name: 'interval', type: 'number', default: '3', description: 'Seconds between shines in loop mode.' },
  {
    name: 'playOnce',
    type: 'boolean',
    default: 'false',
    description: 'In hover mode, sweeps only on the way in instead of again on the way out.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'false',
    description: 'Sweeps once when the element first scrolls into view.'
  },
  { name: 'width', type: 'string', default: "'auto'", description: 'Width of the element.' },
  { name: 'height', type: 'string', default: "'auto'", description: 'Height of the element.' },
  { name: 'background', type: 'string', default: "'transparent'", description: 'Background of the element.' },
  { name: 'borderRadius', type: 'string', default: "'10px'", description: 'Corner radius of the element.' },
  { name: 'borderColor', type: 'string', default: "'transparent'", description: 'Border color of the element.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the element.' },
  { name: 'style', type: 'CSSProperties', default: '{}', description: 'Inline styles for the element.' }
];

const GlareHoverDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const photo = `/assets/demo/${theme === 'light' ? 'day' : 'night'}-sky.webp`;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(() => ({ width: '360px', height: '240px', borderRadius: '20px' }), []);

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={460} overflow="hidden">
            <GlareHover key={key} width="min(360px, 82vw)" borderRadius="20px" {...settings}>
              <img
                src={photo}
                alt=""
                draggable={false}
                style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', display: 'block' }}
              />
            </GlareHover>
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Glare Color"
              color={settings.glareColor}
              onChange={value => updateProp('glareColor', value)}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings.mode}
              onChange={value => updateProp('mode', value)}
            />
            <PreviewSelect
              title="Variant"
              options={VARIANT_OPTIONS}
              value={settings.variant}
              onChange={value => updateProp('variant', value)}
            />
            <PreviewSelect
              title="Blend"
              options={BLEND_OPTIONS}
              value={settings.blendMode}
              onChange={value => updateProp('blendMode', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings.glareOpacity}
              onChange={value => updateProp('glareOpacity', value)}
            />
            <PreviewSlider
              title="Size"
              min={5}
              max={80}
              step={1}
              value={settings.glareSize}
              valueUnit="%"
              onChange={value => updateProp('glareSize', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.05}
              value={settings.softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Angle"
              min={-90}
              max={90}
              step={1}
              value={settings.glareAngle}
              valueUnit="°"
              onChange={value => updateProp('glareAngle', value)}
            />
            <PreviewSlider
              title="Duration"
              min={200}
              max={2000}
              step={50}
              value={settings.transitionDuration}
              valueUnit="ms"
              onChange={value => updateProp('transitionDuration', value)}
            />
            {settings.mode === 'loop' && (
              <PreviewSlider
                title="Interval"
                min={1}
                max={8}
                step={0.5}
                value={settings.interval}
                valueUnit="s"
                onChange={value => updateProp('interval', value)}
              />
            )}
            <PreviewSwitch
              title="Rim Glint"
              isChecked={settings.rimGlint}
              onChange={value => updateProp('rimGlint', value)}
            />
            {settings.mode === 'hover' && (
              <PreviewSwitch
                title="Play Once"
                isChecked={settings.playOnce}
                onChange={value => updateProp('playOnce', value)}
              />
            )}
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={glareHover} componentName="GlareHover" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GlareHoverDemo;
