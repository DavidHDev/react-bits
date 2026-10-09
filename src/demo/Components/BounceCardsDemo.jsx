import { useMemo } from 'react';
import { Flex } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import CodeExample from '../../components/code/CodeExample';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PropTable from '../../components/common/Preview/PropTable';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import BounceCards from '../../content/Components/BounceCards/BounceCards';
import { bounceCards } from '../../constants/code/Components/bounceCardsCode';

const IMAGES = [
  '1724152312974-d4d48b8b36fd',
  '1762846818262-33c197852fa8',
  '1721407964262-f9864b562453',
  '1776394254711-4a0d7345269a',
  '1763440519433-5467759054fc'
].map(id => `https://images.unsplash.com/photo-${id}?w=480&h=480&q=80&auto=format&fit=crop`);

const DEFAULT_PROPS = {
  preset: 'fan',
  cardSize: 200,
  spread: 85,
  rotation: 10,
  arc: 0,
  pushDistance: 160,
  hoverScale: 1.06,
  bounciness: 0.6,
  animationDelay: 0.5,
  animationStagger: 0.06,
  borderWidth: 5,
  borderColor: '#ffffff',
  radius: 25,
  shadow: true,
  enableHover: true
};

const PRESETS = {
  fan: {},
  pile: { spread: 26, rotation: 14, pushDistance: 130 },
  row: { spread: 118, rotation: 0, pushDistance: 70, cardSize: 150, radius: 16, borderWidth: 0 },
  arc: { arc: 38, rotation: 12, spread: 92 },
  polaroid: { radius: 4, borderWidth: 10, rotation: 8, cardSize: 180 }
};

const PRESET_OPTIONS = [
  { value: 'fan', label: 'Fan' },
  { value: 'pile', label: 'Pile' },
  { value: 'row', label: 'Row' },
  { value: 'arc', label: 'Arc' },
  { value: 'polaroid', label: 'Polaroid' }
];

const BounceCardsDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, DEFAULT_PROPS[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const propData = useMemo(
    () => [
      {
        name: 'images',
        type: 'Array<string | { src: string; alt?: string }>',
        default: '[]',
        description: 'Images for the cards, from left to right.'
      },
      { name: 'containerWidth', type: 'number', default: '400', description: 'Width of the container in pixels.' },
      { name: 'containerHeight', type: 'number', default: '400', description: 'Height of the container in pixels.' },
      { name: 'cardSize', type: 'number', default: '200', description: 'Width and height of each card in pixels.' },
      { name: 'spread', type: 'number', default: '85', description: 'Horizontal distance between cards in pixels.' },
      {
        name: 'rotation',
        type: 'number',
        default: '10',
        description: 'Largest tilt in degrees. Each card leans by a different share of it, like a loose pile.'
      },
      {
        name: 'arc',
        type: 'number',
        default: '0',
        description: 'Drops the outer cards by this many pixels so the fan curves. Negative values curve it up.'
      },
      {
        name: 'pushDistance',
        type: 'number',
        default: '160',
        description: 'How far the other cards slide away from the hovered one, in pixels.'
      },
      {
        name: 'hoverScale',
        type: 'number',
        default: '1.06',
        description: 'Scale of the hovered card as it straightens and comes to the front.'
      },
      {
        name: 'bounciness',
        type: 'number',
        default: '0.6',
        description: 'How much the cards overshoot as they pop in, from 0 to 1.'
      },
      {
        name: 'animationDelay',
        type: 'number',
        default: '0.5',
        description: 'Seconds before the first card pops in.'
      },
      { name: 'animationStagger', type: 'number', default: '0.06', description: 'Seconds between cards popping in.' },
      { name: 'enableHover', type: 'boolean', default: 'true', description: 'Spreads the cards apart on hover.' },
      { name: 'borderWidth', type: 'number', default: '5', description: 'Width of the card border in pixels.' },
      { name: 'borderColor', type: 'string', default: "'#ffffff'", description: 'Color of the card border.' },
      { name: 'radius', type: 'number', default: '25', description: 'Corner radius of the cards in pixels.' },
      { name: 'shadow', type: 'boolean', default: 'true', description: 'Soft drop shadow that deepens on hover.' },
      {
        name: 'onCardClick',
        type: '(index: number) => void',
        default: '-',
        description: 'Called with the card index on click or Enter. Cards become focusable buttons when it is set.'
      },
      {
        name: 'transformStyles',
        type: 'string[]',
        default: '-',
        description:
          'Optional custom positions such as "rotate(5deg) translate(-150px)". Overrides spread, rotation and arc.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
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
    >
      <TabsLayout>
        <PreviewTab>
          <Flex
            overflow="hidden"
            justifyContent="center"
            alignItems="center"
            minH="500px"
            position="relative"
            className="demo-container"
          >
            <BounceCards key={key} images={IMAGES} containerWidth={500} containerHeight={320} {...settings} />
            <RefreshButton onClick={forceRerender} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSlider
              title="Card Size"
              min={100}
              max={260}
              step={5}
              value={props.cardSize}
              valueUnit="px"
              onChange={value => updateProp('cardSize', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={150}
              step={1}
              value={props.spread}
              valueUnit="px"
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={0}
              max={25}
              step={1}
              value={props.rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Arc"
              min={-60}
              max={60}
              step={1}
              value={props.arc}
              valueUnit="px"
              onChange={value => updateProp('arc', value)}
            />
            <PreviewSlider
              title="Push Distance"
              min={0}
              max={240}
              step={5}
              value={props.pushDistance}
              valueUnit="px"
              onChange={value => updateProp('pushDistance', value)}
            />
            <PreviewSlider
              title="Hover Scale"
              min={1}
              max={1.25}
              step={0.01}
              value={props.hoverScale}
              onChange={value => updateProp('hoverScale', value)}
            />
            <PreviewSlider
              title="Bounciness"
              min={0}
              max={1}
              step={0.05}
              value={props.bounciness}
              onChange={value => {
                updateProp('bounciness', value);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Delay"
              min={0}
              max={2}
              step={0.1}
              value={props.animationDelay}
              valueUnit="s"
              onChange={value => {
                updateProp('animationDelay', value);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.3}
              step={0.01}
              value={props.animationStagger}
              valueUnit="s"
              onChange={value => {
                updateProp('animationStagger', value);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Border Width"
              min={0}
              max={14}
              step={1}
              value={props.borderWidth}
              valueUnit="px"
              onChange={value => updateProp('borderWidth', value)}
            />
            <PreviewColorPickerCustom
              title="Border Color"
              color={props.borderColor}
              onChange={value => updateProp('borderColor', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={60}
              step={1}
              value={props.radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSwitch title="Shadow" isChecked={props.shadow} onChange={value => updateProp('shadow', value)} />
            <PreviewSwitch
              title="Hover"
              isChecked={props.enableHover}
              onChange={value => updateProp('enableHover', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={bounceCards} componentName="BounceCards" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default BounceCardsDemo;
