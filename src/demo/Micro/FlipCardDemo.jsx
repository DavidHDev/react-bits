import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import FlipCard from '../../content/Micro/FlipCard/FlipCard';
import { flipCard } from '../../constants/code/Micro/flipCardCode';

const IMAGE =
  'https://images.unsplash.com/photo-1632231484562-3d2bed7e808d?q=80&w=1318&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const DEFAULT_PROPS = {
  axis: 'y',
  flipOnClick: true,
  draggable: true,
  dragDistance: 0,
  tilt: true,
  tiltMax: 12,
  glare: true,
  glareOpacity: 0.22,
  hoverScale: 1.03,
  perspective: 1100,
  stiffness: 170,
  damping: 20,
  width: 300,
  height: 400,
  radius: 22,
  background: '#27272a',
  color: '#f5f5f5',
  shadow: true,
  shadowColor: '#000000',
  shadowOpacity: 0.45,
  disabled: false
};

const AXIS_OPTIONS = [
  { value: 'y', label: 'Horizontal' },
  { value: 'x', label: 'Vertical' }
];

const Front = () => (
  <img
    src={IMAGE}
    alt="Wooded Landscape, 17th century"
    draggable={false}
    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
  />
);

const Back = () => (
  <div style={{ position: 'relative', height: '100%', textAlign: 'left' }}>
    <img
      src={IMAGE}
      alt=""
      draggable={false}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scaleX(-1)',
        filter: 'grayscale(1) contrast(1.1)',
        opacity: 0.34
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(to bottom, var(--fc-bg) 0%, color-mix(in srgb, var(--fc-bg) 55%, transparent) 26%, transparent 46%, transparent 58%, color-mix(in srgb, var(--fc-bg) 60%, transparent) 80%, var(--fc-bg) 100%)'
      }}
    />
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '26px 28px',
        boxSizing: 'border-box'
      }}
    >
      <span style={{ fontSize: 27, fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
        Wooded Landscape
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          fontSize: 14,
          lineHeight: 1.2,
          letterSpacing: '0.01em',
          opacity: 0.7
        }}
      >
        <span>17th century</span>
        <span>Rijksmuseum</span>
      </div>
    </div>
  </div>
);

const FlipCardDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    axis,
    flipOnClick,
    draggable,
    dragDistance,
    tilt,
    tiltMax,
    glare,
    glareOpacity,
    hoverScale,
    perspective,
    stiffness,
    damping,
    width,
    height,
    radius,
    background,
    color,
    shadow,
    shadowColor,
    shadowOpacity,
    disabled
  } = props;

  const renderedBackground = useColorModeValue(
    background === DEFAULT_PROPS.background ? '#f6f6f6' : background,
    background
  );
  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const renderedShadowOpacity = useColorModeValue(
    shadowOpacity === DEFAULT_PROPS.shadowOpacity ? 0.2 : shadowOpacity,
    shadowOpacity
  );

  const propData = useMemo(
    () => [
      { name: 'front', type: 'ReactNode', default: 'null', description: 'Content of the front face.' },
      { name: 'back', type: 'ReactNode', default: 'null', description: 'Content of the back face.' },
      {
        name: 'flipped',
        type: 'boolean',
        default: '-',
        description: 'Controlled state: true shows the back. Omit it to let the card manage itself.'
      },
      { name: 'defaultFlipped', type: 'boolean', default: 'false', description: 'Start on the back face.' },
      {
        name: 'onFlipChange',
        type: '(flipped: boolean) => void',
        default: '-',
        description: 'Fires when a click, drag, flick or key lands on the other face.'
      },
      {
        name: 'axis',
        type: "'y' | 'x'",
        default: "'y'",
        description: 'y turns the card sideways and drags horizontally. x turns it over the top and drags vertically.'
      },
      {
        name: 'flipOnClick',
        type: 'boolean',
        default: 'true',
        description: 'A press without movement flips the card.'
      },
      {
        name: 'draggable',
        type: 'boolean',
        default: 'true',
        description:
          'Drag to turn the card by hand. On release it springs to the nearest face, carrying the flick velocity.'
      },
      {
        name: 'dragDistance',
        type: 'number',
        default: '0',
        description: 'Pixels of drag for a half turn. 0 uses the card width, or its height on the x axis.'
      },
      { name: 'tilt', type: 'boolean', default: 'true', description: 'The card leans toward the cursor on hover.' },
      { name: 'tiltMax', type: 'number', default: '12', description: 'Largest tilt angle in degrees.' },
      { name: 'glare', type: 'boolean', default: 'true', description: 'A soft sheen that follows the cursor.' },
      { name: 'glareOpacity', type: 'number', default: '0.22', description: 'Strength of the sheen at its centre.' },
      { name: 'hoverScale', type: 'number', default: '1.03', description: 'Lift while hovered or held.' },
      {
        name: 'perspective',
        type: 'number',
        default: '1100',
        description: 'Viewing distance in px. Smaller is more dramatic.'
      },
      { name: 'stiffness', type: 'number', default: '170', description: 'Stiffness of the flip spring.' },
      {
        name: 'damping',
        type: 'number',
        default: '20',
        description: 'Damping of the flip spring. Lower overshoots more.'
      },
      { name: 'width', type: 'number', default: '300', description: 'Card width in px, capped at the parent.' },
      { name: 'height', type: 'number', default: '400', description: 'Card height in px.' },
      { name: 'radius', type: 'number', default: '22', description: 'Corner radius in px.' },
      { name: 'background', type: 'string', default: '"#27272a"', description: 'Surface of both faces.' },
      { name: 'color', type: 'string', default: '"#f5f5f5"', description: 'Text colour of both faces.' },
      {
        name: 'shadow',
        type: 'boolean',
        default: 'true',
        description: 'A soft shadow beneath the card that narrows as it turns edge on.'
      },
      { name: 'shadowColor', type: 'string', default: '"#000000"', description: 'Shadow colour.' },
      { name: 'shadowOpacity', type: 'number', default: '0.45', description: 'Shadow strength.' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dimmed, flat and inert.' },
      {
        name: 'ariaLabel',
        type: 'string',
        default: '"Flip card"',
        description: 'Accessible name. The face is carried by aria-pressed.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={560} overflow="hidden">
            <FlipCard
              front={<Front />}
              back={<Back />}
              axis={axis}
              flipOnClick={flipOnClick}
              draggable={draggable}
              dragDistance={dragDistance}
              tilt={tilt}
              tiltMax={tiltMax}
              glare={glare}
              glareOpacity={glareOpacity}
              hoverScale={hoverScale}
              perspective={perspective}
              stiffness={stiffness}
              damping={damping}
              width={width}
              height={height}
              radius={radius}
              background={renderedBackground}
              color={renderedColor}
              shadow={shadow}
              shadowColor={shadowColor}
              shadowOpacity={renderedShadowOpacity}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewSelect
              title="Axis"
              options={AXIS_OPTIONS}
              value={axis}
              onChange={val => updateProp('axis', val)}
              width={140}
            />
            <PreviewSwitch
              title="Flip On Click"
              isChecked={flipOnClick}
              onChange={val => updateProp('flipOnClick', val)}
            />
            <PreviewSwitch title="Draggable" isChecked={draggable} onChange={val => updateProp('draggable', val)} />
            <PreviewSlider
              title="Drag Distance"
              min={0}
              max={600}
              step={10}
              value={dragDistance}
              valueUnit="px"
              isDisabled={!draggable}
              onChange={val => updateProp('dragDistance', val)}
            />
            <PreviewSwitch title="Tilt" isChecked={tilt} onChange={val => updateProp('tilt', val)} />
            <PreviewSlider
              title="Tilt Max"
              min={0}
              max={30}
              step={1}
              value={tiltMax}
              valueUnit="°"
              isDisabled={!tilt}
              onChange={val => updateProp('tiltMax', val)}
            />
            <PreviewSwitch title="Glare" isChecked={glare} onChange={val => updateProp('glare', val)} />
            <PreviewSlider
              title="Glare Opacity"
              min={0}
              max={0.6}
              step={0.02}
              value={glareOpacity}
              isDisabled={!glare}
              onChange={val => updateProp('glareOpacity', val)}
            />
            <PreviewSlider
              title="Hover Scale"
              min={1}
              max={1.1}
              step={0.01}
              value={hoverScale}
              onChange={val => updateProp('hoverScale', val)}
            />
            <PreviewSlider
              title="Perspective"
              min={400}
              max={2400}
              step={50}
              value={perspective}
              valueUnit="px"
              onChange={val => updateProp('perspective', val)}
            />
            <PreviewSlider
              title="Stiffness"
              min={60}
              max={500}
              step={10}
              value={stiffness}
              onChange={val => updateProp('stiffness', val)}
            />
            <PreviewSlider
              title="Damping"
              min={6}
              max={50}
              step={1}
              value={damping}
              onChange={val => updateProp('damping', val)}
            />
            <PreviewSlider
              title="Width"
              min={180}
              max={380}
              step={10}
              value={width}
              valueUnit="px"
              onChange={val => updateProp('width', val)}
            />
            <PreviewSlider
              title="Height"
              min={220}
              max={460}
              step={10}
              value={height}
              valueUnit="px"
              onChange={val => updateProp('height', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={48}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground}
              onChange={val => updateProp('background', val)}
            />
            <PreviewColorPickerCustom title="Color" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewSwitch title="Shadow" isChecked={shadow} onChange={val => updateProp('shadow', val)} />
            <PreviewColorPickerCustom
              title="Shadow Color"
              color={shadowColor}
              onChange={val => updateProp('shadowColor', val)}
            />
            <PreviewSlider
              title="Shadow Opacity"
              min={0}
              max={1}
              step={0.05}
              value={renderedShadowOpacity}
              isDisabled={!shadow}
              onChange={val => updateProp('shadowOpacity', val)}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={flipCard} />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FlipCardDemo;
