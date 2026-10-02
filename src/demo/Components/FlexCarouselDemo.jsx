import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import Dependencies from '../../components/code/Dependencies';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';

import FlexCarousel from '../../content/Components/FlexCarousel/FlexCarousel';
import { flexCarousel } from '../../constants/code/Components/flexCarouselCode';

const PRESETS = {
  liquid: {
    lensWidth: 0.74,
    lensHeight: 1.18,
    tilt: 62,
    roundness: 1,
    bend: 0.34,
    reach: 0.38,
    curl: 'twist',
    dispersion: 0.45,
    liquid: 0,
    followCursor: false
  },
  ribbon: {
    lensWidth: 0.8,
    lensHeight: 0.8,
    tilt: 0,
    roundness: 1,
    bend: 0.34,
    reach: 0.34,
    curl: 'twist',
    dispersion: 0.4,
    liquid: 0,
    followCursor: false
  },
  vortex: {
    lensWidth: 0.7,
    lensHeight: 0.95,
    tilt: 30,
    roundness: 1,
    bend: 0.46,
    reach: 0.3,
    curl: 'twist',
    dispersion: 0.5,
    liquid: 0,
    followCursor: false
  },
  arch: {
    lensWidth: 0.8,
    lensHeight: 0.8,
    tilt: 0,
    roundness: 1,
    bend: 0.3,
    reach: 0.36,
    curl: 'rise',
    dispersion: 0.4,
    liquid: 0,
    followCursor: false
  }
};

const PRESET_OPTIONS = [
  { label: 'Liquid', value: 'liquid' },
  { label: 'Ribbon', value: 'ribbon' },
  { label: 'Vortex', value: 'vortex' },
  { label: 'Arch', value: 'arch' }
];

const INTRO_OPTIONS = [
  { label: 'Rise', value: 'rise' },
  { label: 'Bloom', value: 'bloom' },
  { label: 'Spin', value: 'spin' },
  { label: 'Deal', value: 'deal' },
  { label: 'None', value: 'none' }
];

const CURL_OPTIONS = [
  { label: 'Twist', value: 'twist' },
  { label: 'Rise', value: 'rise' },
  { label: 'Fall', value: 'fall' }
];

const FIT_OPTIONS = [
  { label: 'Natural', value: 'natural' },
  { label: 'Portrait', value: 'portrait' },
  { label: 'Square', value: 'square' },
  { label: 'Landscape', value: 'landscape' }
];

const DEFAULT_PROPS = {
  preset: 'liquid',
  intro: 'rise',
  fit: 'natural',
  cardHeight: 0.5,
  gap: 12,
  radius: 0,
  ...PRESETS.liquid,
  squeeze: 0.2,
  focusOnClick: true,
  autoplay: false,
  interval: 4,
  captions: true,
  captureWheel: true
};

const FlexCarouselDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    preset,
    intro,
    fit,
    cardHeight,
    gap,
    radius,
    lensWidth,
    lensHeight,
    tilt,
    roundness,
    bend,
    reach,
    curl,
    dispersion,
    liquid,
    followCursor,
    squeeze,
    focusOnClick,
    autoplay,
    interval,
    captions,
    captureWheel
  } = props;

  const choosePreset = value => {
    updateProps({ preset: value, ...(PRESETS[value] || PRESETS.liquid) });
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
        default: '12 sample photos',
        description:
          'Images shown in the row. Each keeps its natural aspect ratio unless fit is set. The alt text is announced to screen readers, the title and optional subtitle are shown above the row.'
      },
      {
        name: 'preset',
        type: "'liquid' | 'ribbon' | 'vortex' | 'arch'",
        default: "'liquid'",
        description:
          'A starting shape for the invisible glass. Every lens prop below overrides the preset value when you pass it.'
      },
      {
        name: 'intro',
        type: "'rise' | 'bloom' | 'spin' | 'deal' | 'none'",
        default: "'rise'",
        description:
          'Entrance once the images load. Rise lifts the cards in from below, bloom fades them in while the bend forms, spin lands a fast flick, deal spreads the cards from the middle. Any input skips it.'
      },
      {
        name: 'fit',
        type: "'natural' | 'portrait' | 'square' | 'landscape'",
        default: "'natural'",
        description: 'Card shape. Natural keeps each image uncropped, the others crop every card to the same shape.'
      },
      {
        name: 'cardHeight',
        type: 'number',
        default: '0.5',
        description: 'Card height as a fraction of the container height.'
      },
      { name: 'gap', type: 'number', default: '12', description: 'Space between cards, in px.' },
      { name: 'radius', type: 'number', default: '0', description: 'Corner radius of the cards, in px.' },
      {
        name: 'lensWidth',
        type: 'number',
        default: 'from preset',
        description: 'Width of the invisible glass as a fraction of the container width.'
      },
      {
        name: 'lensHeight',
        type: 'number',
        default: 'from preset',
        description:
          'Height of the invisible glass as a fraction of the container width, so the bend keeps its shape at any size.'
      },
      {
        name: 'tilt',
        type: 'number',
        default: 'from preset',
        description: 'Rotation of the glass in degrees. It decides where its edge crosses the row.'
      },
      {
        name: 'roundness',
        type: 'number',
        default: 'from preset',
        description: 'Shape of the glass, from a rounded rectangle at 0 to a perfect ellipse at 1.'
      },
      {
        name: 'bend',
        type: 'number',
        default: 'from preset',
        description:
          'How far the row flexes where it passes the edge of the glass. The glass itself is never drawn and the images always stay connected.'
      },
      {
        name: 'reach',
        type: 'number',
        default: 'from preset',
        description:
          'Width of the curved edge of the glass. Small values give a tight kink, large values a long smooth bend.'
      },
      {
        name: 'curl',
        type: "'twist' | 'rise' | 'fall'",
        default: 'from preset',
        description:
          'Which way the ends of the row flex. Twist sends the left end down and the right end up, rise lifts both, fall drops both.'
      },
      {
        name: 'dispersion',
        type: 'number',
        default: 'from preset',
        description: 'Rainbow splitting of light, only where the edge of the glass bends the images.'
      },
      {
        name: 'liquid',
        type: 'number',
        default: 'from preset',
        description: 'How much the glass stretches and wobbles like a liquid when the row moves. Off in every preset.'
      },
      {
        name: 'followCursor',
        type: 'boolean',
        default: 'from preset',
        description: 'Let the lens drift after the cursor like a loupe, and return to the center when it leaves.'
      },
      {
        name: 'squeeze',
        type: 'number',
        default: '0.2',
        description: 'How much the cards shrink while the row moves fast. 0 keeps them at full size.'
      },
      {
        name: 'focusOnClick',
        type: 'boolean',
        default: 'true',
        description:
          'Clicking a card centers it and opens it: the others part, the bend melts away and the card grows. Click, drag, scroll or Escape closes it.'
      },
      {
        name: 'autoplay',
        type: 'boolean',
        default: 'false',
        description:
          'Advance one card at a time. Pauses on hover, focus and interaction, and when reduced motion is on.'
      },
      { name: 'interval', type: 'number', default: '4', description: 'Seconds between autoplay steps.' },
      {
        name: 'captions',
        type: 'boolean',
        default: 'true',
        description: 'Show the title of the centered card above the row and a counter below it.'
      },
      {
        name: 'captureWheel',
        type: 'boolean',
        default: 'true',
        description:
          'Let a vertical mouse wheel scroll the carousel while hovering. Horizontal wheels and trackpads always scroll it.'
      },
      {
        name: 'onChange',
        type: '(index: number, item) => void',
        default: '-',
        description: 'Called whenever a different card reaches the center.'
      },
      {
        name: 'onSelect',
        type: '(index: number, item) => void',
        default: '-',
        description:
          'Called when the centered card is clicked or Enter is pressed. Clicking a side card centers it first.'
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
          <Box position="relative" className="demo-container" h={540} p={0} overflow="hidden">
            <FlexCarousel
              key={key}
              preset={preset}
              intro={intro}
              fit={fit}
              cardHeight={cardHeight}
              gap={gap}
              radius={radius}
              lensWidth={lensWidth}
              lensHeight={lensHeight}
              tilt={tilt}
              roundness={roundness}
              bend={bend}
              reach={reach}
              curl={curl}
              dispersion={dispersion}
              liquid={liquid}
              followCursor={followCursor}
              squeeze={squeeze}
              focusOnClick={focusOnClick}
              autoplay={autoplay}
              interval={interval}
              captions={captions}
              captureWheel={captureWheel}
            />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={choosePreset} />
            <PreviewSelect title="Intro" options={INTRO_OPTIONS} value={intro} onChange={chooseIntro} />
            <PreviewSelect title="Fit" options={FIT_OPTIONS} value={fit} onChange={v => updateProp('fit', v)} />

            <PreviewSlider
              title="Card Height"
              min={0.3}
              max={0.8}
              step={0.01}
              value={cardHeight}
              onChange={v => updateProp('cardHeight', v)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={64}
              step={1}
              value={gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={48}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />

            <PreviewSlider
              title="Lens Width"
              min={0.2}
              max={2}
              step={0.01}
              value={lensWidth}
              onChange={v => updateProp('lensWidth', v)}
            />
            <PreviewSlider
              title="Lens Height"
              min={0.2}
              max={2}
              step={0.01}
              value={lensHeight}
              onChange={v => updateProp('lensHeight', v)}
            />
            <PreviewSlider
              title="Tilt"
              min={-180}
              max={180}
              step={1}
              value={tilt}
              valueUnit="°"
              onChange={v => updateProp('tilt', v)}
            />
            <PreviewSlider
              title="Roundness"
              min={0}
              max={1}
              step={0.01}
              value={roundness}
              onChange={v => updateProp('roundness', v)}
            />

            <PreviewSlider
              title="Bend"
              min={0}
              max={1.2}
              step={0.01}
              value={bend}
              onChange={v => updateProp('bend', v)}
            />
            <PreviewSlider
              title="Reach"
              min={0.1}
              max={0.9}
              step={0.01}
              value={reach}
              onChange={v => updateProp('reach', v)}
            />
            <PreviewSelect title="Curl" options={CURL_OPTIONS} value={curl} onChange={v => updateProp('curl', v)} />
            <PreviewSlider
              title="Dispersion"
              min={0}
              max={2}
              step={0.01}
              value={dispersion}
              onChange={v => updateProp('dispersion', v)}
            />
            <PreviewSlider
              title="Liquid"
              min={0}
              max={1}
              step={0.01}
              value={liquid}
              onChange={v => updateProp('liquid', v)}
            />

            <PreviewSwitch
              title="Follow Cursor"
              isChecked={followCursor}
              onChange={v => updateProp('followCursor', v)}
            />
            <PreviewSlider
              title="Squeeze"
              min={0}
              max={0.4}
              step={0.01}
              value={squeeze}
              onChange={v => updateProp('squeeze', v)}
            />
            <PreviewSwitch
              title="Focus On Click"
              isChecked={focusOnClick}
              onChange={v => updateProp('focusOnClick', v)}
            />
            <PreviewSwitch title="Autoplay" isChecked={autoplay} onChange={v => updateProp('autoplay', v)} />
            <PreviewSlider
              title="Interval"
              min={1.5}
              max={10}
              step={0.5}
              value={interval}
              valueUnit="s"
              isDisabled={!autoplay}
              onChange={v => updateProp('interval', v)}
            />
            <PreviewSwitch title="Captions" isChecked={captions} onChange={v => updateProp('captions', v)} />
            <PreviewSwitch
              title="Capture Wheel"
              isChecked={captureWheel}
              onChange={v => updateProp('captureWheel', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={flexCarousel} componentName="FlexCarousel" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FlexCarouselDemo;
