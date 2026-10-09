import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import InfiniteMenu from '../../content/Components/InfiniteMenu/InfiniteMenu';
import { infiniteMenu } from '../../constants/code/Components/infiniteMenuCode';

const ITEMS = [
  {
    image: '/assets/demo/day-portrait.webp',
    link: 'https://reactbits.dev',
    title: 'The Pier',
    description: 'Concrete and open water under a bright morning sky.'
  },
  {
    image: '/assets/demo/night-landscape.webp',
    link: 'https://reactbits.dev',
    title: 'Moonlit Field',
    description: 'A single pole in a field of rapeseed under the full moon.'
  },
  {
    image: 'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=600&q=80&auto=format&fit=crop',
    link: 'https://reactbits.dev',
    title: 'Afterglow',
    description: 'Clouds catching the last light of the day.'
  },
  {
    image: '/assets/demo/day-landscape.webp',
    link: 'https://reactbits.dev',
    title: 'Rapeseed',
    description: 'The same field at noon, yellow all the way to the horizon.'
  },
  {
    image: '/assets/demo/night-portrait.webp',
    link: 'https://reactbits.dev',
    title: 'Blue Hour',
    description: 'The pier lit from below as the sky turns pink.'
  }
];

const DEFAULT_PROPS = {
  preset: 'gallery',
  count: 160,
  tileSize: 0.63,
  roundness: 0.2,
  zoom: 1.65,
  pullBack: 1,
  stretch: 0.6,
  inertia: 0.6,
  autoplay: 3,
  grayscale: true,
  dim: 0.5,
  accentColor: '',
  intro: true,
  showInfo: true
};

const PRESETS = {
  gallery: {},
  orbit: { count: 42, tileSize: 0.85, roundness: 1, zoom: 1, stretch: 1, autoplay: 0, grayscale: false }
};

const PRESET_OPTIONS = [
  { value: 'gallery', label: 'Gallery' },
  { value: 'orbit', label: 'Orbit' }
];

const propData = [
  {
    name: 'items',
    type: 'Array<{ image: string; title?: string; description?: string; link?: string }>',
    default: '[]',
    description: 'Items to show. They repeat around the sphere when there are fewer items than tiles.'
  },
  { name: 'count', type: 'number', default: '160', description: 'Number of tiles on the sphere.' },
  {
    name: 'tileSize',
    type: 'number',
    default: '0.63',
    description: 'Tile size relative to the space around it. Lower values leave wider gaps.'
  },
  {
    name: 'roundness',
    type: 'number',
    default: '0.2',
    description: 'Tile shape, from 0 for squares to 1 for circles.'
  },
  {
    name: 'zoom',
    type: 'number',
    default: '1.65',
    description: 'How close the camera sits to the active tile when the sphere is at rest.'
  },
  {
    name: 'pullBack',
    type: 'number',
    default: '1',
    description: 'How far the camera pulls back while you drag. 0 keeps it still.'
  },
  { name: 'stretch', type: 'number', default: '0.6', description: 'How much the tiles stretch with fast motion.' },
  {
    name: 'inertia',
    type: 'number',
    default: '0.6',
    description: 'How long the sphere keeps spinning after you let go, from 0 to 1.'
  },
  {
    name: 'autoplay',
    type: 'number',
    default: '3',
    description: 'Seconds between automatic steps to the next tile. 0 turns it off. Pauses on hover and focus.'
  },
  {
    name: 'grayscale',
    type: 'boolean',
    default: 'true',
    description: 'Shows every tile except the active one in grayscale.'
  },
  {
    name: 'dim',
    type: 'number',
    default: '0.5',
    description:
      'Fades the tiles around the active one toward the background once the sphere settles, which keeps the text readable. From 0 to 1.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Spins the sphere into place when it loads.' },
  {
    name: 'showInfo',
    type: 'boolean',
    default: 'true',
    description: 'Shows the title, description and link button of the active item.'
  },
  {
    name: 'renderInfo',
    type: '(item, index, moving) => ReactNode',
    default: '-',
    description: 'Replaces the default title, description and button with your own overlay.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Colors of the text, the button and the placeholder tiles.'
  },
  { name: 'accentColor', type: 'string', default: '-', description: 'Background of the link button.' },
  {
    name: 'backgroundColor',
    type: 'string',
    default: '-',
    description: 'Background behind the sphere. Transparent by default.'
  },
  {
    name: 'onActiveChange',
    type: '(item, index) => void',
    default: '-',
    description: 'Called when a new item settles in front.'
  },
  {
    name: 'onItemClick',
    type: '(item, index) => void',
    default: '-',
    description: 'Called when the active tile or its button is clicked, or Enter is pressed.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const InfiniteMenuDemo = () => {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = useColorModeValue('#120f17', '#ffffff');
  const accentColor = props.accentColor || ink;
  const computedProps = useMemo(() => ({ accentColor, theme }), [accentColor, theme]);

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
            <InfiniteMenu {...settings} items={ITEMS} theme={theme} accentColor={accentColor} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSlider
              title="Tiles"
              min={12}
              max={160}
              step={1}
              value={props.count}
              onChange={value => updateProp('count', value)}
            />
            <PreviewSlider
              title="Tile Size"
              min={0.4}
              max={1.1}
              step={0.01}
              value={props.tileSize}
              onChange={value => updateProp('tileSize', value)}
            />
            <PreviewSlider
              title="Roundness"
              min={0}
              max={1}
              step={0.01}
              value={props.roundness}
              onChange={value => updateProp('roundness', value)}
            />
            <PreviewSlider
              title="Zoom"
              min={0.4}
              max={2.5}
              step={0.05}
              value={props.zoom}
              onChange={value => updateProp('zoom', value)}
            />
            <PreviewSlider
              title="Pull Back"
              min={0}
              max={2}
              step={0.05}
              value={props.pullBack}
              onChange={value => updateProp('pullBack', value)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={2.5}
              step={0.05}
              value={props.stretch}
              onChange={value => updateProp('stretch', value)}
            />
            <PreviewSlider
              title="Inertia"
              min={0}
              max={1}
              step={0.05}
              value={props.inertia}
              onChange={value => updateProp('inertia', value)}
            />
            <PreviewSlider
              title="Autoplay"
              min={0}
              max={8}
              step={0.5}
              value={props.autoplay}
              valueUnit="s"
              onChange={value => updateProp('autoplay', value)}
            />
            <PreviewSlider
              title="Dim"
              min={0}
              max={1}
              step={0.05}
              value={props.dim}
              onChange={value => updateProp('dim', value)}
            />
            <PreviewColorPickerCustom
              title="Accent"
              color={accentColor}
              onChange={value => updateProp('accentColor', value)}
            />
            <PreviewSwitch
              title="Grayscale"
              isChecked={props.grayscale}
              onChange={value => updateProp('grayscale', value)}
            />
            <PreviewSwitch title="Info" isChecked={props.showInfo} onChange={value => updateProp('showInfo', value)} />
            <PreviewSwitch title="Intro" isChecked={props.intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={infiniteMenu} componentName="InfiniteMenu" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default InfiniteMenuDemo;
