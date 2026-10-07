import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import Dependencies from '../../components/code/Dependencies';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { useColorModeValue } from '../../components/setup/color-mode';

import CircularCarousel from '../../content/Components/CircularCarousel/CircularCarousel';
import { circularCarousel } from '../../constants/code/Components/circularCarouselCode';

const PRESETS = {
  cylinder: { tilt: -5, curve: 1, perspective: 2500, aspectRatio: 1 },
  orbit: { tilt: -16, curve: 0, perspective: 1500, aspectRatio: 0.75 },
  wheel: { tilt: 0, curve: 0, perspective: 1800, aspectRatio: 1.333 },
  panorama: { tilt: 0, curve: 1, perspective: 1800, aspectRatio: 0.75 }
};

const PRESET_OPTIONS = [
  { label: 'Cylinder', value: 'cylinder' },
  { label: 'Orbit', value: 'orbit' },
  { label: 'Wheel', value: 'wheel' },
  { label: 'Panorama', value: 'panorama' }
];

const INTRO_OPTIONS = [
  { label: 'Assemble', value: 'assemble' },
  { label: 'Rise', value: 'rise' },
  { label: 'Spin', value: 'spin' },
  { label: 'None', value: 'none' }
];

const ASPECT_OPTIONS = [
  { label: 'Portrait', value: 0.75 },
  { label: 'Square', value: 1 },
  { label: 'Landscape', value: 1.333 },
  { label: 'Tall', value: 0.5625 }
];

const AUTOPLAY_OPTIONS = [
  { label: 'Drift', value: 'drift' },
  { label: 'Step', value: 'step' },
  { label: 'Off', value: 'off' }
];

const DIRECTION_OPTIONS = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' }
];

const DEFAULT_FADE = '#000000';

const DEFAULT_PROPS = {
  preset: 'cylinder',
  intro: 'rise',
  cardWidth: 220,
  gap: 25,
  ...PRESETS.cylinder,
  autoplay: 'drift',
  speed: 14,
  interval: 3,
  direction: 'left',
  momentum: 0.6,
  snap: true,
  pauseOnHover: true,
  focusOnClick: true,
  draggable: true,
  parallax: 0.3,
  stretch: 0.5,
  fadeColor: DEFAULT_FADE,
  depthFade: 0.55,
  innerShade: 0.6,
  cornerRadius: 12,
  captions: false
};

const CircularCarouselDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    preset,
    intro,
    aspectRatio,
    cardWidth,
    gap,
    tilt,
    curve,
    perspective,
    autoplay,
    speed,
    interval,
    direction,
    momentum,
    snap,
    pauseOnHover,
    focusOnClick,
    draggable,
    parallax,
    stretch,
    fadeColor,
    depthFade,
    innerShade,
    cornerRadius,
    captions
  } = props;

  const renderedFade = useColorModeValue(
    fadeColor === DEFAULT_FADE ? '#ffffff' : fadeColor,
    fadeColor === DEFAULT_FADE ? '#120f17' : fadeColor
  );

  const choosePreset = value => {
    updateProps({ preset: value, ...(PRESETS[value] || PRESETS.cylinder) });
    forceRerender();
  };

  const chooseIntro = value => {
    updateProp('intro', value);
    forceRerender();
  };

  const propData = useMemo(
    () => [
      {
        name: 'items',
        type: 'Array<{ src: string; alt?: string; title?: string; subtitle?: string }>',
        default: '10 sample photos',
        description:
          'Images placed around the ring. The alt text is announced to screen readers, the title and optional subtitle are shown by captions. Passing a new list of the same length crossfades each card to its new image.'
      },
      {
        name: 'preset',
        type: "'cylinder' | 'orbit' | 'wheel' | 'panorama'",
        default: "'cylinder'",
        description:
          'Shape of the ring. Cylinder faces the cards outward, orbit keeps every card turned toward you, wheel spins top to bottom, and panorama puts the camera inside the ring.'
      },
      {
        name: 'intro',
        type: "'assemble' | 'rise' | 'spin' | 'none'",
        default: "'rise'",
        description:
          'Entrance once the images load. Assemble glides the cards in from a wider ring, rise slides them in one by one from the edge of the frame, and spin lands a fast turn.'
      },
      {
        name: 'cardWidth',
        type: 'number',
        default: '220',
        description: 'Card width in px. The whole ring scales down to fit its container when it needs to.'
      },
      {
        name: 'aspectRatio',
        type: 'number',
        default: '1',
        description: 'Card width divided by its height. Images are cropped to fill the card.'
      },
      { name: 'gap', type: 'number', default: '25', description: 'Space between neighbouring cards, in px.' },
      {
        name: 'curve',
        type: 'number',
        default: 'from preset',
        description:
          'How far the cards bend to follow the ring, from flat at 0 to fully wrapped at 1. Ignored by orbit.'
      },
      {
        name: 'tilt',
        type: 'number',
        default: 'from preset',
        description: 'Camera angle in degrees. Negative values look down onto the ring.'
      },
      {
        name: 'perspective',
        type: 'number',
        default: 'from preset',
        description:
          'Camera distance in px. Lower values exaggerate depth. Panorama sets its own, since the camera sits at the centre.'
      },
      {
        name: 'autoplay',
        type: "'drift' | 'step' | 'off'",
        default: "'drift'",
        description:
          'Drift turns the ring continuously, step moves one card at a time and settles on it, off only moves when you do.'
      },
      { name: 'speed', type: 'number', default: '14', description: 'Drift speed in degrees per second.' },
      { name: 'interval', type: 'number', default: '3', description: 'Seconds between moves in step mode.' },
      {
        name: 'direction',
        type: "'left' | 'right'",
        default: "'left'",
        description:
          'Which way the front cards travel. A flick changes it to the way you threw the ring. On the wheel, left means up.'
      },
      {
        name: 'draggable',
        type: 'boolean',
        default: 'true',
        description: 'Lets you grab and throw the ring with a mouse, finger or horizontal trackpad scroll.'
      },
      {
        name: 'momentum',
        type: 'number',
        default: '0.6',
        description: 'How long a throw keeps gliding before it blends back into the autoplay speed, from 0 to 1.'
      },
      {
        name: 'snap',
        type: 'boolean',
        default: 'true',
        description: 'Settles on a card whenever the ring comes to rest.'
      },
      {
        name: 'pauseOnHover',
        type: 'boolean',
        default: 'true',
        description: 'Eases the ring to a stop while the pointer is over it.'
      },
      {
        name: 'focusOnClick',
        type: 'boolean',
        default: 'true',
        description: 'Clicking a card turns it to the front.'
      },
      {
        name: 'parallax',
        type: 'number',
        default: '0.3',
        description: 'How much the camera leans toward the pointer, from 0 to 1.'
      },
      {
        name: 'stretch',
        type: 'number',
        default: '0.5',
        description: 'How much the ring swells outward when it spins fast, from 0 to 1.'
      },
      {
        name: 'depthFade',
        type: 'number',
        default: '0.55',
        description: 'How strongly cards fade into fadeColor as they turn away, from 0 to 1.'
      },
      {
        name: 'fadeColor',
        type: 'string',
        default: "'#000000'",
        description: 'Color distant cards fade toward. Match it to the background behind the carousel.'
      },
      {
        name: 'innerShade',
        type: 'number',
        default: '0.6',
        description: 'Brightness of the inside faces seen through the back of the ring, from 0 to 1.'
      },
      { name: 'cornerRadius', type: 'number', default: '12', description: 'Corner radius of the cards, in px.' },
      {
        name: 'captions',
        type: 'boolean',
        default: 'false',
        description: 'Shows the front card title, subtitle and position under the ring.'
      },
      {
        name: 'onChange',
        type: '(index: number) => void',
        default: '-',
        description: 'Called when a different card reaches the front.'
      },
      {
        name: 'onItemClick',
        type: '(item, index: number) => void',
        default: '-',
        description: 'Called when a card is clicked, or when Enter is pressed on the carousel.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Extra classes on the container.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles on the container.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={560} p={0} overflow="hidden">
            <CircularCarousel
              key={key}
              preset={preset}
              intro={intro}
              aspectRatio={aspectRatio}
              cardWidth={cardWidth}
              gap={gap}
              tilt={tilt}
              curve={curve}
              perspective={perspective}
              autoplay={autoplay}
              speed={speed}
              interval={interval}
              direction={direction}
              momentum={momentum}
              snap={snap}
              pauseOnHover={pauseOnHover}
              focusOnClick={focusOnClick}
              draggable={draggable}
              parallax={parallax}
              stretch={stretch}
              fadeColor={renderedFade}
              depthFade={depthFade}
              innerShade={innerShade}
              cornerRadius={cornerRadius}
              captions={captions}
            />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={choosePreset} />
            <PreviewSelect title="Intro" options={INTRO_OPTIONS} value={intro} onChange={chooseIntro} />
            <PreviewSelect
              title="Aspect"
              options={ASPECT_OPTIONS}
              value={aspectRatio}
              onChange={v => updateProp('aspectRatio', v)}
            />
            <PreviewSlider
              title="Card Width"
              min={140}
              max={320}
              step={2}
              value={cardWidth}
              valueUnit="px"
              onChange={v => updateProp('cardWidth', v)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={96}
              step={1}
              value={gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />
            <PreviewSlider
              title="Curve"
              min={0}
              max={1}
              step={0.01}
              value={curve}
              isDisabled={preset === 'orbit'}
              onChange={v => updateProp('curve', v)}
            />
            <PreviewSlider
              title="Tilt"
              min={-40}
              max={40}
              step={1}
              value={tilt}
              valueUnit="°"
              onChange={v => updateProp('tilt', v)}
            />
            <PreviewSlider
              title="Perspective"
              min={600}
              max={3200}
              step={20}
              value={perspective}
              valueUnit="px"
              isDisabled={preset === 'panorama'}
              onChange={v => updateProp('perspective', v)}
            />

            <PreviewSelect
              title="Autoplay"
              options={AUTOPLAY_OPTIONS}
              value={autoplay}
              onChange={v => updateProp('autoplay', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={60}
              step={1}
              value={speed}
              valueUnit="°/s"
              isDisabled={autoplay !== 'drift'}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSlider
              title="Interval"
              min={1}
              max={8}
              step={0.5}
              value={interval}
              valueUnit="s"
              isDisabled={autoplay !== 'step'}
              onChange={v => updateProp('interval', v)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={direction}
              onChange={v => updateProp('direction', v)}
            />
            <PreviewSlider
              title="Momentum"
              min={0}
              max={1}
              step={0.01}
              value={momentum}
              onChange={v => updateProp('momentum', v)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={1}
              step={0.01}
              value={parallax}
              onChange={v => updateProp('parallax', v)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={1}
              step={0.01}
              value={stretch}
              onChange={v => updateProp('stretch', v)}
            />
            <PreviewSwitch title="Snap" isChecked={snap} onChange={v => updateProp('snap', v)} />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={pauseOnHover}
              onChange={v => updateProp('pauseOnHover', v)}
            />
            <PreviewSwitch
              title="Focus On Click"
              isChecked={focusOnClick}
              onChange={v => updateProp('focusOnClick', v)}
            />
            <PreviewSwitch title="Draggable" isChecked={draggable} onChange={v => updateProp('draggable', v)} />

            <PreviewColorPickerCustom
              title="Fade Color"
              color={renderedFade}
              onChange={v => updateProp('fadeColor', v)}
            />
            <PreviewSlider
              title="Depth Fade"
              min={0}
              max={1}
              step={0.01}
              value={depthFade}
              onChange={v => updateProp('depthFade', v)}
            />
            <PreviewSlider
              title="Inner Shade"
              min={0}
              max={1}
              step={0.01}
              value={innerShade}
              onChange={v => updateProp('innerShade', v)}
            />
            <PreviewSlider
              title="Corner Radius"
              min={0}
              max={40}
              step={1}
              value={cornerRadius}
              valueUnit="px"
              onChange={v => updateProp('cornerRadius', v)}
            />
            <PreviewSwitch title="Captions" isChecked={captions} onChange={v => updateProp('captions', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={circularCarousel} componentName="CircularCarousel" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CircularCarouselDemo;
