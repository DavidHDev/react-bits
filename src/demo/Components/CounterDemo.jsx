import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { MinusSignIcon, PlusSignIcon, ShuffleIcon } from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import Counter from '../../content/Components/Counter/Counter';
import { counter } from '../../constants/code/Components/counterCode';
import './CounterDemo.css';

const USD = { style: 'currency', currency: 'USD' };
const PERCENT = { style: 'percent' };
const LAUNCH = ((2 * 24 + 14) * 60 + 37) * 60 + 9;

const FORMATS = {
  number: undefined,
  currency: USD,
  compact: { notation: 'compact' },
  unit: { style: 'unit', unit: 'kilometer-per-hour' }
};

const TILE = {
  padding: '0.18em 0.14em',
  borderRadius: '0.18em',
  background: 'var(--cd-tile)',
  boxShadow: 'var(--cd-tile-edge)'
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const DEFAULT_PROPS = {
  demo: 'countdown',
  textColor: '',
  formatName: 'number',
  direction: 'auto',
  duration: 0.7,
  bounce: 0.2,
  stagger: 0.04,
  fade: 0.3,
  value: 1284,
  fontSize: 120,
  fontWeight: 600,
  gap: 0,
  decimals: 0,
  minDigits: 1,
  motionBlur: true,
  intro: true,
  tabular: true
};

const DEMO_OPTIONS = [
  { value: 'countdown', label: 'Countdown' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'basic', label: 'Basic' }
];

const FORMAT_OPTIONS = [
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'compact', label: 'Compact' },
  { value: 'unit', label: 'Unit' }
];

const DIRECTION_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'shortest', label: 'Shortest' }
];

const propData = [
  { name: 'value', type: 'number', default: '0', description: 'The number to show. Digits roll to every new value.' },
  {
    name: 'locale',
    type: 'string',
    default: "'en-US'",
    description: 'Locale used for separators, symbols and numerals.'
  },
  {
    name: 'format',
    type: 'Intl.NumberFormatOptions',
    default: '-',
    description: 'Formatting options such as currency, percent, units or compact notation.'
  },
  {
    name: 'decimals',
    type: 'number',
    default: '-',
    description: 'Fixed number of decimal places. Leave it out to use the format defaults.'
  },
  { name: 'minDigits', type: 'number', default: '1', description: 'Pads the whole part with leading zeros.' },
  { name: 'prefix', type: 'ReactNode', default: '-', description: 'Content shown before the number.' },
  { name: 'suffix', type: 'ReactNode', default: '-', description: 'Content shown after the number.' },
  {
    name: 'direction',
    type: "'auto' | 'up' | 'down' | 'shortest'",
    default: "'auto'",
    description: 'Which way digits roll. Auto rolls up as the number grows and down as it shrinks.'
  },
  { name: 'duration', type: 'number', default: '0.7', description: 'Roughly how long a roll takes, in seconds.' },
  {
    name: 'bounce',
    type: 'number',
    default: '0.2',
    description: 'How much digits overshoot before settling, from 0 to 0.9.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.04',
    description: 'Delay in seconds between neighbouring digits, so changes ripple from the right.'
  },
  {
    name: 'motionBlur',
    type: 'boolean',
    default: 'true',
    description: 'Blurs digits along their path while they spin fast.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Spins every digit once and lands it when the counter first scrolls into view.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0.3',
    description: 'How far in em digits roll beyond the text before fading out. 0 clips them at the edge.'
  },
  {
    name: 'fontSize',
    type: 'number | string',
    default: '100',
    description: 'Font size in px, or any CSS size such as inherit.'
  },
  { name: 'fontWeight', type: 'number | string', default: "'inherit'", description: 'Font weight of the number.' },
  { name: 'textColor', type: 'string', default: "'inherit'", description: 'Color of the number.' },
  { name: 'gap', type: 'number', default: '0', description: 'Space between digits and symbols in px.' },
  {
    name: 'padding',
    type: 'number',
    default: '0',
    description: 'Extra height in px added to each digit, which also spaces out rolling digits.'
  },
  {
    name: 'tabular',
    type: 'boolean',
    default: 'true',
    description: 'Keeps every digit the same width. When off, widths ease between digits as they roll.'
  },
  {
    name: 'digitStyle',
    type: 'CSSProperties',
    default: '-',
    description: 'Styles for each digit box, for example a tile background with padding and radius.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root.' }
];

const split = seconds => ({
  days: Math.floor(seconds / 86400),
  hours: Math.floor(seconds / 3600) % 24,
  minutes: Math.floor(seconds / 60) % 60,
  seconds: seconds % 60
});

