import { useEffect, useMemo, useState } from 'react';
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
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import BellToggle from '../../content/Micro/BellToggle/BellToggle';
import { bellToggle } from '../../constants/code/Micro/bellToggleCode';

const DEFAULT_PROPS = {
  offLabel: 'Notify me',
  onLabel: "You'll be notified",
  color: '#f5f5f5',
  background: '#27272a',
  onColor: '#18181b',
  onBackground: '#f5f5f5',
  size: 'md',
  radius: 22,
  ringAmplitude: 17,
  ringPasses: 5,
  ringDecay: 1,
  ringDuration: 820,
  ringPivot: 16,
  crossfadeMs: 200,
  revealBounce: 0,
  badge: true,
  badgeColor: '#ef4444',
  waves: true,
  clapper: false,
  disabled: false
};

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const BellToggleDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    offLabel,
    onLabel,
    color,
    background,
    onColor,
    onBackground,
    size,
    radius,
    ringAmplitude,
    ringPasses,
    ringDecay,
    ringDuration,
    ringPivot,
    crossfadeMs,
    revealBounce,
    badge,
    badgeColor,
    waves,
    clapper,
    disabled
  } = props;

  const [on, setOn] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!on) {
      setCount(0);
      return undefined;
    }
    let timer;
    const next = () => {
      timer = setTimeout(
        () => {
          setCount(c => Math.min(9, c + 1));
          next();
        },
        1100 + Math.random() * 1400
      );
    };
    next();
    return () => clearTimeout(timer);
  }, [on]);

  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const renderedBackground = useColorModeValue(
    background === DEFAULT_PROPS.background ? '#f6f6f6' : background,
    background
  );
  const renderedOnColor = useColorModeValue(onColor === DEFAULT_PROPS.onColor ? '#ffffff' : onColor, onColor);
  const renderedOnBackground = useColorModeValue(
    onBackground === DEFAULT_PROPS.onBackground ? '#18181b' : onBackground,
    onBackground
  );

  const propData = useMemo(
    () => [
      {
        name: 'offLabel',
        type: 'string',
        default: '"Notify me"',
        description: 'The face at rest. Its width sets how far the pill is clipped.'
      },
      {
        name: 'onLabel',
        type: 'string',
        default: '"You\'ll be notified"',
        description:
          'The face after the yes press. The pill reserves the width of the longer label; only the visible part changes, so neighbours never shift.'
      },
      {
        name: 'icon',
        type: 'ReactNode',
        default: 'undefined',
        description: 'Replaces the bell. Adjust ringPivot for a glyph that hangs elsewhere.'
      },
      {
        name: 'label',
        type: 'string',
        default: 'undefined',
        description: 'Constant accessible name. Falls back to offLabel.'
      },
      { name: 'color', type: 'string', default: '"#f5f5f5"', description: 'Ink at rest: label, bell and hover tint.' },
      { name: 'background', type: 'string', default: '"#27272a"', description: 'Pill fill at rest.' },
      { name: 'onColor', type: 'string', default: '"#18181b"', description: 'Ink when pressed.' },
      { name: 'onBackground', type: 'string', default: '"#f5f5f5"', description: 'Fill when pressed.' },
      {
        name: 'size',
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: '36, 44 or 52 pixels tall with matching type, icon and padding.'
      },
      { name: 'radius', type: 'number', default: '22', description: 'Corner radius of the pill and of the clip cap.' },
      {
        name: 'ringAmplitude',
        type: 'number',
        default: '17',
        description: 'Degrees of the first swing. Every later swing scales from it.'
      },
      {
        name: 'ringPasses',
        type: 'number',
        default: '5',
        description: 'Half-swings before rest. 2 is a nod, 9 a peal.'
      },
      {
        name: 'ringDecay',
        type: 'number',
        default: '1',
        description: 'How fast the swings die. 1 evenly, 2 the second is already small, 0.5 keeps shaking.'
      },
      { name: 'ringDuration', type: 'number', default: '820', description: 'Milliseconds for the whole ring.' },
      {
        name: 'ringPivot',
        type: 'number',
        default: '16',
        description: 'Where the icon hangs from, as a percentage of its height. 16 is the crown, 50 the centre.'
      },
      {
        name: 'crossfadeMs',
        type: 'number',
        default: '200',
        description: 'The label and fill crossfade. Also all a keyboard toggle gets.'
      },
      {
        name: 'revealBounce',
        type: 'number',
        default: '0',
        description: 'Overshoot of the unfurl. 0 is critically damped; 0.2 lets the cap pass its mark and return.'
      },
      {
        name: 'count',
        type: 'number',
        default: '0',
        description: 'Notifications waiting. A rise while on rolls the badge and wobbles the bell.'
      },
      { name: 'badge', type: 'boolean', default: 'true', description: 'Show the count on the bell while on.' },
      { name: 'badgeColor', type: 'string', default: '"#ef4444"', description: 'The badge.' },
      { name: 'badgeTextColor', type: 'string', default: '"#ffffff"', description: 'The count on the badge.' },
      { name: 'waves', type: 'boolean', default: 'true', description: 'Sound waves leave the rim on every swing.' },
      {
        name: 'clapper',
        type: 'boolean',
        default: 'false',
        description: 'Draw a bell with a clapper that swings a beat behind the body.'
      },
      {
        name: 'pressed',
        type: 'boolean',
        default: 'undefined',
        description: 'Controlled state. Outside changes only crossfade.'
      },
      { name: 'defaultPressed', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
      { name: 'onChange', type: '(pressed: boolean) => void', default: '-', description: 'Called on every toggle.' },
      {
        name: 'disabled',
        type: 'boolean',
        default: 'false',
        description: 'Dims the pill and ignores input. The state is kept.'
      },
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
            <BellToggle
              offLabel={offLabel}
              onLabel={onLabel}
              color={renderedColor}
              background={renderedBackground}
              onColor={renderedOnColor}
              onBackground={renderedOnBackground}
              size={size}
              radius={radius}
              ringAmplitude={ringAmplitude}
              ringPasses={ringPasses}
              ringDecay={ringDecay}
              ringDuration={ringDuration}
              ringPivot={ringPivot}
              crossfadeMs={crossfadeMs}
              revealBounce={revealBounce}
              count={count}
              badge={badge}
              badgeColor={badgeColor}
              waves={waves}
              clapper={clapper}
              pressed={on}
              onChange={setOn}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewColorPickerCustom title="Text" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground}
              onChange={val => updateProp('background', val)}
            />
            <PreviewColorPickerCustom
              title="Pressed Text"
              color={renderedOnColor}
              onChange={val => updateProp('onColor', val)}
            />
            <PreviewColorPickerCustom
              title="Pressed Background"
              color={renderedOnBackground}
              onChange={val => updateProp('onBackground', val)}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={size}
              onChange={val => updateProp('size', val)}
              width={120}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={26}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Ring Amplitude"
              min={6}
              max={40}
              step={1}
              value={ringAmplitude}
              valueUnit="°"
              onChange={val => updateProp('ringAmplitude', val)}
            />
            <PreviewSlider
              title="Ring Passes"
              min={2}
              max={9}
              step={1}
              value={ringPasses}
              onChange={val => updateProp('ringPasses', val)}
            />
            <PreviewSlider
              title="Ring Decay"
              min={0.5}
              max={2}
              step={0.1}
              value={ringDecay}
              onChange={val => updateProp('ringDecay', val)}
            />
            <PreviewSlider
              title="Ring Duration"
              min={400}
              max={1400}
              step={20}
              value={ringDuration}
              valueUnit="ms"
              onChange={val => updateProp('ringDuration', val)}
            />
            <PreviewSlider
              title="Ring Pivot"
              min={0}
              max={100}
              step={2}
              value={ringPivot}
              valueUnit="%"
              onChange={val => updateProp('ringPivot', val)}
            />
            <PreviewSlider
              title="Crossfade"
              min={100}
              max={300}
              step={10}
              value={crossfadeMs}
              valueUnit="ms"
              onChange={val => updateProp('crossfadeMs', val)}
            />
            <PreviewSlider
              title="Reveal Bounce"
              min={0}
              max={0.3}
              step={0.05}
              value={revealBounce}
              onChange={val => updateProp('revealBounce', val)}
            />
            <PreviewSwitch title="Badge" isChecked={badge} onChange={val => updateProp('badge', val)} />
            <PreviewColorPickerCustom
              title="Badge Color"
              color={badgeColor}
              onChange={val => updateProp('badgeColor', val)}
            />
            <PreviewSwitch title="Waves" isChecked={waves} onChange={val => updateProp('waves', val)} />
            <PreviewSwitch title="Clapper" isChecked={clapper} onChange={val => updateProp('clapper', val)} />
            <PreviewInput
              title="Off Label"
              value={offLabel}
              maxLength={24}
              onChange={val => updateProp('offLabel', val)}
            />
            <PreviewInput
              title="On Label"
              value={onLabel}
              maxLength={24}
              onChange={val => updateProp('onLabel', val)}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={bellToggle} componentName="BellToggle" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default BellToggleDemo;
