import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import Carousel from '../../content/Components/Carousel/Carousel';
import { carousel } from '../../constants/code/Components/carouselCode';

const CLOUDS = 'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=1200&q=80&auto=format&fit=crop';

const PHOTOS = [
  {
    id: 1,
    image: '/assets/demo/day-landscape.webp',
    title: 'Open fields',
    description: 'Bright skies over rapeseed in full bloom.'
  },
  {
    id: 2,
    image: '/assets/demo/night-landscape.webp',
    title: 'Moonrise',
    description: 'The same field, quiet under a full moon.'
  },
  { id: 3, image: CLOUDS, title: 'Above the clouds', description: 'Soft light from the window seat.' },
  {
    id: 4,
    image: '/assets/demo/day-portrait.webp',
    title: 'The pier',
    description: 'Clear water and a long walk out.'
  },
  {
    id: 5,
    image: '/assets/demo/night-portrait.webp',
    title: 'Last light',
    description: 'Pink skies as the lamps come on.'
  }
];

const STORIES = [PHOTOS[3], PHOTOS[4], PHOTOS[0], PHOTOS[1], PHOTOS[2]];

const DEFAULT_PROPS = {
  preset: 'features',
  baseWidth: 300,
  aspectRatio: 1.25,
  peek: 0,
  gap: 16,
  radius: 12,
  frame: true,
  effect: 'tilt',
  indicator: 'dots',
  arrows: false,
  autoplay: false,
  autoplayDelay: 3000,
  pauseOnHover: false,
  loop: false,
  draggable: true,
  round: false
};

const PRESETS = {
  features: {},
  highlights: {
    baseWidth: 640,
    aspectRatio: 1.6,
    peek: 64,
    radius: 20,
    frame: false,
    effect: 'scale',
    indicator: 'bars',
    arrows: true,
    autoplay: true,
    autoplayDelay: 4000,
    pauseOnHover: true,
    loop: true
  },
  stories: {
    baseWidth: 270,
    aspectRatio: 0.62,
    radius: 18,
    frame: false,
    effect: 'cube',
    indicator: 'bars',
    autoplay: true,
    autoplayDelay: 5000,
    loop: true
  }
};

const PRESET_OPTIONS = [
  { value: 'features', label: 'Features' },
  { value: 'highlights', label: 'Highlights' },
  { value: 'stories', label: 'Stories' }
];

const EFFECT_OPTIONS = [
  { value: 'tilt', label: 'Tilt' },
  { value: 'slide', label: 'Slide' },
  { value: 'scale', label: 'Scale' },
  { value: 'fade', label: 'Fade' },
  { value: 'cube', label: 'Cube' }
];

const INDICATOR_OPTIONS = [
  { value: 'dots', label: 'Dots' },
  { value: 'bars', label: 'Bars' },
  { value: 'counter', label: 'Counter' },
  { value: 'none', label: 'None' }
];

