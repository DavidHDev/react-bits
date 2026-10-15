import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import RefreshButton from '../../components/common/Preview/RefreshButton';
import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import CountUp from '../../content/TextAnimations/CountUp/CountUp';
import { countup } from '../../constants/code/TextAnimations/countUpCode';

const LOOK = {
  mode: 'count',
  easing: 'easeOut',
  format: 'standard',
  decimals: 'auto',
  from: '0',
  to: '100',
  duration: 1,
  direction: 'up',
  separator: ',',
  prefix: '',
  suffix: '',
  replayOnHover: true,
  size: 4,
  weight: 700
};

const PRESETS = {
  classic: { ...LOOK },
  odometer: { ...LOOK, mode: 'roll', easing: 'spring', to: '86420', duration: 2.4, size: 6, weight: 600 },
  revenue: {
    ...LOOK,
    easing: 'expo',
    decimals: '2',
    to: '48250.75',
    duration: 2.2,
    prefix: '$',
    size: 4.5,
    weight: 500
  },
  compact: {
    ...LOOK,
    mode: 'roll',
    format: 'compact',
    to: '3400000',
    duration: 1.8,
    suffix: '+',
    size: 7,
    weight: 800
  }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'odometer', label: 'Odometer' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'compact', label: 'Compact' }
];

const MODE_OPTIONS = [
  { value: 'count', label: 'Count' },
  { value: 'roll', label: 'Roll' }
];

const EASING_OPTIONS = [
  { value: 'easeOut', label: 'Ease out' },
  { value: 'linear', label: 'Linear' },
  { value: 'expo', label: 'Expo' },
  { value: 'spring', label: 'Spring' }
];

const FORMAT_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'compact', label: 'Compact' }
];

const DECIMAL_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' }
];

const TRIGGER_OPTIONS = [
  { value: 'view', label: 'In view' },
  { value: 'load', label: 'Load' }
];

const DIRECTION_OPTIONS = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' }
];

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  trigger: 'view',
  delay: 0
};

const propData = [
  {
    name: 'to',
    type: 'number',
    default: '—',
    description: 'The target number to count up to.'
  },
  {
    name: 'from',
    type: 'number',
    default: '0',
    description: 'The initial number from which the count starts.'
  },
  {
    name: 'mode',
    type: '"count" | "roll"',
    default: '"count"',
    description:
      'Count swaps the digits as the value climbs. Roll turns every digit into a column that spins to its place like an odometer, staggered per column with a soft motion blur while it moves.'
  },
  {
    name: 'easing',
    type: '"easeOut" | "linear" | "expo" | "spring"',
    default: '"easeOut"',
    description: 'Pace of the count. Spring overshoots slightly and settles on the final number.'
  },
  {
    name: 'format',
    type: '"standard" | "compact"',
    default: '"standard"',
    description: 'Compact shortens large numbers to 1.2K, 3.4M or 5.6B.'
  },
  {
    name: 'decimals',
    type: 'number',
    default: 'undefined',
    description: 'Fixed number of decimals. When not set, it follows the decimals in from and to.'
  },
  {
    name: 'direction',
    type: 'string',
    default: '"up"',
    description:
      'Direction of the count; can be "up" or "down". When this is set to "down", "from" and "to" become reversed, in order to count down.'
  },
  {
    name: 'trigger',
    type: '"view" | "load"',
    default: '"view"',
    description: 'View starts the count when the number scrolls into view, load starts it right away.'
  },
  {
    name: 'replayOnHover',
    type: 'boolean',
    default: 'false',
    description: 'Replays the count on hover. In roll mode every column spins once more and lands on the same number.'
  },
  {
    name: 'delay',
    type: 'number',
    default: '0',
    description: 'Delay in seconds before the counting starts.'
  },
  {
    name: 'duration',
    type: 'number',
    default: '2',
    description: 'How long the count takes, in seconds. It lands on the final number right on time.'
  },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'CSS class to apply to the component for additional styling.'
  },
  {
    name: 'style',
    type: 'CSSProperties',
    default: 'undefined',
    description: 'Inline styles for the number, like its font size or weight.'
  },
  {
    name: 'startWhen',
    type: 'boolean',
    default: 'true',
    description:
      'A boolean to control whether the animation should start when the component is in view. It basically works like an if statement, if this is true, the count will start.'
  },
  {
    name: 'separator',
    type: 'string',
    default: '""',
    description: 'Character to use as a thousands separator in the displayed number.'
  },
  {
    name: 'prefix',
    type: 'string',
    default: '""',
    description: 'Text shown before the number, like a currency sign.'
  },
  {
    name: 'suffix',
    type: 'string',
    default: '""',
    description: 'Text shown after the number, like a percent sign or a unit.'
  },
  {
    name: 'onStart',
    type: 'function',
    default: '—',
    description: 'Callback function that is called when the count animation starts.'
  },
  {
    name: 'onEnd',
    type: 'function',
    default: '—',
    description: 'Callback function that is called when the count animation ends.'
  }
];