const CountdownScene = ({ motion, color }) => {
  const [left, setLeft] = useState(LAUNCH);
  const endRef = useRef(0);

  useEffect(() => {
    endRef.current = Date.now() + LAUNCH * 1000;
    const timer = setInterval(() => {
      setLeft(Math.max(0, Math.round((endRef.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const time = split(left);
  const units = [
    ['days', 'Days'],
    ['hours', 'Hours'],
    ['minutes', 'Minutes'],
    ['seconds', 'Seconds']
  ];

  return (
    <div className="cd-card cd-countdown">
      <span className="cd-countdown__title">Public beta opens in</span>
      <div className="cd-countdown__units">
        {units.map(([key, name], index) => (
          <div key={key} style={{ display: 'contents' }}>
            {index > 0 && (
              <span className="cd-countdown__colon" aria-hidden="true">
                :
              </span>
            )}
            <div className="cd-countdown__unit">
              <Counter
                {...motion}
                direction={motion.direction === 'auto' ? 'down' : motion.direction}
                value={time[key]}
                minDigits={2}
                fontSize="var(--cd-count-size)"
                fontWeight={600}
                gap={6}
                fade={0}
                textColor={color || undefined}
                digitStyle={TILE}
              />
              <span className="cd-countdown__label">{name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PricingScene = ({ motion, color }) => {
  const [yearly, setYearly] = useState(false);
  const [seats, setSeats] = useState(5);
  const perSeat = yearly ? 19 : 24;
  const total = seats * perSeat * (yearly ? 12 : 1);

  return (
    <div className="cd-card cd-pricing">
      <div className="cd-pricing__head">
        <span className="cd-pricing__plan">Team</span>
        <div className="cd-segment" role="group" aria-label="Billing period">
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>
            Monthly
          </button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>
            Yearly
          </button>
        </div>
      </div>
      <div className="cd-pricing__price">
        <Counter
          {...motion}
          value={total}
          format={USD}
          decimals={0}
          fontSize={52}
          fontWeight={600}
          textColor={color || undefined}
        />
        <span className="cd-pricing__period">{yearly ? '/ year' : '/ month'}</span>
      </div>
      <div className="cd-pricing__note">
        <Counter {...motion} value={perSeat} format={USD} decimals={0} fontSize={14} intro={false} />
        <span>&nbsp;per seat, billed {yearly ? 'yearly' : 'monthly'}</span>
      </div>
      <div className="cd-pricing__seats">
        <span>Seats</span>
        <div className="cd-stepper">
          <button
            type="button"
            className="cd-button"
            aria-label="Remove a seat"
            disabled={seats <= 1}
            onClick={() => setSeats(value => Math.max(1, value - 1))}
          >
            <HugeiconsIcon icon={MinusSignIcon} size={16} strokeWidth={2} />
          </button>
          <span className="cd-stepper__value">
            <Counter {...motion} value={seats} fontSize={17} fontWeight={600} intro={false} />
          </span>
          <button
            type="button"
            className="cd-button"
            aria-label="Add a seat"
            disabled={seats >= 99}
            onClick={() => setSeats(value => Math.min(99, value + 1))}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardScene = ({ motion, color }) => {
  const [stats, setStats] = useState({ revenue: 48203.17, active: 1284, orders: 932, conversion: 0.0342 });

  useEffect(() => {
    const timer = setInterval(() => {
      setStats(current => ({
        revenue: Math.round((current.revenue + 4 + Math.random() * 260) * 100) / 100,
        active: clamp(current.active + Math.round((Math.random() - 0.45) * 46), 960, 1980),
        orders: current.orders + (Math.random() < 0.65 ? 1 + Math.floor(Math.random() * 3) : 0),
        conversion: clamp(current.conversion + (Math.random() - 0.48) * 0.0016, 0.028, 0.046)
      }));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="cd-card cd-dashboard">
      <div className="cd-dashboard__head">
        <span>Revenue this month</span>
        <span className="cd-dashboard__live">Live</span>
      </div>
      <div className="cd-dashboard__total">
        <Counter
          {...motion}
          value={stats.revenue}
          format={USD}
          decimals={2}
          fontSize="var(--cd-total-size)"
          fontWeight={600}
          textColor={color || undefined}
        />
      </div>
      <span className="cd-dashboard__trend">12.4% more than last month</span>
      <div className="cd-dashboard__stats">
        <div className="cd-dashboard__stat">
          <span>Active now</span>
          <Counter {...motion} value={stats.active} fontSize={24} fontWeight={600} />
        </div>
        <div className="cd-dashboard__stat">
          <span>Orders</span>
          <Counter {...motion} value={stats.orders} fontSize={24} fontWeight={600} />
        </div>
        <div className="cd-dashboard__stat">
          <span>Conversion</span>
          <Counter {...motion} value={stats.conversion} format={PERCENT} decimals={2} fontSize={24} fontWeight={600} />
        </div>
      </div>
    </div>
  );
};

const BasicScene = ({ settings, formatName, color, onValue }) => {
  const { value, decimals } = settings;
  return (
    <div className="cd-basic">
      <Counter
        {...settings}
        className="cd-basic__number"
        format={FORMATS[formatName]}
        fontSize={`min(${settings.fontSize}px, 15cqw)`}
        textColor={color || undefined}
      />
      <div className="cd-basic__actions">
        <button
          type="button"
          className="cd-button"
          aria-label="Decrease"
          onClick={() => onValue(Math.max(0, value - 1))}
        >
          <HugeiconsIcon icon={MinusSignIcon} size={18} strokeWidth={2} />
        </button>
        <button type="button" className="cd-button" aria-label="Increase" onClick={() => onValue(value + 1)}>
          <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="cd-button"
          aria-label="Random value"
          onClick={() => {
            const scale = 10 ** decimals;
            onValue(Math.round(Math.random() * 99999 * scale) / scale);
          }}
        >
          <HugeiconsIcon icon={ShuffleIcon} size={18} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
};

const CounterDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { demo, textColor, formatName, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = useColorModeValue('#18181b', '#f4f4f5');
  const basic = demo === 'basic';
  const motion = {
    direction: settings.direction,
    duration: settings.duration,
    bounce: settings.bounce,
    stagger: settings.stagger,
    fade: settings.fade,
    motionBlur: settings.motionBlur,
    intro: settings.intro
  };

  const computedProps = useMemo(
    () => ({
      ...(FORMATS[formatName] ? { format: FORMATS[formatName] } : {}),
      ...(textColor ? { textColor } : {})
    }),
    [formatName, textColor]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['demo', 'textColor', 'formatName']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <div className="cd-scene" data-theme={theme} key={`${key}-${demo}`}>
              {demo === 'countdown' && <CountdownScene motion={motion} color={textColor} />}
              {demo === 'pricing' && <PricingScene motion={motion} color={textColor} />}
              {demo === 'dashboard' && <DashboardScene motion={motion} color={textColor} />}
              {basic && (
                <BasicScene
                  settings={settings}
                  formatName={formatName}
                  color={textColor}
                  onValue={value => updateProp('value', value)}
                />
              )}
            </div>
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={demo}
              onChange={value => updateProp('demo', value)}
            />
            <PreviewColorPickerCustom
              title="Text Color"
              color={textColor || ink}
              onChange={value => updateProp('textColor', value)}
            />
            <PreviewSelect
              title="Format"
              options={FORMAT_OPTIONS}
              value={formatName}
              isDisabled={!basic}
              onChange={value => updateProp('formatName', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSlider
              title="Duration"
              min={0.2}
              max={2}
              step={0.05}
              value={settings.duration}
              valueUnit="s"
              onChange={value => updateProp('duration', value)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.6}
              step={0.05}
              value={settings.bounce}
              onChange={value => updateProp('bounce', value)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.15}
              step={0.01}
              value={settings.stagger}
              valueUnit="s"
              onChange={value => updateProp('stagger', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={0.6}
              step={0.05}
              value={settings.fade}
              valueUnit="em"
              isDisabled={demo === 'countdown'}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSlider
              title="Value"
              min={0}
              max={99999}
              step={1}
              value={settings.value}
              isDisabled={!basic}
              onChange={value => updateProp('value', value)}
            />
            <PreviewSlider
              title="Font Size"
              min={24}
              max={160}
              step={1}
              value={settings.fontSize}
              valueUnit="px"
              isDisabled={!basic}
              onChange={value => updateProp('fontSize', value)}
            />
            <PreviewSlider
              title="Font Weight"
              min={300}
              max={900}
              step={100}
              value={settings.fontWeight}
              isDisabled={!basic}
              onChange={value => updateProp('fontWeight', value)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={24}
              step={1}
              value={settings.gap}
              valueUnit="px"
              isDisabled={!basic}
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Decimals"
              min={0}
              max={3}
              step={1}
              value={settings.decimals}
              isDisabled={!basic}
              onChange={value => updateProp('decimals', value)}
            />
            <PreviewSlider
              title="Min Digits"
              min={1}
              max={8}
              step={1}
              value={settings.minDigits}
              isDisabled={!basic}
              onChange={value => updateProp('minDigits', value)}
            />
            <PreviewSwitch
              title="Motion Blur"
              isChecked={settings.motionBlur}
              onChange={value => updateProp('motionBlur', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
            <PreviewSwitch
              title="Tabular"
              isChecked={settings.tabular}
              isDisabled={!basic}
              onChange={value => updateProp('tabular', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={counter} componentName="Counter" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CounterDemo;
