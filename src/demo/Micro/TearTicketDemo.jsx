import { useMemo, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import TearTicket from '../../content/Micro/TearTicket/TearTicket';
import { tearTicket } from '../../constants/code/Micro/tearTicketCode';

const IMAGE =
  'https://images.unsplash.com/photo-1604852961945-155837ffebe2?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const DEFAULT_PROPS = {
  orientation: 'horizontal',
  scrim: false,
  width: 460,
  height: 250,
  stubSize: 150,
  radius: 16,
  holes: 12,
  holeSize: 6,
  notch: 3,
  roughness: 0,
  tearAngle: 30,
  stretch: 30,
  resistance: 0.45,
  rotate: 4,
  tilt: true,
  tiltMax: 9,
  tiltReach: 260,
  parallax: 6,
  perspective: 1000,
  background: '#27272a',
  color: '#f5f5f5',
  border: true,
  borderColor: '',
  borderWidth: 1,
  recenter: true,
  disabled: false
};

const ORIENTATION_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' }
];
const SIZES = {
  horizontal: { width: 460, height: 250, stubSize: 150 },
  vertical: { width: 300, height: 440, stubSize: 130 }
};

const PAD = 24;

const Face = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
      height: '100%',
      paddingTop: 'calc(var(--tt-body-h) * var(--tt-span) - var(--tt-inset))',
      paddingRight: PAD,
      paddingLeft: PAD,
      boxSizing: 'border-box'
    }}
  >
    <span style={{ fontSize: 15, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.01em' }}>Spectrum</span>
    <span style={{ fontSize: 13, lineHeight: 1, opacity: 0.45 }}>14 Nov</span>
  </div>
);

const Details = () => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <span style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.01em' }}>Admit one</span>
    <span style={{ marginTop: 8, fontSize: 12, lineHeight: 1.55, opacity: 0.5 }}>
      Rooftop gallery
      <br />
      Until 30 Nov
    </span>
  </div>
);

