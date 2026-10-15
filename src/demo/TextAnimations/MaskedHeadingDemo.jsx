import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';

import MaskedHeading from '../../content/TextAnimations/MaskedHeading/MaskedHeading';
import { maskedHeading } from '../../constants/code/TextAnimations/maskedHeadingCode';

const DEMO_IMAGE = 'https://images.unsplash.com/photo-1500673587002-1d2548cfba1b?q=80&w=1600&auto=format&fit=crop';
const DEMO_VIDEO = '/assets/video/masked-heading.mp4';

const LOOK = {
  tinted: false,
  tintColor: '#ff5a36',
  outlineColor: '',
  text: 'Designed in the details',
  mediaType: 'video',
  reveal: 'scale',
  duration: 1.1,
  stagger: 0.09,
  parallax: 26,
  drift: 18,
  hoverZoom: 0,
  spotlight: false,
  spotlightRadius: 180,
  align: 'center',
  fillScale: 1.25,
  brightness: 1,
  saturation: 1,
  grayscale: false,
  outline: false,
  outlineWidth: 1,
  weight: 700,
  tracking: -0.03,
  lineHeight: 1.06,
  textScale: 0.115
};

const PRESETS = {
  cinema: { ...LOOK },
  spotlight: {
    ...LOOK,
    text: 'Shot on location',
    mediaType: 'image',
    reveal: 'rise',
    drift: 10,
    hoverZoom: 0.06,
    spotlight: true,
    spotlightRadius: 200,
    saturation: 1.15,
    weight: 800,
    tracking: -0.04
  },
  stencil: {
    ...LOOK,
    text: 'Made for the web',
    mediaType: 'image',
    reveal: 'wipe',
    duration: 1.6,
    parallax: 60,
    align: 'left',
    fillScale: 1.5,
    brightness: 1.1,
    grayscale: true,
    outline: true,
    outlineWidth: 1.5,
    weight: 900,
    tracking: -0.05,
    lineHeight: 0.92,
    textScale: 0.14
  },
  duotone: {
    ...LOOK,
    tinted: true,
    reveal: 'blur',
    duration: 1.4,
    drift: 30,
    brightness: 1.1,
    tracking: -0.02
  }
};

const PRESET_OPTIONS = [
  { value: 'cinema', label: 'Cinema' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'stencil', label: 'Stencil' },
  { value: 'duotone', label: 'Duotone' }
];

const DEFAULT_PROPS = {
  preset: 'cinema',
  trigger: 'view',
  ...LOOK
};