const toNumber = (value, fallback) => {
  const number = Number(value);
  return value !== '' && Number.isFinite(number) ? number : fallback;
};

const CountUpDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, decimals, from, to, size, weight, ...settings } = props;
  const [key, forceRerender] = useForceRerender();

  const change = (name, value) => {
    updateProp(name, value);
    forceRerender();
  };

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const computedProps = useMemo(
    () => ({
      from: toNumber(from, 0),
      to: toNumber(to, 0),
      ...(decimals === 'auto' ? {} : { decimals: Number(decimals) }),
      style: { fontSize: `${size}rem`, fontWeight: weight }
    }),
    [from, to, decimals, size, weight]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'decimals', 'from', 'to', 'size', 'weight']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" minH={260} style={{ containerType: 'inline-size' }}>
            <CountUp
              key={key}
              {...settings}
              from={computedProps.from}
              to={computedProps.to}
              decimals={computedProps.decimals}
              className="count-up-text"
              style={{ fontSize: `min(${size}rem, ${Math.round(size * 3.4)}cqi)`, fontWeight: weight }}
            />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings.mode}
              onChange={v => change('mode', v)}
            />
            <PreviewSelect
              title="Easing"
              options={EASING_OPTIONS}
              value={settings.easing}
              onChange={v => change('easing', v)}
            />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings.trigger}
              onChange={v => change('trigger', v)}
            />
            <PreviewSelect
              title="Direction"
              value={settings.direction}
              options={DIRECTION_OPTIONS}
              onChange={v => change('direction', v)}
            />
            <PreviewSlider
              title="Duration"
              min={0.5}
              max={10}
              step={0.1}
              value={settings.duration}
              valueUnit="s"
              onChange={v => change('duration', v)}
            />
            <PreviewSlider
              title="Delay"
              min={0}
              max={5}
              step={0.5}
              value={settings.delay}
              valueUnit="s"
              onChange={v => change('delay', v)}
            />
            <PreviewSwitch
              title="Replay on Hover"
              isChecked={settings.replayOnHover}
              onChange={v => change('replayOnHover', v)}
            />
            <PreviewInput title="To" value={to} placeholder="100" maxLength={14} onChange={v => change('to', v)} />
            <PreviewInput title="From" value={from} placeholder="0" maxLength={14} onChange={v => change('from', v)} />
            <PreviewSelect
              title="Format"
              options={FORMAT_OPTIONS}
              value={settings.format}
              onChange={v => change('format', v)}
            />
            <PreviewSelect
              title="Decimals"
              options={DECIMAL_OPTIONS}
              value={decimals}
              onChange={v => change('decimals', v)}
            />
            <PreviewInput
              title="Separator"
              value={settings.separator}
              placeholder=","
              maxLength={1}
              onChange={v => change('separator', v)}
            />
            <PreviewInput
              title="Prefix"
              value={settings.prefix}
              placeholder="$"
              maxLength={4}
              onChange={v => change('prefix', v)}
            />
            <PreviewInput
              title="Suffix"
              value={settings.suffix}
              placeholder="%"
              maxLength={4}
              onChange={v => change('suffix', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={2}
              max={8}
              step={0.5}
              value={size}
              valueUnit="rem"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Font Weight"
              min={300}
              max={900}
              step={100}
              value={weight}
              onChange={v => updateProp('weight', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={countup} componentName="CountUp" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CountUpDemo;
