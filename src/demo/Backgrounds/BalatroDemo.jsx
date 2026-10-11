import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';

import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import CodeExample from '../../components/code/CodeExample';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import Balatro from '../../content/Backgrounds/Balatro/Balatro';
import { balatro } from '../../constants/code/Backgrounds/balatroCode';

const DEFAULT_PROPS = {
  color1: '#DE443B',
  color2: '#006BB4',
  color3: '#162325',
  isRotate: false,
  mouseInteraction: true,
  pixelFilter: 745.0
};

const BalatroDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { color1, color2, color3, isRotate, mouseInteraction, pixelFilter } = props;

  const propData = useMemo(
    () => [
      {
        name: 'spinRotation',
        type: 'number',
        default: '-2.0',
        description: 'Base rotation amount affecting the shader effect.'
      },
      {
        name: 'spinSpeed',
        type: 'number',
        default: '7.0',
        description: 'Speed of the spin animation.'
      },
      {
        name: 'offset',
        type: '[number, number]',
        default: '[0.0, 0.0]',
        description: 'Offset for the shader effect.'
      },
      {
        name: 'color1',
        type: 'string',
        default: '"#DE443B"',
        description: 'Primary color in HEX format.'
      },
      {
        name: 'color2',
        type: 'string',
        default: '"#006BB4"',
        description: 'Secondary color in HEX format.'
      },
      {
        name: 'color3',
        type: 'string',
        default: '"#162325"',
        description: 'Tertiary color in HEX format.'
      },
      {
        name: 'contrast',
        type: 'number',
        default: '3.5',
        description: 'Contrast value affecting color blending.'
      },
      {
        name: 'lighting',
        type: 'number',
        default: '0.4',
        description: 'Lighting factor affecting brightness.'
      },
      {
        name: 'spinAmount',
        type: 'number',
        default: '0.25',
        description: 'Amount of spin influence based on UV length.'
      },
      {
        name: 'pixelFilter',
        type: 'number',
        default: '745.0',
        description: 'Pixel filter factor determining pixelation.'
      },
      {
        name: 'spinEase',
        type: 'number',
        default: '1.0',
        description: 'Ease factor for spin.'
      },
      {
        name: 'isRotate',
        type: 'boolean',
        default: 'false',
        description: 'Determines if the shader rotates continuously.'
      },
      {
        name: 'mouseInteraction',
        type: 'boolean',
        default: 'true',
        description: 'Enables or disables mouse interaction for rotation.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} overflow="hidden" p={0}>
            <Balatro
              color1={color1}
              color2={color2}
              color3={color3}
              isRotate={isRotate}
              mouseInteraction={mouseInteraction}
              pixelFilter={pixelFilter}
            />
            <BackgroundContent headline="Swirling psychedelic colors, dealt straight from the deck." />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="balatro"
              currentProps={{
                color1,
                color2,
                color3,
                isRotate,
                mouseInteraction,
                pixelFilter
              }}
              defaultProps={{
                spinRotation: -2.0,
                spinSpeed: 7.0,
                color1: '#DE443B',
                color2: '#006BB4',
                color3: '#162325',
                contrast: 3.5,
                lighting: 0.4,
                spinAmount: 0.25,
                pixelFilter: 700
              }}
            />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom title="Color 1" color={color1} onChange={val => updateProp('color1', val)} />
            <PreviewColorPickerCustom title="Color 3" color={color3} onChange={val => updateProp('color3', val)} />
            <PreviewColorPickerCustom title="Color 2" color={color2} onChange={val => updateProp('color2', val)} />

            <PreviewSlider
              min={0}
              max={2000}
              step={10}
              title="Pixelation"
              value={pixelFilter}
              onChange={val => {
                updateProp('pixelFilter', val);
              }}
            />

            <PreviewSwitch
              title="Enable Mouse Interaction"
              isChecked={mouseInteraction}
              onChange={checked => {
                updateProp('mouseInteraction', checked);
              }}
            />

            <PreviewSwitch
              title="Rotate"
              isChecked={isRotate}
              onChange={checked => {
                updateProp('isRotate', checked);
              }}
            />
          </Customize>
          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={balatro} componentName="Balatro" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default BalatroDemo;