const propData = [
  { name: 'text', type: 'string', default: "'Designed in the details'", description: 'Heading copy.' },
  {
    name: 'tag',
    type: 'string',
    default: "'h2'",
    description: 'Element the heading renders as, so it can carry the right semantics.'
  },
  {
    name: 'mediaType',
    type: '"image" | "video"',
    default: '"image"',
    description:
      'Whether the source showing through the letters is an image or a looping muted video. Videos stay paused for people who prefer reduced motion.'
  },
  { name: 'src', type: 'string', default: "''", description: 'Image or video URL.' },
  { name: 'poster', type: 'string', default: "''", description: 'Poster frame used while a video loads.' },
  {
    name: 'reveal',
    type: '"rise" | "scale" | "blur" | "wipe" | "fade" | "none"',
    default: '"rise"',
    description:
      'Entrance style: words rise into place, letters grow in one after another, the letters draw together while the heading pulls into focus, a wipe sweeps across, or the whole block fades up.'
  },
  {
    name: 'trigger',
    type: '"view" | "mount" | "hover"',
    default: '"view"',
    description: 'When the entrance runs.'
  },
  { name: 'duration', type: 'number', default: '1.1', description: 'Entrance duration, in seconds.' },
  {
    name: 'stagger',
    type: 'number',
    default: '0.09',
    description:
      'Delay between words, in seconds, for the rise reveal. The scale reveal steps letter by letter at about a third of it.'
  },
  {
    name: 'spotlight',
    type: 'boolean',
    default: 'false',
    description:
      'Dims and desaturates the media except for a soft pool of light that eases after the pointer. Without a pointer, the light wanders slowly across the letters.'
  },
  {
    name: 'spotlightRadius',
    type: 'number',
    default: '160',
    description: 'Radius of the spotlight, in px.'
  },
  {
    name: 'outline',
    type: 'boolean',
    default: 'false',
    description:
      'Draws a thin stroke around every letter. It is visible before the entrance, so the media fills the outlines as it arrives.'
  },
  {
    name: 'outlineColor',
    type: 'string',
    default: "''",
    description: 'Color of the outline. Leave empty to follow the surrounding text color.'
  },
  { name: 'outlineWidth', type: 'number', default: '1', description: 'Thickness of the outline, in px.' },
  {
    name: 'fillScale',
    type: 'number',
    default: '1.25',
    description: 'How far the media is zoomed past the heading. The overscan is what parallax travels into.'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '26',
    description: 'How far the media slides under the letters as the pointer moves, in px.'
  },
  {
    name: 'drift',
    type: 'number',
    default: '18',
    description: 'Amplitude of the slow idle motion, in px. 0 holds the media still.'
  },
  {
    name: 'hoverZoom',
    type: 'number',
    default: '0',
    description: 'Extra zoom the media eases into while the pointer is over the heading. 0.1 is 10% closer.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Brightness of the media.' },
  { name: 'saturation', type: 'number', default: '1', description: 'Saturation of the media.' },
  { name: 'grayscale', type: 'boolean', default: 'false', description: 'Render the media in black and white.' },
  {
    name: 'tint',
    type: 'string',
    default: "''",
    description:
      'Colorizes the media in one color while keeping its light and shadow, like a duotone print. Leave empty for the original colors.'
  },
  { name: 'align', type: '"left" | "center" | "right"', default: '"center"', description: 'Text alignment.' },
  { name: 'weight', type: 'number', default: '700', description: 'Font weight.' },
  { name: 'tracking', type: 'number', default: '-0.03', description: 'Letter spacing, in em.' },
  { name: 'lineHeight', type: 'number', default: '1.06', description: 'Line height.' },
  {
    name: 'textScale',
    type: 'number',
    default: '0.115',
    description: 'Type size as a fraction of the container width, so the heading stays responsive.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Additional class names.' },
  { name: 'style', type: 'object', default: '—', description: 'Inline styles for the heading.' }
];

const MaskedHeadingDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, tinted, tintColor, outlineColor, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(
    () => ({ ...(tinted ? { tint: tintColor } : {}), ...(outlineColor ? { outlineColor } : {}) }),
    [tinted, tintColor, outlineColor]
  );

  const replayKey = [
    preset,
    settings.text,
    settings.mediaType,
    settings.reveal,
    settings.trigger,
    settings.duration,
    settings.stagger
  ].join('-');

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'tinted', 'tintColor', 'outlineColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            className="demo-container"
            h={420}
            px={{ base: 5, md: 10 }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            <MaskedHeading
              key={replayKey}
              {...settings}
              tint={tinted ? tintColor : ''}
              outlineColor={outlineColor}
              src={settings.mediaType === 'video' ? DEMO_VIDEO : DEMO_IMAGE}
            />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Tint Color"
              color={tintColor}
              onChange={val => updateProps({ tintColor: val, tinted: true })}
            />
            <PreviewColorPickerCustom
              title="Outline Color"
              color={outlineColor || ink}
              onChange={val => updateProps({ outlineColor: val, outline: true })}
            />
            <PreviewSelect
              title="Reveal"
              options={[
                { label: 'Rise', value: 'rise' },
                { label: 'Scale', value: 'scale' },
                { label: 'Blur', value: 'blur' },
                { label: 'Wipe', value: 'wipe' },
                { label: 'Fade', value: 'fade' },
                { label: 'None', value: 'none' }
              ]}
              value={settings.reveal}
              onChange={val => updateProp('reveal', val)}
            />
            <PreviewSelect
              title="Trigger"
              options={[
                { label: 'In View', value: 'view' },
                { label: 'On Mount', value: 'mount' },
                { label: 'On Hover', value: 'hover' }
              ]}
              value={settings.trigger}
              onChange={val => updateProp('trigger', val)}
            />
            <PreviewSlider
              title="Duration"
              min={0.3}
              max={2.4}
              step={0.05}
              value={settings.duration}
              valueUnit="s"
              isDisabled={settings.reveal === 'none'}
              onChange={val => updateProp('duration', val)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.3}
              step={0.01}
              value={settings.stagger}
              valueUnit="s"
              isDisabled={!['rise', 'scale'].includes(settings.reveal)}
              onChange={val => updateProp('stagger', val)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={80}
              step={1}
              value={settings.parallax}
              valueUnit="px"
              onChange={val => updateProp('parallax', val)}
            />
            <PreviewSlider
              title="Drift"
              min={0}
              max={60}
              step={1}
              value={settings.drift}
              valueUnit="px"
              onChange={val => updateProp('drift', val)}
            />
            <PreviewSlider
              title="Hover Zoom"
              min={0}
              max={0.3}
              step={0.01}
              value={settings.hoverZoom}
              onChange={val => updateProp('hoverZoom', val)}
            />
            <PreviewSwitch
              title="Spotlight"
              isChecked={settings.spotlight}
              onChange={val => updateProp('spotlight', val)}
            />
            <PreviewSlider
              title="Spotlight Radius"
              min={60}
              max={400}
              step={10}
              value={settings.spotlightRadius}
              valueUnit="px"
              isDisabled={!settings.spotlight}
              onChange={val => updateProp('spotlightRadius', val)}
            />
            <PreviewSelect
              title="Text"
              options={[
                { label: 'Details', value: 'Designed in the details' },
                { label: 'Web', value: 'Made for the web' },
                { label: 'Location', value: 'Shot on location' }
              ]}
              value={settings.text}
              onChange={val => updateProp('text', val)}
            />
            <PreviewSelect
              title="Media"
              options={[
                { label: 'Video', value: 'video' },
                { label: 'Image', value: 'image' }
              ]}
              value={settings.mediaType}
              onChange={val => updateProp('mediaType', val)}
            />
            <PreviewSelect
              title="Align"
              options={[
                { label: 'Center', value: 'center' },
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' }
              ]}
              value={settings.align}
              onChange={val => updateProp('align', val)}
            />
            <PreviewSlider
              title="Fill Scale"
              min={1}
              max={2}
              step={0.05}
              value={settings.fillScale}
              onChange={val => updateProp('fillScale', val)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.4}
              max={2}
              step={0.05}
              value={settings.brightness}
              onChange={val => updateProp('brightness', val)}
            />
            <PreviewSlider
              title="Saturation"
              min={0}
              max={2}
              step={0.05}
              value={settings.saturation}
              onChange={val => updateProp('saturation', val)}
            />
            <PreviewSlider
              title="Text Size"
              min={0.05}
              max={0.15}
              step={0.005}
              value={settings.textScale}
              onChange={val => updateProp('textScale', val)}
            />
            <PreviewSlider
              title="Weight"
              min={300}
              max={900}
              step={100}
              value={settings.weight}
              onChange={val => updateProp('weight', val)}
            />
            <PreviewSlider
              title="Tracking"
              min={-0.08}
              max={0.06}
              step={0.005}
              value={settings.tracking}
              valueUnit="em"
              onChange={val => updateProp('tracking', val)}
            />
            <PreviewSlider
              title="Line Height"
              min={0.85}
              max={1.6}
              step={0.02}
              value={settings.lineHeight}
              onChange={val => updateProp('lineHeight', val)}
            />
            <PreviewSlider
              title="Outline Width"
              min={0.5}
              max={4}
              step={0.25}
              value={settings.outlineWidth}
              valueUnit="px"
              isDisabled={!settings.outline}
              onChange={val => updateProp('outlineWidth', val)}
            />
            <PreviewSwitch title="Tint" isChecked={tinted} onChange={val => updateProp('tinted', val)} />
            <PreviewSwitch
              title="Grayscale"
              isChecked={settings.grayscale}
              onChange={val => updateProp('grayscale', val)}
            />
            <PreviewSwitch title="Outline" isChecked={settings.outline} onChange={val => updateProp('outline', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={maskedHeading} componentName="MaskedHeading" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default MaskedHeadingDemo;
