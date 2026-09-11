import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';

import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';

import Iridescence from '../../content/Backgrounds/Iridescence/Iridescence';
import { iridescence } from '../../constants/code/Backgrounds/iridescenceCode';

function rgbArrayToHex([r, g, b]) {
  const toHex = n => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgbArray(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

const DEFAULT_PROPS = {
  color: [0.5, 0.6, 0.8],
  speed: 1,
  mouseReact: true
};

const IridescenceDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { color, speed, mouseReact } = props;

  const [key, forceRerender] = useForceRerender();

  const propData = useMemo(
    () => [
      {
        name: 'color',
        type: 'Array<number>',
        default: '[0.3, 0.2, 0.5]',
        description: 'Base color as an array of RGB values (each between 0 and 1).'
      },
      {
        name: 'speed',
        type: 'number',
        default: '1.0',
        description: 'Speed multiplier for the animation.'
      },
      {
        name: 'amplitude',
        type: 'number',
        default: '0.1',
        description: 'Amplitude for the mouse-driven effect.'
      },
      {
        name: 'mouseReact',
        type: 'boolean',
        default: 'true',
        description: 'Enable or disable mouse interaction with the shader.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <Iridescence key={key} speed={speed} color={color} mouseReact={mouseReact} />

            {/* For Demo Purposes Only */}
            <BackgroundContent pillText="New Background" headline="Radiant iridescence with customizable colors" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="iridescence"
              currentProps={{ speed, mouseReact }}
              defaultProps={{ speed: 1.0, amplitude: 0.1, mouseReact: true }}
            />
          </Flex>

          <Customize className="preview-options">
            <PreviewColorPickerCustom
              title="Color"
              color={rgbArrayToHex(color)}
              onChange={hex => updateProp('color', hexToRgbArray(hex))}
            />

            <PreviewSlider
              min={0}
              max={2}
              title="Speed"
              step={0.1}
              value={speed}
              onChange={val => {
                updateProp('speed', val);
                forceRerender();
              }}
            />

            <PreviewSwitch
              title="Enable Mouse Interaction"
              isChecked={mouseReact}
              onChange={checked => {
                updateProp('mouseReact', checked);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={iridescence} componentName="Iridescence" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default IridescenceDemo;
