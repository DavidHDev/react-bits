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
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import SquishSwitch from '../../content/Micro/SquishSwitch/SquishSwitch';
import { squishSwitch } from '../../constants/code/Micro/squishSwitchCode';

const DEFAULT_PROPS = {
  disabled: false,
  trackColor: '#3f3f46',
  trackOnColor: '#f5f5f5',
  thumbColor: '#525355',
  thumbOnColor: '#3f3f46',
  width: 76,
  height: 38,
  radius: 19,
  speed: 50,
  stretch: 36,
  hoverScale: 1.035,
  colorDuration: 320
};

const LIGHT = { trackColor: '#d4d4d8', trackOnColor: '#18181b', thumbColor: '#b0b0b3', thumbOnColor: '#d4d4d8' };

const SquishSwitchDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    disabled,
    trackColor,
    trackOnColor,
    thumbColor,
    thumbOnColor,
    width,
    height,
    radius,
    speed,
    stretch,
    hoverScale,
    colorDuration
  } = props;
  const [checked, setChecked] = useState(false);

  const light = key => (props[key] === DEFAULT_PROPS[key] ? LIGHT[key] : props[key]);
  const renderedTrack = useColorModeValue(light('trackColor'), trackColor);
  const renderedTrackOn = useColorModeValue(light('trackOnColor'), trackOnColor);
  const renderedThumb = useColorModeValue(light('thumbColor'), thumbColor);
  const renderedThumbOn = useColorModeValue(light('thumbOnColor'), thumbOnColor);

  const propData = useMemo(
    () => [
      {
        name: 'checked',
        type: 'boolean',
        default: 'undefined',
        description: 'Controlled state. Leave it out to let the switch keep its own.'
      },
      { name: 'defaultChecked', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
      {
        name: 'onChange',
        type: '(checked: boolean) => void',
        default: '-',
        description: 'A tap, a drag past the middle, or a key.'
      },
      { name: 'label', type: 'string', default: '""', description: 'A label beside the switch, wired to it.' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dimmed and inert.' },
      { name: 'trackColor', type: 'string', default: '"#3f3f46"', description: 'The track while off.' },
      { name: 'trackOnColor', type: 'string', default: '"#f5f5f5"', description: 'The track while on.' },
      {
        name: 'thumbColor',
        type: 'string',
        default: '""',
        description: 'The thumb while off. Empty mixes the on colour faintly into the track.'
      },
      {
        name: 'thumbOnColor',
        type: 'string',
        default: '""',
        description: 'The thumb while on. Empty uses the off track colour.'
      },
      { name: 'width', type: 'number', default: '76', description: 'Track width in px.' },
      {
        name: 'height',
        type: 'number',
        default: '38',
        description: 'Track height in px. The thumb and its inset follow.'
      },
      {
        name: 'radius',
        type: 'number',
        default: '19',
        description: 'Track corner radius in px, capped at half the height.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '50',
        description: 'Stiffness of the settle spring, 0 to 100. Low is lazy, high is snappy.'
      },
      {
        name: 'stretch',
        type: 'number',
        default: '36',
        description: 'How much the thumb lengthens with speed, 0 to 100. It narrows to keep its area.'
      },
      { name: 'hoverScale', type: 'number', default: '1.035', description: 'The thumb swells to this on hover.' },
      { name: 'colorDuration', type: 'number', default: '320', description: 'The colour cross-fade, in ms.' },
      { name: 'ariaLabel', type: 'string', default: '-', description: 'Accessible name when there is no label.' },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root element.' },
      { name: 'id', type: 'string', default: '-', description: 'Id for the switch button; the label uses it.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow="hidden">
            <SquishSwitch
              checked={checked}
              onChange={setChecked}
              label="Airplane mode"
              disabled={disabled}
              trackColor={renderedTrack}
              trackOnColor={renderedTrackOn}
              thumbColor={renderedThumb}
              thumbOnColor={renderedThumbOn}
              width={width}
              height={height}
              radius={radius}
              speed={speed}
              stretch={stretch}
              hoverScale={hoverScale}
              colorDuration={colorDuration}
            />
          </Box>

          <Customize>
            <PreviewSwitch title="Checked" isChecked={checked} onChange={setChecked} />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
            <PreviewColorPickerCustom
              title="Track"
              color={renderedTrack}
              onChange={val => updateProp('trackColor', val)}
            />
            <PreviewColorPickerCustom
              title="Track On"
              color={renderedTrackOn}
              onChange={val => updateProp('trackOnColor', val)}
            />
            <PreviewColorPickerCustom
              title="Thumb"
              color={renderedThumb}
              onChange={val => updateProp('thumbColor', val)}
            />
            <PreviewColorPickerCustom
              title="Thumb On"
              color={renderedThumbOn}
              onChange={val => updateProp('thumbOnColor', val)}
            />
            <PreviewSlider
              title="Width"
              min={44}
              max={120}
              step={2}
              value={width}
              valueUnit="px"
              onChange={val => updateProp('width', val)}
            />
            <PreviewSlider
              title="Height"
              min={24}
              max={64}
              step={2}
              value={height}
              valueUnit="px"
              onChange={val => updateProp('height', val)}
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
              title="Speed"
              min={0}
              max={100}
              step={5}
              value={speed}
              onChange={val => updateProp('speed', val)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={100}
              step={2}
              value={stretch}
              onChange={val => updateProp('stretch', val)}
            />
            <PreviewSlider
              title="Hover Scale"
              min={1}
              max={1.1}
              step={0.005}
              value={hoverScale}
              onChange={val => updateProp('hoverScale', val)}
            />
            <PreviewSlider
              title="Color Fade"
              min={0}
              max={800}
              step={20}
              value={colorDuration}
              valueUnit="ms"
              onChange={val => updateProp('colorDuration', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={squishSwitch} componentName="SquishSwitch" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SquishSwitchDemo;
