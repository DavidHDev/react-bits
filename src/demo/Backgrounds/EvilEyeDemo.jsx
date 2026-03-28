import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex, Input, Text } from '@chakra-ui/react';

import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import CodeExample from '../../components/code/CodeExample';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';

import EvilEye from '../../content/Backgrounds/EvilEye/EvilEye';
import { evilEye } from '../../constants/code/Backgrounds/evilEyeCode';

const DEFAULT_PROPS = {
  eyeColor: '#FF6F37',
  intensity: 1.5,
  pupilSize: 0.6,
  irisWidth: 0.25,
  glowIntensity: 0.35,
  scale: 0.8,
  noiseScale: 1.0,
  pupilFollow: 1.0,
  flameSpeed: 1.0,
  backgroundColor: '#060010'
};

const EvilEyeDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    eyeColor,
    intensity,
    pupilSize,
    irisWidth,
    glowIntensity,
    scale,
    noiseScale,
    pupilFollow,
    flameSpeed,
    backgroundColor
  } = props;

  const propData = useMemo(
    () => [
      {
        name: 'eyeColor',
        type: 'string',
        default: '"#FF6F37"',
        description: 'Primary eye color in HEX format.'
      },
      {
        name: 'intensity',
        type: 'number',
        default: '1.5',
        description: 'Brightness / HDR intensity of the eye color.'
      },
      {
        name: 'pupilSize',
        type: 'number',
        default: '0.6',
        description: 'Size and darkness of the pupil slit.'
      },
      {
        name: 'irisWidth',
        type: 'number',
        default: '0.25',
        description: 'Width of the main iris ring.'
      },
      {
        name: 'glowIntensity',
        type: 'number',
        default: '0.35',
        description: 'Strength of the outer eye glow.'
      },
      {
        name: 'scale',
        type: 'number',
        default: '0.8',
        description: 'Zoom level of the eye. Values > 1 zoom in, < 1 zoom out.'
      },
      {
        name: 'noiseScale',
        type: 'number',
        default: '1.0',
        description: 'Scale of the fire/noise texture sampling.'
      },
      {
        name: 'pupilFollow',
        type: 'number',
        default: '1.0',
        description: 'Intensity of pupil cursor tracking. 0 disables it.'
      },
      {
        name: 'flameSpeed',
        type: 'number',
        default: '1.0',
        description: 'Independent flame flicker animation speed.'
      },
      {
        name: 'backgroundColor',
        type: 'string',
        default: '"#000000"',
        description: 'Background color in HEX format.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={600} overflow="hidden" p={0}>
            <EvilEye
              eyeColor={eyeColor}
              intensity={intensity}
              pupilSize={pupilSize}
              irisWidth={irisWidth}
              glowIntensity={glowIntensity}
              scale={scale}
              noiseScale={noiseScale}
              pupilFollow={pupilFollow}
              flameSpeed={flameSpeed}
              backgroundColor={backgroundColor}
            />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="evil-eye"
              currentProps={{
                eyeColor,
                intensity,
                pupilSize,
                irisWidth,
                glowIntensity,
                scale,
                noiseScale,
                pupilFollow,
                flameSpeed,
                backgroundColor
              }}
              defaultProps={DEFAULT_PROPS}
            />
          </Flex>

          <Customize>
            <Flex gap={4} align="center" mt={4}>
              <Text fontSize="sm">Eye Color</Text>
              <Input
                type="color"
                value={eyeColor}
                onChange={e => {
                  updateProp('eyeColor', e.target.value);
                }}
                width="50px"
              />

              <Text fontSize="sm">Background</Text>
              <Input
                type="color"
                value={backgroundColor}
                onChange={e => {
                  updateProp('backgroundColor', e.target.value);
                }}
                width="50px"
              />
            </Flex>

            <PreviewSlider
              min={0.5}
              max={5}
              step={0.1}
              title="Intensity"
              value={intensity}
              onChange={val => {
                updateProp('intensity', val);
              }}
            />

            <PreviewSlider
              min={0.1}
              max={2}
              step={0.05}
              title="Pupil Size"
              value={pupilSize}
              onChange={val => {
                updateProp('pupilSize', val);
              }}
            />

            <PreviewSlider
              min={0.1}
              max={0.8}
              step={0.05}
              title="Iris Width"
              value={irisWidth}
              onChange={val => {
                updateProp('irisWidth', val);
              }}
            />

            <PreviewSlider
              min={0}
              max={1.5}
              step={0.05}
              title="Glow Intensity"
              value={glowIntensity}
              onChange={val => {
                updateProp('glowIntensity', val);
              }}
            />

            <PreviewSlider
              min={0.2}
              max={3}
              step={0.1}
              title="Scale"
              value={scale}
              onChange={val => {
                updateProp('scale', val);
              }}
            />

            <PreviewSlider
              min={0.1}
              max={3}
              step={0.1}
              title="Noise Scale"
              value={noiseScale}
              onChange={val => {
                updateProp('noiseScale', val);
              }}
            />

            <PreviewSlider
              min={0}
              max={2}
              step={0.1}
              title="Pupil Follow"
              value={pupilFollow}
              onChange={val => {
                updateProp('pupilFollow', val);
              }}
            />

            <PreviewSlider
              min={0.1}
              max={5}
              step={0.1}
              title="Flame Speed"
              value={flameSpeed}
              onChange={val => {
                updateProp('flameSpeed', val);
              }}
            />
          </Customize>
          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={evilEye} componentName="EvilEye" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default EvilEyeDemo;
