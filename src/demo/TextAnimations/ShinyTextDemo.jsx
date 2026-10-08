import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';

import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import Customize from '../../components/common/Preview/Customize';

import ShinyText from '../../content/TextAnimations/ShinyText/ShinyText';
import { shinyText } from '../../constants/code/TextAnimations/shinyTextCode';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

const DEFAULT_PROPS = {
  color: '#b5b5b5',
  shineColor: '#ffffff',
  speed: 2,
  delay: 0,
  angle: 120,
  shineWidth: 40,
  softness: 0.8,
  bands: 1,
  glow: 0,
  direction: 'left',
  easing: 'smooth',
  trigger: 'loop',
  yoyo: false,
  followPointer: false,
  pauseOnHover: false,
  disabled: false
};

const DIRECTION_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const EASING_OPTIONS = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'linear', label: 'Linear' },
  { value: 'snappy', label: 'Snappy' }
];

const TRIGGER_OPTIONS = [
  { value: 'loop', label: 'Loop' },
  { value: 'hover', label: 'Hover' },
  { value: 'view', label: 'In View' }
];

const ShinyTextDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const renderedColor = useColorModeValue(props.color === DEFAULT_PROPS.color ? '#71717a' : props.color, props.color);
  const renderedShineColor = useColorModeValue(
    props.shineColor === DEFAULT_PROPS.shineColor ? '#27272a' : props.shineColor,
    props.shineColor
  );

  const propData = useMemo(
    () => [
      { name: 'text', type: 'string', default: '-', description: 'The text to shine. Children work too.' },
      { name: 'color', type: 'string', default: '"#b5b5b5"', description: 'Base color of the text.' },
      { name: 'shineColor', type: 'string', default: '"#ffffff"', description: 'Color of the light passing over it.' },
      { name: 'speed', type: 'number', default: '2', description: 'Seconds for one sweep across the text.' },
      { name: 'delay', type: 'number', default: '0', description: 'Seconds of rest between sweeps.' },
      {
        name: 'angle',
        type: 'number',
        default: '120',
        description: 'Tilt of the band of light in degrees. 90 is upright, higher leans it forward.'
      },
      {
        name: 'shineWidth',
        type: 'number',
        default: '40',
        description: 'How wide the band of light is, as a percentage of the text.'
      },
      {
        name: 'softness',
        type: 'number',
        default: '0.8',
        description: 'How gently the band fades at its edges, from 0 for a crisp glint to 1 for a soft sheen.'
      },
      {
        name: 'bands',
        type: 'number',
        default: '1',
        description: 'How many bands of light follow each other, like reflections sliding across chrome.'
      },
      {
        name: 'glow',
        type: 'number',
        default: '0',
        description: 'A soft bloom of light that travels with the band, from 0 to 1.'
      },
      {
        name: 'direction',
        type: "'left' | 'right'",
        default: '"left"',
        description: 'Which way the light travels.'
      },
      {
        name: 'easing',
        type: "'smooth' | 'linear' | 'snappy'",
        default: '"smooth"',
        description:
          'Feel of each sweep. Smooth glides in and out, linear keeps an even pace and snappy flashes across with a pause between.'
      },
      {
        name: 'trigger',
        type: "'loop' | 'hover' | 'view'",
        default: '"loop"',
        description: 'When it shines: on a loop, once each time the pointer enters, or once when scrolled into view.'
      },
      {
        name: 'yoyo',
        type: 'boolean',
        default: 'false',
        description: 'Sweeps back and forth instead of always starting from the same side.'
      },
      {
        name: 'followPointer',
        type: 'boolean',
        default: 'false',
        description: 'While hovered, the light glides after the pointer, then slides off when it leaves.'
      },
      {
        name: 'pauseOnHover',
        type: 'boolean',
        default: 'false',
        description: 'Freezes the sweep while the pointer is over the text.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Shows plain text with no shine.' },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root element.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" minH={400} fontSize="44px" fontWeight="600">
            <ShinyText {...props} text="Shiny Text Effect" color={renderedColor} shineColor={renderedShineColor} />
          </Box>

          <Customize>
            <PreviewColorPickerCustom
              title="Text Color"
              color={renderedColor}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Shine Color"
              color={renderedShineColor}
              onChange={value => updateProp('shineColor', value)}
            />
            <PreviewSlider
              title="Shine Width"
              min={5}
              max={100}
              step={1}
              value={props.shineWidth}
              valueUnit="%"
              onChange={value => updateProp('shineWidth', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.05}
              value={props.softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Angle"
              min={60}
              max={150}
              step={1}
              value={props.angle}
              valueUnit="°"
              onChange={value => updateProp('angle', value)}
            />
            <PreviewSlider
              title="Bands"
              min={1}
              max={3}
              step={1}
              value={props.bands}
              onChange={value => updateProp('bands', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.05}
              value={props.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0.5}
              max={5}
              step={0.1}
              value={props.speed}
              valueUnit="s"
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Delay"
              min={0}
              max={3}
              step={0.1}
              value={props.delay}
              valueUnit="s"
              onChange={value => updateProp('delay', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={props.direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSelect
              title="Easing"
              options={EASING_OPTIONS}
              value={props.easing}
              onChange={value => updateProp('easing', value)}
            />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={props.trigger}
              onChange={value => updateProp('trigger', value)}
            />
            <PreviewSwitch title="Yoyo" isChecked={props.yoyo} onChange={value => updateProp('yoyo', value)} />
            <PreviewSwitch
              title="Follow Pointer"
              isChecked={props.followPointer}
              onChange={value => updateProp('followPointer', value)}
            />
            <PreviewSwitch
              title="Pause on Hover"
              isChecked={props.pauseOnHover}
              onChange={value => updateProp('pauseOnHover', value)}
            />
            <PreviewSwitch
              title="Disabled"
              isChecked={props.disabled}
              onChange={value => updateProp('disabled', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={shinyText} componentName="ShinyText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ShinyTextDemo;
