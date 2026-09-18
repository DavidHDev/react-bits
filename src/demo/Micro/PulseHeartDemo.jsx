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

import PulseHeart from '../../content/Micro/PulseHeart/PulseHeart';
import { pulseHeart } from '../../constants/code/Micro/pulseHeartCode';

const DEFAULT_PROPS = {
  count: 1204,
  showCount: true,
  icon: 'heart',
  idleOutline: true,
  likedColor: '#ff4d6d',
  idleColor: '#8b8b93',
  pillColor: '#232326',
  textColor: '#f5f5f5',
  size: 40,
  corner: 32,
  duration: 560,
  dotSize: 0.3,
  overshoot: 1.7,
  beat: 3,
  rollDuration: 350,
  disabled: false
};

const ICON_OPTIONS = [
  { value: 'heart', label: 'Heart' },
  { value: 'star', label: 'Star' },
  { value: 'thumb', label: 'Thumb' }
];

const PulseHeartDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    count,
    showCount,
    icon,
    idleOutline,
    likedColor,
    idleColor,
    pillColor,
    textColor,
    size,
    corner,
    duration,
    dotSize,
    overshoot,
    beat,
    rollDuration,
    disabled
  } = props;

  const renderedIdle = useColorModeValue(idleColor === DEFAULT_PROPS.idleColor ? '#71717a' : idleColor, idleColor);
  const renderedPill = useColorModeValue(pillColor === DEFAULT_PROPS.pillColor ? '#f0f0f2' : pillColor, pillColor);
  const renderedText = useColorModeValue(textColor === DEFAULT_PROPS.textColor ? '#18181b' : textColor, textColor);

  const propData = useMemo(
    () => [
      {
        name: 'liked',
        type: 'boolean',
        default: 'undefined',
        description: 'Controlled state. Changes from outside land without a run.'
      },
      { name: 'defaultLiked', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
      {
        name: 'count',
        type: 'number',
        default: '0',
        description:
          'The number shown; a press adds or removes one. Rolls one glyph per press. For a multi-digit odometer with places and decimals, use Counter.'
      },
      {
        name: 'onChange',
        type: '(liked: boolean, count: number) => void',
        default: '-',
        description: 'Called on every press with the new state and count.'
      },
      {
        name: 'showCount',
        type: 'boolean',
        default: 'true',
        description: 'Shows the count; off collapses the pill to a circle.'
      },
      {
        name: 'icon',
        type: '"heart" | "star" | "thumb" | ReactNode',
        default: '"heart"',
        description: 'Built-in glyph, or a custom element.'
      },
      {
        name: 'idleOutline',
        type: 'boolean',
        default: 'true',
        description: 'Draws the idle glyph as an outline. Off draws it as a muted solid.'
      },
      {
        name: 'size',
        type: 'number',
        default: '40',
        description: 'Glyph size in pixels; padding, gap and count size derive from it.'
      },
      { name: 'corner', type: 'number', default: '32', description: 'Pill corner radius in pixels.' },
      {
        name: 'likedColor',
        type: 'string',
        default: '"#ff4d6d"',
        description: 'Colour after the flip, and of the hover tint and focus ring.'
      },
      { name: 'idleColor', type: 'string', default: '"#8b8b93"', description: 'Colour before the flip.' },
      {
        name: 'pillColor',
        type: 'string',
        default: '"#232326"',
        description: 'Background of the pill that beats under the glyph.'
      },
      { name: 'textColor', type: 'string', default: '"#f5f5f5"', description: 'Colour of the count.' },
      {
        name: 'duration',
        type: 'number',
        default: '560',
        description: 'Length of the whole run in milliseconds; the flip is always at 40% of it.'
      },
      {
        name: 'dotSize',
        type: 'number',
        default: '0.3',
        description: 'How small the glyph gets at the flip, as a fraction of its size.'
      },
      {
        name: 'overshoot',
        type: 'number',
        default: '1.7',
        description: 'How far the glyph rebounds past rest on the way back. 0 lands without a rebound.'
      },
      { name: 'beat', type: 'number', default: '3', description: 'Percent the pill dips at the flip.' },
      {
        name: 'rollDuration',
        type: 'number',
        default: '350',
        description: 'How long the changed glyph of the count takes to roll, in milliseconds.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the button and ignores input.' },
      {
        name: 'label',
        type: 'string',
        default: '"Like"',
        description: 'Accessible name; the count is appended to it.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the button.' }
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
            <PulseHeart
              count={count}
              showCount={showCount}
              icon={icon}
              idleOutline={idleOutline}
              likedColor={likedColor}
              idleColor={renderedIdle}
              pillColor={renderedPill}
              textColor={renderedText}
              size={size}
              corner={corner}
              duration={duration}
              dotSize={dotSize}
              overshoot={overshoot}
              beat={beat}
              rollDuration={rollDuration}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewSlider
              title="Count"
              min={0}
              max={2000}
              step={1}
              value={count}
              onChange={val => updateProp('count', val)}
            />
            <PreviewSwitch title="Show Count" isChecked={showCount} onChange={val => updateProp('showCount', val)} />
            <PreviewSelect
              title="Icon"
              options={ICON_OPTIONS}
              value={icon}
              onChange={val => updateProp('icon', val)}
              width={120}
            />
            <PreviewSwitch
              title="Idle Outline"
              isChecked={idleOutline}
              onChange={val => updateProp('idleOutline', val)}
            />
            <PreviewColorPickerCustom
              title="Liked"
              color={likedColor}
              onChange={val => updateProp('likedColor', val)}
            />
            <PreviewColorPickerCustom
              title="Idle"
              color={renderedIdle}
              onChange={val => updateProp('idleColor', val)}
            />
            <PreviewColorPickerCustom
              title="Pill"
              color={renderedPill}
              onChange={val => updateProp('pillColor', val)}
            />
            <PreviewColorPickerCustom
              title="Text"
              color={renderedText}
              onChange={val => updateProp('textColor', val)}
            />
            <PreviewSlider
              title="Size"
              min={24}
              max={64}
              step={2}
              value={size}
              valueUnit="px"
              onChange={val => updateProp('size', val)}
            />
            <PreviewSlider
              title="Corner"
              min={6}
              max={40}
              step={1}
              value={corner}
              valueUnit="px"
              onChange={val => updateProp('corner', val)}
            />
            <PreviewSlider
              title="Duration"
              min={300}
              max={900}
              step={20}
              value={duration}
              valueUnit="ms"
              onChange={val => updateProp('duration', val)}
            />
            <PreviewSlider
              title="Dot Size"
              min={0.15}
              max={0.6}
              step={0.05}
              value={dotSize}
              onChange={val => updateProp('dotSize', val)}
            />
            <PreviewSlider
              title="Overshoot"
              min={0}
              max={3}
              step={0.1}
              value={overshoot}
              onChange={val => updateProp('overshoot', val)}
            />
            <PreviewSlider
              title="Beat"
              min={2}
              max={4}
              step={0.25}
              value={beat}
              valueUnit="%"
              onChange={val => updateProp('beat', val)}
            />
            <PreviewSlider
              title="Roll"
              min={150}
              max={600}
              step={10}
              value={rollDuration}
              valueUnit="ms"
              onChange={val => updateProp('rollDuration', val)}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={pulseHeart} componentName="PulseHeart" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PulseHeartDemo;
