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
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import FlyingButton from '../../content/Micro/FlyingButton/FlyingButton';
import { flyingButton } from '../../constants/code/Micro/flyingButtonCode';

const DEFAULT_PROPS = {
  label: 'Take off',
  thrustColor: '#8ec5ff',
  smokeColor: '#eef1f6',
  buttonColor: '#27272a',
  textColor: '#f5f5f5',
  rampColor: '#25222b',
  size: 'medium',
  radius: 22,
  ramp: false,
  altitude: 170,
  hoverTime: 2.4,
  jets: 2,
  thrusters: true,
  trigger: 'hover',
  carryCursor: true,
  smoke: 1,
  turbulence: 1,
  wobble: 1
};

const LIGHT = {
  thrustColor: '#4f8cff',
  smokeColor: '#e9ebf0',
  buttonColor: '#18181b',
  textColor: '#fafafa',
  rampColor: '#ececf0'
};

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra Large' }
];

const JET_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' }
];

const TRIGGER_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' }
];

const FlyingButtonDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    label,
    thrustColor,
    smokeColor,
    buttonColor,
    textColor,
    rampColor,
    size,
    radius,
    ramp,
    altitude,
    hoverTime,
    jets,
    thrusters,
    trigger,
    carryCursor,
    smoke,
    turbulence,
    wobble
  } = props;

  const theme = useColorModeValue('light', 'dark');
  const pick = key => (props[key] === DEFAULT_PROPS[key] ? LIGHT[key] : props[key]);
  const renderedThrust = useColorModeValue(pick('thrustColor'), thrustColor);
  const renderedSmoke = useColorModeValue(pick('smokeColor'), smokeColor);
  const renderedButton = useColorModeValue(pick('buttonColor'), buttonColor);
  const renderedText = useColorModeValue(pick('textColor'), textColor);
  const renderedRamp = useColorModeValue(pick('rampColor'), rampColor);

  const propData = useMemo(
    () => [
      { name: 'children', type: 'ReactNode', default: '"Take off"', description: 'The button label.' },
      {
        name: 'onClick',
        type: '(event) => void',
        default: '-',
        description:
          'Called on click, including clicks while it is in the air. Dragging the flying button moves it instead, and it lands wherever you let go.'
      },
      {
        name: 'theme',
        type: '"dark" | "light"',
        default: '"dark"',
        description: 'Shades the smoke for a dark or a light page and picks the matching default colours.'
      },
      {
        name: 'size',
        type: '"small" | "medium" | "large" | "extra-large"',
        default: '"medium"',
        description: 'Button size. The pods, jets, flames and smoke scale with it.'
      },
      {
        name: 'radius',
        type: 'number',
        default: 'undefined',
        description: 'Corner radius in pixels. Fully rounded when unset.'
      },
      {
        name: 'altitude',
        type: 'number',
        default: '170',
        description: 'How high the button climbs, in pixels. Capped by the container height.'
      },
      {
        name: 'hoverTime',
        type: 'number',
        default: '2.4',
        description: 'Seconds it hovers at altitude before it comes back down and lands.'
      },
      {
        name: 'jets',
        type: 'number',
        default: '2',
        description: 'Number of exhaust jets under the button, from 1 to 4.'
      },
      {
        name: 'thrusters',
        type: 'boolean',
        default: 'true',
        description: 'Shows thruster pods under the button. Off, the jets fire straight out of its underside.'
      },
      {
        name: 'trigger',
        type: '"hover" | "click"',
        default: '"hover"',
        description:
          'Whether hovering or clicking starts the flight. Touch always starts it on tap. With the ramp on, a click starts the ride instead.'
      },
      {
        name: 'carryCursor',
        type: 'boolean',
        default: 'true',
        description: 'Carries the cursor up with the button while you hover it, and sets it back down on landing.'
      },
      {
        name: 'smoke',
        type: 'number',
        default: '1',
        description: 'How much smoke the jets and the ground blast put out.'
      },
      {
        name: 'turbulence',
        type: 'number',
        default: '1',
        description: 'How much the smoke curls and billows.'
      },
      {
        name: 'wobble',
        type: 'number',
        default: '1',
        description: 'Strength of the gusts the flight controller fights while it hovers. 0 flies dead steady.'
      },
      {
        name: 'ramp',
        type: 'boolean',
        default: 'false',
        description:
          'Adds a loop ramp on the right. A click drives the button up the wall and along the ceiling, then it flips off the end, lands and rolls back.'
      },
      {
        name: 'thrustColor',
        type: 'string',
        default: 'undefined',
        description: 'Colour of the jet flames and the light they cast. Defaults to a pale blue for the theme.'
      },
      {
        name: 'smokeColor',
        type: 'string',
        default: 'undefined',
        description: 'Base colour of the smoke. Its shadows are derived from it.'
      },
      {
        name: 'buttonColor',
        type: 'string',
        default: 'undefined',
        description: 'Button fill. Defaults to dark grey on dark pages and near black on light ones.'
      },
      { name: 'textColor', type: 'string', default: 'undefined', description: 'Label colour.' },
      {
        name: 'rampColor',
        type: 'string',
        default: 'undefined',
        description: 'Ramp colour. Defaults to a raised surface for the theme.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' },
      { name: 'style', type: 'CSSProperties', default: 'undefined', description: 'Inline styles for the root.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={440} overflow="hidden">
            <Box position="absolute" inset={0}>
              <FlyingButton
                theme={theme}
                thrustColor={renderedThrust}
                smokeColor={renderedSmoke}
                buttonColor={renderedButton}
                textColor={renderedText}
                rampColor={renderedRamp}
                size={size}
                radius={radius >= DEFAULT_PROPS.radius ? undefined : radius}
                ramp={ramp}
                altitude={altitude}
                hoverTime={hoverTime}
                jets={jets}
                thrusters={thrusters}
                trigger={trigger}
                carryCursor={carryCursor}
                smoke={smoke}
                turbulence={turbulence}
                wobble={wobble}
              >
                {label || 'Take off'}
              </FlyingButton>
            </Box>
          </Box>

          <Customize>
            <PreviewInput title="Label" value={label} maxLength={24} onChange={val => updateProp('label', val)} />
            <PreviewColorPickerCustom
              title="Thrust"
              color={renderedThrust}
              onChange={val => updateProp('thrustColor', val)}
            />
            <PreviewColorPickerCustom
              title="Smoke"
              color={renderedSmoke}
              onChange={val => updateProp('smokeColor', val)}
            />
            <PreviewColorPickerCustom
              title="Button"
              color={renderedButton}
              onChange={val => updateProp('buttonColor', val)}
            />
            <PreviewColorPickerCustom
              title="Text"
              color={renderedText}
              onChange={val => updateProp('textColor', val)}
            />
            <PreviewColorPickerCustom
              title="Ramp"
              color={renderedRamp}
              onChange={val => updateProp('rampColor', val)}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={size}
              onChange={val => updateProp('size', val)}
              width={140}
            />
            <PreviewSelect
              title="Jets"
              options={JET_OPTIONS}
              value={jets}
              onChange={val => updateProp('jets', Number(val))}
            />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={trigger}
              onChange={val => updateProp('trigger', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={22}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Altitude"
              min={60}
              max={260}
              step={10}
              value={altitude}
              valueUnit="px"
              onChange={val => updateProp('altitude', val)}
            />
            <PreviewSlider
              title="Hover Time"
              min={0.5}
              max={6}
              step={0.1}
              value={hoverTime}
              valueUnit="s"
              onChange={val => updateProp('hoverTime', val)}
            />
            <PreviewSlider
              title="Smoke"
              min={0.2}
              max={2}
              step={0.1}
              value={smoke}
              onChange={val => updateProp('smoke', val)}
            />
            <PreviewSlider
              title="Turbulence"
              min={0}
              max={2}
              step={0.1}
              value={turbulence}
              onChange={val => updateProp('turbulence', val)}
            />
            <PreviewSlider
              title="Wobble"
              min={0}
              max={3}
              step={0.1}
              value={wobble}
              onChange={val => updateProp('wobble', val)}
            />
            <PreviewSwitch title="Ramp" isChecked={ramp} onChange={val => updateProp('ramp', val)} />
            <PreviewSwitch title="Thrusters" isChecked={thrusters} onChange={val => updateProp('thrusters', val)} />
            <PreviewSwitch
              title="Carry Cursor"
              isChecked={carryCursor}
              onChange={val => updateProp('carryCursor', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={flyingButton} componentName="FlyingButton" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FlyingButtonDemo;
