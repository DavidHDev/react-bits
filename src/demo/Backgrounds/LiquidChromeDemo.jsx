import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';

import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';

import LiquidChrome from '../../content/Backgrounds/LiquidChrome/LiquidChrome';
import { liquidChrome } from '../../constants/code/Backgrounds/liquidChromeCode';

function rgbArrayToHex([r, g, b]) {
  const toHex = n => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgbArray(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

const DEFAULT_PROPS = {
  speed: 0.3,
  baseColor: [0.1, 0.1, 0.1],
  interactive: true,
  amplitude: 0.3
};

const LiquidChromeDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { speed, baseColor, interactive, amplitude } = props;

  const propData = useMemo(
    () => [
      {
        name: 'baseColor',
        type: 'RGB array (number[3])',
        default: '[0.1, 0.1, 0.1]',
        description: 'Base color of the component. Specify as an RGB array.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '0.2',
        description: 'Animation speed multiplier.'
      },
      {
        name: 'amplitude',
        type: 'number',
        default: '0.3',
        description: 'Amplitude of the distortion.'
      },
      {
        name: 'frequencyX',
        type: 'number',
        default: '3',
        description: 'Frequency modifier for the x distortion.'
      },
      {
        name: 'frequencyY',
        type: 'number',
        default: '3',
        description: 'Frequency modifier for the y distortion.'
      },
      {
        name: 'interactive',
        type: 'boolean',
        default: 'true',
        description: 'Enable mouse/touch interaction.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <LiquidChrome baseColor={baseColor} amplitude={amplitude} speed={speed} interactive={interactive} />

            <BackgroundContent pillText="New Background" headline="Swirl around in the deep sea of liquid chrome!" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="liquid-chrome"
              currentProps={{ speed, amplitude, interactive }}
              defaultProps={{ speed: 0.2, amplitude: 0.3, frequencyX: 3, frequencyY: 3, interactive: true }}
            />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom
              title="Base Color"
              color={rgbArrayToHex(baseColor)}
              onChange={hex => updateProp('baseColor', hexToRgbArray(hex))}
            />

            <PreviewSlider
              min={0}
              title="Speed"
              max={5}
              step={0.01}
              value={speed}
              onChange={val => updateProp('speed', val)}
            />

            <PreviewSlider
              min={0.1}
              title="Amplitude"
              max={1}
              step={0.01}
              value={amplitude}
              onChange={val => updateProp('amplitude', val)}
            />

            <PreviewSwitch
              title="Enable Interaction"
              isChecked={interactive}
              onChange={checked => updateProp('interactive', checked)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={liquidChrome} componentName="LiquidChrome" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LiquidChromeDemo;
