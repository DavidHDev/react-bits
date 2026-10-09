import { useMemo } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import DecayCard from '../../content/Components/DecayCard/DecayCard';
import { decayCard } from '../../constants/code/Components/decayCardCode';

const IMAGE = 'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=900&q=80&auto=format&fit=crop';

const SCOPE_OPTIONS = [
  { value: 'window', label: 'Window' },
  { value: 'card', label: 'Card' }
];

const DEFAULT_PROPS = {
  preset: 'torn',
  width: 300,
  height: 400,
  intensity: 0.5,
  sensitivity: 0.5,
  hoverDecay: 0.05,
  recovery: 0.6,
  idle: 0.35,
  grain: 0.25,
  detail: 5,
  pattern: 4,
  flow: 0,
  chroma: 0,
  travel: 50,
  tilt: 10,
  scope: 'window',
  radius: 0,
  grayscale: false
};

const PRESETS = {
  torn: {},
  shatter: { intensity: 0.7, grain: 0.5, detail: 6, sensitivity: 0.65, recovery: 0.45 },
  melt: { intensity: 0.45, grain: 0.1, detail: 2, recovery: 1, flow: 0.4 },
  prism: { intensity: 0.4, chroma: 0.6, flow: 0.3, radius: 16 },
  subtle: { intensity: 0.25, sensitivity: 0.35, hoverDecay: 0.1, idle: 0.2, travel: 20, tilt: 4, radius: 16 },
  still: { intensity: 0.4, scope: 'card', travel: 0, tilt: 0, hoverDecay: 0.15, radius: 16 }
};

const PRESET_OPTIONS = [
  { value: 'torn', label: 'Torn' },
  { value: 'shatter', label: 'Shatter' },
  { value: 'melt', label: 'Melt' },
  { value: 'prism', label: 'Prism' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'still', label: 'Still' }
];

