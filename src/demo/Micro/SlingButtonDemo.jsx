import { useEffect, useMemo, useRef, useState } from 'react';
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

import SlingButton from '../../content/Micro/SlingButton/SlingButton';
import { slingButton } from '../../constants/code/Micro/slingButtonCode';

const DEFAULT_PROPS = {
  padColor: '#f5f5f5',
  iconColor: '#18181b',
  accentColor: '#f5f5f5',
  wellColor: '#27272a',
  bandColor: '#52525b',
  size: 56,
  strokeWidth: 3,
  armAt: 48,
  maxPull: 160,
  launchSpeed: 2600,
  recoil: 0.2,
  flight: 120,
  particles: 14,
  spread: 60,
  axis: 'any',
  tapSends: true,
  disabled: false
};

const AXIS_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' }
];

const SlingButtonDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    padColor,
    iconColor,
    accentColor,
    wellColor,
    bandColor,
    size,
    strokeWidth,
    armAt,
    maxPull,
    launchSpeed,
    recoil,
    flight,
    particles,
    spread,
    axis,
    tapSends,
    disabled
  } = props;

  const renderedPad = useColorModeValue(padColor === DEFAULT_PROPS.padColor ? '#18181b' : padColor, padColor);
  const renderedIcon = useColorModeValue(iconColor === DEFAULT_PROPS.iconColor ? '#ffffff' : iconColor, iconColor);
  const renderedAccent = useColorModeValue(
    accentColor === DEFAULT_PROPS.accentColor ? '#18181b' : accentColor,
    accentColor
  );
  const renderedWell = useColorModeValue(wellColor === DEFAULT_PROPS.wellColor ? '#f6f6f6' : wellColor, wellColor);
  const renderedBand = useColorModeValue(bandColor === DEFAULT_PROPS.bandColor ? '#a1a1aa' : bandColor, bandColor);

  const [sent, setSent] = useState(false);
  const sentTimer = useRef(undefined);
  const handleSend = () => {
    clearTimeout(sentTimer.current);
    setSent(true);
    sentTimer.current = setTimeout(() => setSent(false), 1400);
  };
  useEffect(() => () => clearTimeout(sentTimer.current), []);

  const propData = useMemo(
    () => [
      { name: 'children', type: 'ReactNode', default: 'undefined', description: 'Pad content. Defaults to an arrow.' },
      {
        name: 'onSend',
        type: '() => void',
        default: '-',
        description: 'Called on a loaded release, on a tap when tapSends is on, and on Enter or Space.'
      },
      { name: 'padColor', type: 'string', default: '"#f5f5f5"', description: 'The pad fill.' },
      { name: 'iconColor', type: 'string', default: '"#18181b"', description: 'The pad content colour.' },
      {
        name: 'accentColor',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'The power arc, the loaded band and the dot.'
      },
      { name: 'wellColor', type: 'string', default: '"#27272a"', description: 'The seat the pad rests in.' },
      { name: 'bandColor', type: 'string', default: '"#52525b"', description: 'The band before it loads.' },
      {
        name: 'size',
        type: 'number',
        default: '56',
        description: 'Pad diameter in pixels. Seat, hit area and dot follow.'
      },
      {
        name: 'strokeWidth',
        type: 'number',
        default: '3',
        description: 'Arc and band thickness in pixels. The band thins as it stretches.'
      },
      { name: 'armAt', type: 'number', default: '48', description: 'Pull distance in pixels that loads the send.' },
      {
        name: 'maxPull',
        type: 'number',
        default: '160',
        description: 'How far the band can stretch before it stops giving.'
      },
      {
        name: 'launchSpeed',
        type: 'number',
        default: '2600',
        description:
          'Speed the band adds on release, in pixels per second. Sets how far the pad snaps through its seat.'
      },
      { name: 'recoil', type: 'number', default: '0.2', description: 'Bounce of the return spring. 0 stops dead.' },
      {
        name: 'flight',
        type: 'number',
        default: '120',
        description: 'How far the lead particle flies, in pixels. The rest scatter around that distance.'
      },
      {
        name: 'particles',
        type: 'number',
        default: '14',
        description:
          'How many particles a launch throws. Each gets a random angle, reach, size, drift, speed and delay. 1 is a single dot, 0 is none.'
      },
      {
        name: 'spread',
        type: 'number',
        default: '60',
        description: 'The cone the burst fans across, in degrees, centred on the launch direction.'
      },
      {
        name: 'axis',
        type: '"any" | "horizontal" | "vertical"',
        default: '"any"',
        description: 'Free pull, or one axis with a little give across it.'
      },
      {
        name: 'tapSends',
        type: 'boolean',
        default: 'true',
        description: 'Whether a plain tap sends. Enter always does.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the pad and ignores input.' },
      { name: 'ariaLabel', type: 'string', default: '"Send"', description: 'Accessible name of the button.' },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
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
            h={400}
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <SlingButton
              onSend={handleSend}
              padColor={renderedPad}
              iconColor={renderedIcon}
              accentColor={renderedAccent}
              wellColor={renderedWell}
              bandColor={renderedBand}
              size={size}
              strokeWidth={strokeWidth}
              armAt={armAt}
              maxPull={maxPull}
              launchSpeed={launchSpeed}
              recoil={recoil}
              flight={flight}
              particles={particles}
              spread={spread}
              axis={axis}
              tapSends={tapSends}
              disabled={disabled}
            />
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, 0)"
              mt={`${Math.round(size / 2) + 22}px`}
              fontSize="12px"
              lineHeight={1}
              letterSpacing="0.02em"
              color={renderedAccent}
              opacity={sent ? 0.6 : 0}
              transition="opacity 200ms ease"
              pointerEvents="none"
              aria-live="polite"
            >
              {sent ? 'Sent' : ''}
            </Box>
          </Box>

          <Customize>
            <PreviewColorPickerCustom title="Pad" color={renderedPad} onChange={val => updateProp('padColor', val)} />
            <PreviewColorPickerCustom
              title="Icon"
              color={renderedIcon}
              onChange={val => updateProp('iconColor', val)}
            />
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent}
              onChange={val => updateProp('accentColor', val)}
            />
            <PreviewColorPickerCustom
              title="Well"
              color={renderedWell}
              onChange={val => updateProp('wellColor', val)}
            />
            <PreviewColorPickerCustom
              title="Band"
              color={renderedBand}
              onChange={val => updateProp('bandColor', val)}
            />
            <PreviewSlider
              title="Size"
              min={40}
              max={88}
              step={2}
              value={size}
              valueUnit="px"
              onChange={val => updateProp('size', val)}
            />
            <PreviewSlider
              title="Stroke Width"
              min={1.5}
              max={6}
              step={0.5}
              value={strokeWidth}
              valueUnit="px"
              onChange={val => updateProp('strokeWidth', val)}
            />
            <PreviewSlider
              title="Arm At"
              min={24}
              max={96}
              step={4}
              value={armAt}
              valueUnit="px"
              onChange={val => updateProp('armAt', val)}
            />
            <PreviewSlider
              title="Max Pull"
              min={80}
              max={320}
              step={10}
              value={maxPull}
              valueUnit="px"
              onChange={val => updateProp('maxPull', val)}
            />
            <PreviewSlider
              title="Launch Speed"
              min={800}
              max={4000}
              step={100}
              value={launchSpeed}
              valueUnit="px/s"
              onChange={val => updateProp('launchSpeed', val)}
            />
            <PreviewSlider
              title="Recoil"
              min={0}
              max={0.3}
              step={0.05}
              value={recoil}
              onChange={val => updateProp('recoil', val)}
            />
            <PreviewSlider
              title="Flight"
              min={40}
              max={240}
              step={10}
              value={flight}
              valueUnit="px"
              onChange={val => updateProp('flight', val)}
            />
            <PreviewSlider
              title="Particles"
              min={0}
              max={80}
              step={1}
              value={particles}
              onChange={val => updateProp('particles', val)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={180}
              step={5}
              value={spread}
              valueUnit="°"
              onChange={val => updateProp('spread', val)}
            />
            <PreviewSelect
              title="Axis"
              options={AXIS_OPTIONS}
              value={axis}
              onChange={val => updateProp('axis', val)}
              width={130}
            />
            <PreviewSwitch title="Tap Sends" isChecked={tapSends} onChange={val => updateProp('tapSends', val)} />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={slingButton} componentName="SlingButton" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SlingButtonDemo;