const Stub = ({ vertical }) =>
  vertical ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        paddingTop: 32,
        paddingRight: PAD,
        paddingBottom: 30,
        paddingLeft: PAD,
        boxSizing: 'border-box',
        textAlign: 'left'
      }}
    >
      <span style={{ fontSize: 17, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.01em' }}>Admit one</span>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 }}>
        <span style={{ fontSize: 12, lineHeight: 1, opacity: 0.5 }}>Rooftop gallery · Until 30 Nov</span>
        <span style={{ fontSize: 13, lineHeight: 1, opacity: 0.45, fontVariantNumeric: 'tabular-nums' }}>
          No. 284619
        </span>
      </div>
    </div>
  ) : (
    <div style={{ position: 'relative', height: '100%', textAlign: 'left' }}>
      <div style={{ padding: '30px 20px 0 26px' }}>
        <Details />
      </div>
      <span
        style={{
          position: 'absolute',
          bottom: 30,
          left: 26,
          lineHeight: 1,
          fontSize: 13,
          opacity: 0.45,
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        No. 284619
      </span>
    </div>
  );

const TearTicketDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    orientation,
    scrim,
    width,
    height,
    stubSize,
    radius,
    holes,
    holeSize,
    notch,
    roughness,
    tearAngle,
    stretch,
    resistance,
    rotate,
    tilt,
    tiltMax,
    tiltReach,
    parallax,
    perspective,
    background,
    color,
    border,
    borderColor,
    borderWidth,
    recenter,
    disabled
  } = props;
  const [run, setRun] = useState(0);

  const renderedBackground = useColorModeValue(
    background === DEFAULT_PROPS.background ? '#f6f6f6' : background,
    background
  );
  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);

  const innerRadius = Math.max(0, radius - 8);

  const propData = useMemo(
    () => [
      { name: 'children', type: 'ReactNode', default: 'null', description: 'Content of the ticket body.' },
      { name: 'stub', type: 'ReactNode', default: 'null', description: 'Content of the tear-off stub.' },
      {
        name: 'image',
        type: 'string',
        default: '""',
        description: 'Artwork behind the body. It shifts against the tilt for parallax and turns grey once used.'
      },
      { name: 'imageAlt', type: 'string', default: '""', description: 'Alt text for the artwork.' },
      {
        name: 'scrim',
        type: 'boolean',
        default: 'true',
        description: 'A fade from the paper colour up over the artwork, so text stays readable on busy images.'
      },
      {
        name: 'imageRadius',
        type: 'number',
        default: '8',
        description:
          'Corner radius of the artwork panel, in px. Set it to the ticket radius minus 8 to stay concentric.'
      },
      {
        name: 'orientation',
        type: "'horizontal' | 'vertical'",
        default: "'horizontal'",
        description:
          'Horizontal puts the stub on the right. Vertical puts the artwork on top and the stub at the bottom.'
      },
      {
        name: 'torn',
        type: 'boolean',
        default: '-',
        description: 'Controlled state. Set it back to false to restore the stub.'
      },
      { name: 'defaultTorn', type: 'boolean', default: 'false', description: 'Start already used.' },
      { name: 'onTear', type: '() => void', default: '-', description: 'Fires once the stub has come free and gone.' },
      {
        name: 'width',
        type: 'number',
        default: '460',
        description: 'Ticket width in px. It scales down to fit a narrower parent.'
      },
      { name: 'height', type: 'number', default: '250', description: 'Ticket height in px.' },
      {
        name: 'stubSize',
        type: 'number',
        default: '150',
        description: 'Size of the stub along the ticket, in px: its width when horizontal, its height when vertical.'
      },
      { name: 'radius', type: 'number', default: '16', description: 'Outer corner radius in px.' },
      {
        name: 'holes',
        type: 'number',
        default: '12',
        description: 'Perforation holes along the tear line.'
      },
      { name: 'holeSize', type: 'number', default: '6', description: 'Hole diameter in px.' },
      {
        name: 'notch',
        type: 'number',
        default: '3',
        description: 'Radius of the notches at both ends of the tear line.'
      },
      {
        name: 'roughness',
        type: 'number',
        default: '0',
        description:
          'Optional jitter of the torn line between holes, in px. 0 keeps the edge perfectly straight and symmetrical.'
      },
      {
        name: 'tearAngle',
        type: 'number',
        default: '30',
        description: 'Degrees of pull at which the last bridge gives way and the stub comes free.'
      },
      {
        name: 'stretch',
        type: 'number',
        default: '30',
        description:
          'How far a paper bridge stretches before it snaps, in px. Bridges far from the hinge reach it first.'
      },
      {
        name: 'resistance',
        type: 'number',
        default: '0.45',
        description:
          'How much the intact fibres hold the stub back, 0 to 1. The pull eases as bridges give way, so the paper fights hardest at the start.'
      },
      {
        name: 'rotate',
        type: 'number',
        default: '4',
        description: 'A resting tilt of the whole ticket in the page plane, in degrees.'
      },
      { name: 'tilt', type: 'boolean', default: 'true', description: 'The ticket leans toward the cursor in 3D.' },
      { name: 'tiltMax', type: 'number', default: '9', description: 'Largest tilt angle in degrees.' },
      {
        name: 'tiltReach',
        type: 'number',
        default: '260',
        description:
          'How far beyond the ticket the pointer still steers the tilt, in px. The tilt tracks the whole page.'
      },
      {
        name: 'parallax',
        type: 'number',
        default: '6',
        description: 'How far the artwork travels against the tilt, in px.'
      },
      { name: 'perspective', type: 'number', default: '1000', description: 'Viewing distance in px.' },
      {
        name: 'background',
        type: 'string',
        default: '"#27272a"',
        description: 'Paper colour, also used by the fibres.'
      },
      { name: 'color', type: 'string', default: '"#f5f5f5"', description: 'Text colour.' },
      {
        name: 'border',
        type: 'boolean',
        default: 'true',
        description: 'A hairline drawn along the cut edge of each piece, following every hole and notch.'
      },
      {
        name: 'borderColor',
        type: 'string',
        default: '""',
        description: 'Colour of that hairline. Empty derives a faint tint of the text colour.'
      },
      { name: 'borderWidth', type: 'number', default: '1', description: 'Thickness of the hairline in px.' },
      {
        name: 'stubBackground',
        type: 'string',
        default: '""',
        description: 'Stub paper colour. Empty follows background.'
      },
      {
        name: 'recenter',
        type: 'boolean',
        default: 'true',
        description: 'Once the stub is gone, the remaining ticket glides over to sit centred in its original box.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dimmed and inert.' },
      {
        name: 'ariaLabel',
        type: 'string',
        default: '"Tear off the stub"',
        description: 'Accessible name of the stub. Enter or Space tears it.'
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
            <RefreshButton onClick={() => setRun(r => r + 1)} />
            <TearTicket
              key={run}
              image={IMAGE}
              imageAlt="Visitors in a walkway of coloured glass"
              stub={<Stub vertical={orientation === 'vertical'} />}
              orientation={orientation}
              scrim={scrim}
              imageRadius={innerRadius}
              width={width}
              height={height}
              stubSize={stubSize}
              radius={radius}
              holes={holes}
              holeSize={holeSize}
              notch={notch}
              roughness={roughness}
              tearAngle={tearAngle}
              stretch={stretch}
              resistance={resistance}
              rotate={rotate}
              tilt={tilt}
              tiltMax={tiltMax}
              tiltReach={tiltReach}
              parallax={parallax}
              perspective={perspective}
              background={renderedBackground}
              color={renderedColor}
              border={border}
              borderColor={borderColor}
              borderWidth={borderWidth}
              recenter={recenter}
              disabled={disabled}
            >
              <Face />
            </TearTicket>
          </Box>

          <Customize>
            <PreviewSelect
              title="Orientation"
              options={ORIENTATION_OPTIONS}
              value={orientation}
              onChange={val => {
                updateProp('orientation', val);
                Object.entries(SIZES[val] ?? SIZES.horizontal).forEach(([key, size]) => updateProp(key, size));
                setRun(r => r + 1);
              }}
              width={150}
            />
            <PreviewSwitch title="Scrim" isChecked={scrim} onChange={val => updateProp('scrim', val)} />
            <PreviewSlider
              title="Width"
              min={220}
              max={560}
              step={10}
              value={width}
              valueUnit="px"
              onChange={val => updateProp('width', val)}
            />
            <PreviewSlider
              title="Height"
              min={140}
              max={460}
              step={10}
              value={height}
              valueUnit="px"
              onChange={val => updateProp('height', val)}
            />
            <PreviewSlider
              title="Stub Size"
              min={70}
              max={180}
              step={2}
              value={stubSize}
              valueUnit="px"
              onChange={val => updateProp('stubSize', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={32}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Holes"
              min={6}
              max={44}
              step={1}
              value={holes}
              onChange={val => updateProp('holes', val)}
            />
            <PreviewSlider
              title="Hole Size"
              min={1}
              max={8}
              step={0.2}
              value={holeSize}
              valueUnit="px"
              onChange={val => updateProp('holeSize', val)}
            />
            <PreviewSlider
              title="Notch"
              min={0}
              max={16}
              step={1}
              value={notch}
              valueUnit="px"
              onChange={val => updateProp('notch', val)}
            />
            <PreviewSlider
              title="Roughness"
              min={0}
              max={3}
              step={0.1}
              value={roughness}
              valueUnit="px"
              onChange={val => updateProp('roughness', val)}
            />
            <PreviewSlider
              title="Tear Angle"
              min={12}
              max={60}
              step={1}
              value={tearAngle}
              valueUnit="°"
              onChange={val => updateProp('tearAngle', val)}
            />
            <PreviewSlider
              title="Stretch"
              min={2}
              max={60}
              step={1}
              value={stretch}
              valueUnit="px"
              onChange={val => updateProp('stretch', val)}
            />
            <PreviewSlider
              title="Resistance"
              min={0}
              max={0.9}
              step={0.05}
              value={resistance}
              onChange={val => updateProp('resistance', val)}
            />
            <PreviewSlider
              title="Rotate"
              min={-20}
              max={20}
              step={1}
              value={rotate}
              valueUnit="°"
              onChange={val => updateProp('rotate', val)}
            />
            <PreviewSwitch title="Tilt" isChecked={tilt} onChange={val => updateProp('tilt', val)} />
            <PreviewSlider
              title="Tilt Max"
              min={0}
              max={24}
              step={1}
              value={tiltMax}
              valueUnit="°"
              isDisabled={!tilt}
              onChange={val => updateProp('tiltMax', val)}
            />
            <PreviewSlider
              title="Tilt Reach"
              min={0}
              max={700}
              step={20}
              value={tiltReach}
              valueUnit="px"
              isDisabled={!tilt}
              onChange={val => updateProp('tiltReach', val)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={32}
              step={1}
              value={parallax}
              valueUnit="px"
              isDisabled={!tilt}
              onChange={val => updateProp('parallax', val)}
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
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground}
              onChange={val => updateProp('background', val)}
            />
            <PreviewColorPickerCustom title="Color" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewSwitch title="Border" isChecked={border} onChange={val => updateProp('border', val)} />
            <PreviewSlider
              title="Border Width"
              min={0.5}
              max={4}
              step={0.5}
              value={borderWidth}
              valueUnit="px"
              isDisabled={!border}
              onChange={val => updateProp('borderWidth', val)}
            />
            <PreviewSwitch title="Recenter" isChecked={recenter} onChange={val => updateProp('recenter', val)} />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={tearTicket} />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TearTicketDemo;
