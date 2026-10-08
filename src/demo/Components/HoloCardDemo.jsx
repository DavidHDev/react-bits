import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import HoloCard from '../../content/Components/HoloCard/HoloCard';
import { holoCard } from '../../constants/code/Components/holoCardCode';
import pikachu from '../../assets/holo-card/pikachu.webp';
import mew from '../../assets/holo-card/mew.webp';
import maushold from '../../assets/holo-card/maushold.webp';

const CARDS = {
  pikachu: { image: pikachu, alt: 'Pikachu trading card', preset: 'bursts' },
  mew: { image: mew, alt: 'Mew trading card', preset: 'glitter' },
  maushold: { image: maushold, alt: 'Maushold trading card', preset: 'rainbow' }
};

const CARD_OPTIONS = [
  { label: 'Pikachu', value: 'pikachu' },
  { label: 'Mew', value: 'mew' },
  { label: 'Maushold', value: 'maushold' }
];

const PRESET_OPTIONS = [
  { label: 'Bursts', value: 'bursts' },
  { label: 'Stars', value: 'stars' },
  { label: 'Shards', value: 'shards' },
  { label: 'Cosmos', value: 'cosmos' },
  { label: 'Rainbow', value: 'rainbow' },
  { label: 'Swirl', value: 'swirl' },
  { label: 'Glitter', value: 'glitter' },
  { label: 'Gold', value: 'gold' }
];

const DEFAULT_PROPS = {
  card: 'pikachu',
  preset: 'bursts',
  foilColor: '#e2e6ec',
  intensity: 0.85,
  scale: 1,
  edgeSparkle: 0.8,
  frame: 4,
  glare: 0.5,
  tiltMax: 14,
  hoverScale: 1.04,
  radius: 14,
  width: 320,
  idle: true,
  shadow: true
};

const HoloCardDemo = () => {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { card, ...cardProps } = props;
  const chosen = CARDS[card] ?? CARDS.pikachu;

  const propData = useMemo(
    () => [
      {
        name: 'image',
        type: 'string',
        default: '-',
        description: 'Front of the card. Same-origin or CORS-enabled URL.'
      },
      {
        name: 'backImage',
        type: 'string',
        default: '-',
        description: 'Back of the card. When set, a click or Enter flips the card over.'
      },
      { name: 'alt', type: 'string', default: "''", description: 'Accessible description of the card.' },
      {
        name: 'preset',
        type: "'bursts' | 'stars' | 'shards' | 'cosmos' | 'rainbow' | 'swirl' | 'glitter' | 'gold'",
        default: "'bursts'",
        description:
          'The holo pattern on the card face. Bursts are rings of foil dashes, shards are cracked ice, swirl is one big round rainbow and gold is a warm etched foil.'
      },
      {
        name: 'foilColor',
        type: 'string',
        default: "'#e2e6ec'",
        description: 'Colour of the metal under the print, silver by default.'
      },
      {
        name: 'intensity',
        type: 'number',
        default: '0.85',
        description: 'How strongly the foil shows through the print, from 0 for plain card to 1.'
      },
      {
        name: 'scale',
        type: 'number',
        default: '1',
        description: 'Size of the holo pattern. Higher values pack in more, smaller elements.'
      },
      {
        name: 'edgeSparkle',
        type: 'number',
        default: '0.8',
        description: 'Brightness of the glitter on the silver border as it catches the light.'
      },
      {
        name: 'frame',
        type: 'number',
        default: '4',
        description: 'Width of the sparkling border as a percentage of the card width. Match it to your card art.'
      },
      {
        name: 'glare',
        type: 'number',
        default: '0.5',
        description: 'Strength of the glossy highlight under the light.'
      },
      { name: 'tiltMax', type: 'number', default: '14', description: 'Largest tilt in degrees as the pointer moves.' },
      { name: 'hoverScale', type: 'number', default: '1.04', description: 'How much the card lifts while hovered.' },
      { name: 'radius', type: 'number', default: '14', description: 'Corner radius in px.' },
      { name: 'width', type: 'number', default: '320', description: 'Card width in px. The height follows the image.' },
      {
        name: 'idle',
        type: 'boolean',
        default: 'true',
        description: 'Drifts the light and tilt slowly when nobody is hovering, so the foil keeps shimmering.'
      },
      {
        name: 'shadow',
        type: 'boolean',
        default: 'true',
        description: 'Soft shadow under the card that follows the tilt.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root element.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={620}
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <HoloCard image={chosen.image} alt={chosen.alt} {...cardProps} />
          </Box>

          <Customize>
            <PreviewSelect
              title="Card"
              options={CARD_OPTIONS}
              value={card}
              onChange={value => updateProps({ card: value, preset: CARDS[value]?.preset ?? 'bursts' })}
            />
            <PreviewSelect
              title="Preset"
              options={PRESET_OPTIONS}
              value={props.preset}
              onChange={value => updateProp('preset', value)}
            />
            <PreviewColorPickerCustom
              title="Foil Color"
              color={props.foilColor}
              onChange={value => updateProp('foilColor', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0}
              max={1}
              step={0.05}
              value={props.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.5}
              max={2}
              step={0.05}
              value={props.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Edge Sparkle"
              min={0}
              max={1}
              step={0.05}
              value={props.edgeSparkle}
              onChange={value => updateProp('edgeSparkle', value)}
            />
            <PreviewSlider
              title="Frame"
              min={0}
              max={10}
              step={0.5}
              value={props.frame}
              onChange={value => updateProp('frame', value)}
              displayValue={value => `${value}%`}
            />
            <PreviewSlider
              title="Glare"
              min={0}
              max={1}
              step={0.05}
              value={props.glare}
              onChange={value => updateProp('glare', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={30}
              step={1}
              value={props.tiltMax}
              onChange={value => updateProp('tiltMax', value)}
              displayValue={value => `${value}°`}
            />
            <PreviewSlider
              title="Hover Scale"
              min={1}
              max={1.1}
              step={0.01}
              value={props.hoverScale}
              onChange={value => updateProp('hoverScale', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={30}
              step={1}
              value={props.radius}
              onChange={value => updateProp('radius', value)}
              displayValue={value => `${value}px`}
            />
            <PreviewSlider
              title="Width"
              min={220}
              max={420}
              step={10}
              value={props.width}
              onChange={value => updateProp('width', value)}
              displayValue={value => `${value}px`}
            />
            <PreviewSwitch title="Idle Shimmer" isChecked={props.idle} onChange={value => updateProp('idle', value)} />
            <PreviewSwitch title="Shadow" isChecked={props.shadow} onChange={value => updateProp('shadow', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={holoCard} componentName="HoloCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default HoloCardDemo;