const DecayCardDemo = () => {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, DEFAULT_PROPS[key]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(() => ({ image: IMAGE }), []);

  const propData = useMemo(
    () => [
      { name: 'image', type: 'string', default: '-', description: 'Image URL. It fills the card like a cover.' },
      {
        name: 'children',
        type: 'ReactNode',
        default: '-',
        description: 'Content shown over the bottom of the image.'
      },
      { name: 'width', type: 'number', default: '300', description: 'Card width in pixels.' },
      { name: 'height', type: 'number', default: '400', description: 'Card height in pixels.' },
      {
        name: 'intensity',
        type: 'number',
        default: '0.5',
        description:
          'How far the image tears apart at full decay, from 0 to 2. The edges tear the most so the photo stays readable.'
      },
      {
        name: 'sensitivity',
        type: 'number',
        default: '0.5',
        description: 'How little pointer movement it takes to reach full decay, from 0 to 1.'
      },
      {
        name: 'hoverDecay',
        type: 'number',
        default: '0.05',
        description: 'Decay that stays while the pointer rests on the card, from 0 to 1.'
      },
      {
        name: 'recovery',
        type: 'number',
        default: '0.6',
        description: 'Seconds the image takes to pull itself back together once the pointer slows down.'
      },
      {
        name: 'idle',
        type: 'number',
        default: '0.35',
        description: 'Keeps the edges slowly fraying and soft patches drifting while nobody interacts, from 0 to 1.'
      },
      {
        name: 'grain',
        type: 'number',
        default: '0.25',
        description: 'Size of the tears, from broad melting shapes at 0 to fine shards at 1.'
      },
      {
        name: 'detail',
        type: 'number',
        default: '5',
        description: 'Layers of noise in the tears, from 1 to 8. More layers give rougher edges.'
      },
      { name: 'pattern', type: 'number', default: '4', description: 'Picks a different tear pattern.' },
      {
        name: 'flow',
        type: 'number',
        default: '0',
        description: 'Lets the tears churn while the card is decaying. 0 keeps them still.'
      },
      {
        name: 'chroma',
        type: 'number',
        default: '0',
        description: 'Splits the color channels apart inside the tears.'
      },
      {
        name: 'travel',
        type: 'number',
        default: '50',
        description: 'How far in pixels the card drifts toward the pointer before it slows down.'
      },
      {
        name: 'tilt',
        type: 'number',
        default: '10',
        description: 'How far in degrees the card rotates as the pointer moves sideways.'
      },
      {
        name: 'scope',
        type: "'window' | 'card'",
        default: "'window'",
        description: 'Window follows the pointer anywhere on the page. Card only reacts while it is hovered.'
      },
      { name: 'radius', type: 'number', default: '0', description: 'Corner radius of the image in pixels.' },
      { name: 'grayscale', type: 'boolean', default: 'false', description: 'Shows the image in grayscale.' },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root.' }
    ],
    []
  );

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
          <Box position="relative" className="demo-container" h={560} overflow="hidden">
            <Flex align="center" justify="center" w="100%" h="100%">
              <DecayCard {...settings} image={IMAGE}>
                <Text fontSize="12px" color="rgba(255, 255, 255, 0.72)" mb={1}>
                  No. 01
                </Text>
                <Text fontSize="22px" fontWeight={600} letterSpacing="-0.4px" lineHeight={1.15}>
                  Afterglow
                </Text>
              </DecayCard>
            </Flex>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSlider
              title="Intensity"
              min={0}
              max={2}
              step={0.05}
              value={props.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Sensitivity"
              min={0}
              max={1}
              step={0.05}
              value={props.sensitivity}
              onChange={value => updateProp('sensitivity', value)}
            />
            <PreviewSlider
              title="Hover Decay"
              min={0}
              max={1}
              step={0.05}
              value={props.hoverDecay}
              onChange={value => updateProp('hoverDecay', value)}
            />
            <PreviewSlider
              title="Recovery"
              min={0.1}
              max={3}
              step={0.1}
              value={props.recovery}
              valueUnit="s"
              onChange={value => updateProp('recovery', value)}
            />
            <PreviewSlider
              title="Idle"
              min={0}
              max={1}
              step={0.05}
              value={props.idle}
              onChange={value => updateProp('idle', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={1}
              step={0.01}
              value={props.grain}
              onChange={value => updateProp('grain', value)}
            />
            <PreviewSlider
              title="Detail"
              min={1}
              max={8}
              step={1}
              value={props.detail}
              onChange={value => updateProp('detail', value)}
            />
            <PreviewSlider
              title="Pattern"
              min={0}
              max={50}
              step={1}
              value={props.pattern}
              onChange={value => updateProp('pattern', value)}
            />
            <PreviewSlider
              title="Flow"
              min={0}
              max={2}
              step={0.05}
              value={props.flow}
              onChange={value => updateProp('flow', value)}
            />
            <PreviewSlider
              title="Chroma"
              min={0}
              max={2}
              step={0.05}
              value={props.chroma}
              onChange={value => updateProp('chroma', value)}
            />
            <PreviewSlider
              title="Travel"
              min={0}
              max={150}
              step={5}
              value={props.travel}
              valueUnit="px"
              onChange={value => updateProp('travel', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={30}
              step={1}
              value={props.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSelect
              title="Scope"
              options={SCOPE_OPTIONS}
              value={props.scope}
              onChange={value => updateProp('scope', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={40}
              step={1}
              value={props.radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSlider
              title="Width"
              min={200}
              max={420}
              step={10}
              value={props.width}
              valueUnit="px"
              onChange={value => updateProp('width', value)}
            />
            <PreviewSlider
              title="Height"
              min={260}
              max={480}
              step={10}
              value={props.height}
              valueUnit="px"
              onChange={value => updateProp('height', value)}
            />
            <PreviewSwitch
              title="Grayscale"
              isChecked={props.grayscale}
              onChange={value => updateProp('grayscale', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={decayCard} componentName="DecayCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default DecayCardDemo;
