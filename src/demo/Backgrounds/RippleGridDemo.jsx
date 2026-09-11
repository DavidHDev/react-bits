import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';

import { rippleGrid } from '../../constants/code/Backgrounds/rippleGridCode';
import RippleGrid from '../../content/Backgrounds/RippleGrid/RippleGrid';

const DEFAULT_PROPS = {
  enableRainbow: false,
  gridColor: '#5227FF',
  rippleIntensity: 0.05,
  gridSize: 10.0,
  gridThickness: 15.0,
  fadeDistance: 1.5,
  vignetteStrength: 2.0,
  glowIntensity: 0.1,
  opacity: 1.0,
  gridRotation: 0,
  mouseInteraction: true,
  mouseInteractionRadius: 0.8
};

const RippleGridDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    enableRainbow,
    gridColor,
    rippleIntensity,
    gridSize,
    gridThickness,
    fadeDistance,
    vignetteStrength,
    glowIntensity,
    opacity,
    gridRotation,
    mouseInteraction,
    mouseInteractionRadius
  } = props;

  const propData = useMemo(
    () => [
      {
        name: 'enableRainbow',
        type: 'boolean',
        default: 'false',
        description: 'Enables rainbow color cycling animation for the grid.'
      },
      {
        name: 'gridColor',
        type: 'string',
        default: "'#ffffff'",
        description: 'Color of the grid when rainbow mode is disabled.'
      },
      {
        name: 'rippleIntensity',
        type: 'number',
        default: '0.05',
        description: 'Controls the intensity of the ripple effect from the center.'
      },
      {
        name: 'gridSize',
        type: 'number',
        default: '10.0',
        description: 'Controls the density/size of the grid pattern.'
      },
      {
        name: 'gridThickness',
        type: 'number',
        default: '15.0',
        description: 'Controls the thickness of the grid lines.'
      },
      {
        name: 'fadeDistance',
        type: 'number',
        default: '1.5',
        description: 'Controls how far the fade effect extends from the center.'
      },
      {
        name: 'vignetteStrength',
        type: 'number',
        default: '2.0',
        description: 'Controls the intensity of the vignette (edge darkening) effect.'
      },
      {
        name: 'glowIntensity',
        type: 'number',
        default: '0.1',
        description: 'Adds a glow effect to the grid lines.'
      },
      {
        name: 'opacity',
        type: 'number',
        default: '1.0',
        description: 'Overall opacity of the entire effect.'
      },
      {
        name: 'gridRotation',
        type: 'number',
        default: '0',
        description: 'Rotate the entire grid pattern by degrees.'
      },
      {
        name: 'mouseInteraction',
        type: 'boolean',
        default: 'true',
        description: 'Enable mouse/touch interaction to create ripples.'
      },
      {
        name: 'mouseInteractionRadius',
        type: 'number',
        default: '1',
        description: 'Controls the radius of the mouse interaction effect.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} overflow="hidden">
            <RippleGrid
              enableRainbow={enableRainbow}
              gridColor={gridColor}
              rippleIntensity={rippleIntensity}
              gridSize={gridSize}
              gridThickness={gridThickness}
              fadeDistance={fadeDistance}
              vignetteStrength={vignetteStrength}
              glowIntensity={glowIntensity}
              opacity={opacity}
              gridRotation={gridRotation}
              mouseInteraction={mouseInteraction}
              mouseInteractionRadius={mouseInteractionRadius}
            />

            {/* For Demo Purposes Only */}
            <BackgroundContent pillText="New Background" headline="Retro yet futuristic, this is Ripple Grid!" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="ripple-grid"
              currentProps={{
                enableRainbow,
                gridColor,
                rippleIntensity,
                gridSize,
                gridThickness,
                fadeDistance,
                vignetteStrength,
                glowIntensity,
                opacity,
                gridRotation,
                mouseInteraction,
                mouseInteractionRadius
              }}
              defaultProps={{
                enableRainbow: false,
                gridColor: '#ffffff',
                rippleIntensity: 0.05,
                gridSize: 10,
                gridThickness: 15,
                fadeDistance: 1.5,
                vignetteStrength: 2,
                glowIntensity: 0.1,
                opacity: 1,
                gridRotation: 0,
                mouseInteraction: true,
                mouseInteractionRadius: 1
              }}
            />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom title="Grid Color" color={gridColor} onChange={val => updateProp('gridColor', val)} />

            <PreviewSlider
              title="Ripple Intensity"
              min={0}
              max={0.3}
              step={0.01}
              value={rippleIntensity}
              onChange={val => updateProp('rippleIntensity', val)}
            />

            <PreviewSlider
              title="Grid Size"
              min={5}
              max={30}
              step={1}
              value={gridSize}
              onChange={val => updateProp('gridSize', val)}
            />

            <PreviewSlider
              title="Grid Thickness"
              min={5}
              max={50}
              step={1}
              value={gridThickness}
              onChange={val => updateProp('gridThickness', val)}
            />

            <PreviewSlider
              title="Fade Distance"
              min={0.5}
              max={3}
              step={0.1}
              value={fadeDistance}
              onChange={val => updateProp('fadeDistance', val)}
            />

            <PreviewSlider
              title="Vignette Strength"
              min={0.5}
              max={5}
              step={0.1}
              value={vignetteStrength}
              onChange={val => updateProp('vignetteStrength', val)}
            />

            <PreviewSlider
              title="Glow Intensity"
              min={0}
              max={1}
              step={0.05}
              value={glowIntensity}
              onChange={val => updateProp('glowIntensity', val)}
            />

            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={opacity}
              onChange={val => updateProp('opacity', val)}
            />

            <PreviewSlider
              title="Grid Rotation"
              min={0}
              max={360}
              step={1}
              value={gridRotation}
              onChange={val => updateProp('gridRotation', val)}
              valueUnit="°"
            />

            <PreviewSlider
              title="Mouse Interaction Radius"
              min={0.2}
              max={2}
              step={0.1}
              value={mouseInteractionRadius}
              onChange={val => updateProp('mouseInteractionRadius', val)}
            />

            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={mouseInteraction}
              onChange={val => updateProp('mouseInteraction', val)}
            />

            <PreviewSwitch
              title="Enable Rainbow"
              isChecked={enableRainbow}
              onChange={val => updateProp('enableRainbow', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={rippleGrid} componentName="RippleGrid" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default RippleGridDemo;
