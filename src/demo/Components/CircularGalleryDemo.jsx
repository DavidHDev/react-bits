import { Box } from '@chakra-ui/react';
import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import { circularGallery } from '../../constants/code/Components/circularGalleryCode';
import CircularGallery from '../../content/Components/CircularGallery/CircularGallery';

const ITEMS = [
  { image: '/assets/demo/day-portrait.webp', text: 'Pier' },
  { image: '/assets/demo/night-landscape.webp', text: 'Night Field' },
  { image: '/assets/demo/day-sky.webp', text: 'Daybreak' },
  {
    image: 'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=1200&q=80&auto=format&fit=crop',
    text: 'Clouds'
  },
  { image: '/assets/demo/night-portrait.webp', text: 'Night Pier' },
  { image: '/assets/demo/day-landscape.webp', text: 'Meadow' },
  { image: '/assets/demo/night-sky.webp', text: 'Afterglow' }
];

const FONT_OPTIONS = [
  { label: 'Figtree', value: '' },
  {
    label: 'Playfair Display',
    value: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap'
  },
  { label: 'Orbitron', value: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap' },
  { label: 'Pacifico', value: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap' },
  { label: 'Bungee', value: 'https://fonts.googleapis.com/css2?family=Bungee&display=swap' },
  { label: 'Roboto Mono', value: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&display=swap' }
];

const LOOK = {
  bend: 3,
  itemSize: 1,
  itemAspect: 0.78,
  gap: 0.26,
  borderRadius: 0.05,
  wave: 1,
  fadeEdges: 0.12,
  shadow: 0.25,
  scrollSpeed: 2,
  scrollEase: 0.05,
  autoScroll: 0,
  snap: true,
  grayscale: false,
  typeface: ''
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  textColor: '',
  showTitles: true,
  openOnClick: true,
  intro: true
};

const PRESETS = {
  classic: { ...LOOK },
  film: { ...LOOK, bend: 1, itemSize: 0.8, itemAspect: 1.5, gap: 0.08, borderRadius: 0.02 },
  bowl: { ...LOOK, bend: -3, itemSize: 0.85, gap: 0.2 },
  flat: { ...LOOK, bend: 0, wave: 0, gap: 0.16, fadeEdges: 0.2 },
  editorial: {
    ...LOOK,
    grayscale: true,
    borderRadius: 0,
    shadow: 0,
    gap: 0.4,
    typeface: FONT_OPTIONS[1].value
  },
  drift: { ...LOOK, autoScroll: 1, snap: false, fadeEdges: 0.3, bend: 2 },
  circles: { ...LOOK, itemSize: 0.62, itemAspect: 1, borderRadius: 0.5, gap: 0.3, bend: 2 }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'film', label: 'Film' },
  { value: 'bowl', label: 'Bowl' },
  { value: 'flat', label: 'Flat' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'drift', label: 'Drift' },
  { value: 'circles', label: 'Circles' }
];

const propData = [
  {
    name: 'items',
    type: 'Array<{ image: string; text?: string; description?: string; alt?: string }>',
    default: '12 sample photos',
    description:
      'Images to show. `text` is the title under each card, `description` appears under the title when a card is open and `alt` names the image for screen readers.'
  },
  {
    name: 'bend',
    type: 'number',
    default: '3',
    description:
      'Curvature of the arc. Positive values arch the cards down at the edges, negative values lift them, 0 lays them flat.'
  },
  {
    name: 'itemSize',
    type: 'number',
    default: '1',
    description: 'Card height relative to the container, from 0.2 to 2.'
  },
  {
    name: 'itemAspect',
    type: 'number',
    default: '0.78',
    description: 'Card width divided by height. Images are cropped to fill the card.'
  },
  { name: 'gap', type: 'number', default: '0.26', description: 'Space between cards as a fraction of the card width.' },
  {
    name: 'borderRadius',
    type: 'number',
    default: '0.05',
    description: 'Corner radius as a fraction of the card size, from 0 (square) to 0.5 (fully round).'
  },
  {
    name: 'wave',
    type: 'number',
    default: '1',
    description: 'How much the cards ripple while the gallery moves. 0 keeps them flat.'
  },
  {
    name: 'fadeEdges',
    type: 'number',
    default: '0.12',
    description: 'Fades the cards out toward the left and right edges, from 0 to 0.5 of the width.'
  },
  { name: 'shadow', type: 'number', default: '0.25', description: 'Strength of the soft shadow under each card.' },
  {
    name: 'textColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the titles, the keyboard focus ring and the placeholder shown while images load.'
  },
  {
    name: 'font',
    type: 'string',
    default: "'bold 30px Figtree'",
    description:
      'CSS font shorthand for the titles. The size scales with the cards, so 30px means the default size and larger values make the titles bigger.'
  },
  {
    name: 'fontUrl',
    type: 'string',
    default: 'undefined',
    description:
      'Font to load for the titles. Accepts a stylesheet URL (e.g. a Google Fonts link) or a font file (.woff2, .woff, .ttf, .otf). The loaded family replaces the family in `font`.'
  },
  {
    name: 'showTitles',
    type: 'boolean',
    default: 'true',
    description: 'Shows the title of each card underneath it.'
  },
  {
    name: 'scrollSpeed',
    type: 'number',
    default: '2',
    description: 'How far the gallery travels per drag or wheel movement.'
  },
  {
    name: 'scrollEase',
    type: 'number',
    default: '0.05',
    description: 'How quickly the gallery catches up with the input, from 0.001 (floaty) to 1 (instant).'
  },
  {
    name: 'snap',
    type: 'boolean',
    default: 'true',
    description: 'Settles on the nearest card after dragging or scrolling.'
  },
  {
    name: 'autoScroll',
    type: 'number',
    default: '0',
    description:
      'Speed of an automatic drift, where 1 moves about one card every four seconds and negative values drift the other way. It pauses on hover, while dragging, while a card is open and briefly after any input.'
  },
  {
    name: 'grayscale',
    type: 'boolean',
    default: 'false',
    description: 'Shows the images in grayscale and brings the color back on hover, focus or when opened.'
  },
  {
    name: 'openOnClick',
    type: 'boolean',
    default: 'true',
    description:
      'Clicking a card opens it to its full image. Click it again, click outside it, press Escape or use the close button to return. When off, clicking a card centers it.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Glides the cards in when the gallery mounts.'
  },
  {
    name: 'onItemClick',
    type: '(item, index) => void',
    default: '-',
    description: 'Called when a card is clicked.'
  },
  {
    name: 'onActiveChange',
    type: '(index) => void',
    default: '-',
    description: 'Called when a different card becomes the centered one.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const CircularGalleryDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const themeText = useColorModeValue('#71717a', '#ffffff');
  const textColor = settings.textColor || themeText;
  const { typeface, ...galleryProps } = settings;
  const fontUrl = typeface || undefined;

  const computedProps = useMemo(() => ({ textColor, ...(fontUrl ? { fontUrl } : {}) }), [textColor, fontUrl]);

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'typeface']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <CircularGallery key={key} items={ITEMS} {...galleryProps} textColor={textColor} fontUrl={fontUrl} />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Font"
              options={FONT_OPTIONS}
              value={typeface}
              onChange={value => updateProp('typeface', value)}
            />
            <PreviewColorPickerCustom
              title="Text Color"
              color={textColor}
              onChange={value => updateProp('textColor', value)}
            />
            <PreviewSlider
              title="Bend"
              min={-10}
              max={10}
              step={0.5}
              value={settings.bend}
              onChange={value => updateProp('bend', value)}
            />
            <PreviewSlider
              title="Item Size"
              min={0.4}
              max={1.4}
              step={0.02}
              value={settings.itemSize}
              onChange={value => updateProp('itemSize', value)}
            />
            <PreviewSlider
              title="Item Aspect"
              min={0.5}
              max={2}
              step={0.02}
              value={settings.itemAspect}
              onChange={value => updateProp('itemAspect', value)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={1}
              step={0.02}
              value={settings.gap}
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Border Radius"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.borderRadius}
              onChange={value => updateProp('borderRadius', value)}
            />
            <PreviewSlider
              title="Wave"
              min={0}
              max={3}
              step={0.05}
              value={settings.wave}
              onChange={value => updateProp('wave', value)}
            />
            <PreviewSlider
              title="Edge Fade"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.fadeEdges}
              onChange={value => updateProp('fadeEdges', value)}
            />
            <PreviewSlider
              title="Shadow"
              min={0}
              max={1}
              step={0.01}
              value={settings.shadow}
              onChange={value => updateProp('shadow', value)}
            />
            <PreviewSlider
              title="Scroll Speed"
              min={0.5}
              max={5}
              step={0.1}
              value={settings.scrollSpeed}
              onChange={value => updateProp('scrollSpeed', value)}
            />
            <PreviewSlider
              title="Scroll Ease"
              min={0.01}
              max={0.3}
              step={0.01}
              value={settings.scrollEase}
              onChange={value => updateProp('scrollEase', value)}
            />
            <PreviewSlider
              title="Auto Scroll"
              min={-3}
              max={3}
              step={0.1}
              value={settings.autoScroll}
              onChange={value => updateProp('autoScroll', value)}
            />
            <PreviewSwitch title="Snap" isChecked={settings.snap} onChange={value => updateProp('snap', value)} />
            <PreviewSwitch
              title="Grayscale"
              isChecked={settings.grayscale}
              onChange={value => updateProp('grayscale', value)}
            />
            <PreviewSwitch
              title="Show Titles"
              isChecked={settings.showTitles}
              onChange={value => updateProp('showTitles', value)}
            />
            <PreviewSwitch
              title="Open On Click"
              isChecked={settings.openOnClick}
              onChange={value => updateProp('openOnClick', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={circularGallery} componentName="CircularGallery" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CircularGalleryDemo;