const propData = [
  {
    name: 'items',
    type: 'Array<CarouselItem | string | ReactNode>',
    default: 'DEFAULT_ITEMS',
    description:
      'Cards to show. Objects with image, icon, title, description and alt get the built-in card, strings are used as image URLs and React elements are rendered as they are.'
  },
  {
    name: 'baseWidth',
    type: 'number | string',
    default: '300',
    description: 'Width of the carousel in px, or any CSS width. It never grows past its container.'
  },
  { name: 'aspectRatio', type: 'number', default: '1.25', description: 'Width of a card divided by its height.' },
  {
    name: 'peek',
    type: 'number',
    default: '0',
    description: 'Space on each side of the active card where the neighbours show, in px. Works with slide and scale.'
  },
  { name: 'gap', type: 'number', default: '16', description: 'Space between the cards in px.' },
  { name: 'radius', type: 'number', default: '12', description: 'Corner radius of the cards in px.' },
  {
    name: 'frame',
    type: 'boolean',
    default: 'true',
    description:
      'Holds the cards and controls in a panel that masks the cards as they slide out. Without it the cards fade out at the edges.'
  },
  {
    name: 'effect',
    type: "'tilt' | 'slide' | 'scale' | 'fade' | 'cube'",
    default: "'tilt'",
    description: 'How the cards move from one to the next.'
  },
  {
    name: 'indicator',
    type: "'dots' | 'bars' | 'counter' | 'none'",
    default: "'dots'",
    description: 'Navigation under the cards. Bars fill up with the autoplay timer.'
  },
  { name: 'arrows', type: 'boolean', default: 'false', description: 'Shows previous and next buttons.' },
  { name: 'autoplay', type: 'boolean', default: 'false', description: 'Moves to the next card on a timer.' },
  {
    name: 'autoplayDelay',
    type: 'number',
    default: '3000',
    description: 'Time on each card in ms while autoplay is on.'
  },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'false',
    description: 'Pauses autoplay while the pointer is over the carousel.'
  },
  {
    name: 'loop',
    type: 'boolean',
    default: 'false',
    description: 'Wraps around from the last card to the first and back.'
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'true',
    description: 'Lets people drag, swipe or scroll sideways through the cards.'
  },
  { name: 'round', type: 'boolean', default: 'false', description: 'Turns the cards into circles.' },
  { name: 'initialIndex', type: 'number', default: '0', description: 'Card shown first.' },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Color scheme of the cards, frame and controls.'
  },
  {
    name: 'onChange',
    type: '(index: number) => void',
    default: '-',
    description: 'Called with the index of the new card whenever it changes.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the carousel.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the carousel.' }
];

const CarouselDemo = () => {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const items = preset === 'highlights' ? PHOTOS : preset === 'stories' ? STORIES : undefined;

  const computedProps = useMemo(() => (theme === 'light' ? { theme: 'light' } : {}), [theme]);

  const applyPreset = value => {
    updateProps({ ...DEFAULT_PROPS, ...PRESETS[value], preset: value });
  };

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
          <Box position="relative" className="demo-container" h={560} p={0} overflow="hidden">
            <Carousel key={preset} {...settings} {...(items ? { items } : {})} theme={theme} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={props.effect}
              onChange={value => updateProp('effect', value)}
            />
            <PreviewSelect
              title="Indicator"
              options={INDICATOR_OPTIONS}
              value={props.indicator}
              onChange={value => updateProp('indicator', value)}
            />
            <PreviewSlider
              title="Width"
              min={240}
              max={720}
              step={10}
              value={props.baseWidth}
              valueUnit="px"
              onChange={value => updateProp('baseWidth', value)}
            />
            <PreviewSlider
              title="Aspect Ratio"
              min={0.5}
              max={2}
              step={0.05}
              value={props.aspectRatio}
              onChange={value => updateProp('aspectRatio', value)}
            />
            <PreviewSlider
              title="Peek"
              min={0}
              max={120}
              step={4}
              value={props.peek}
              valueUnit="px"
              onChange={value => updateProp('peek', value)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={48}
              step={2}
              value={props.gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={32}
              step={1}
              value={props.radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSlider
              title="Delay"
              min={1000}
              max={8000}
              step={250}
              value={props.autoplayDelay}
              valueUnit="ms"
              isDisabled={!props.autoplay}
              onChange={value => updateProp('autoplayDelay', value)}
            />
            <PreviewSwitch title="Frame" isChecked={props.frame} onChange={value => updateProp('frame', value)} />
            <PreviewSwitch title="Arrows" isChecked={props.arrows} onChange={value => updateProp('arrows', value)} />
            <PreviewSwitch title="Loop" isChecked={props.loop} onChange={value => updateProp('loop', value)} />
            <PreviewSwitch
              title="Autoplay"
              isChecked={props.autoplay}
              onChange={value => updateProp('autoplay', value)}
            />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={props.pauseOnHover}
              isDisabled={!props.autoplay}
              onChange={value => updateProp('pauseOnHover', value)}
            />
            <PreviewSwitch
              title="Draggable"
              isChecked={props.draggable}
              onChange={value => updateProp('draggable', value)}
            />
            <PreviewSwitch title="Round" isChecked={props.round} onChange={value => updateProp('round', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={carousel} componentName="Carousel" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CarouselDemo;
