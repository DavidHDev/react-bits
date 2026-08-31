import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';
import { useMemo } from 'react';

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

import { lightfall } from '../../constants/code/Backgrounds/lightfallCode';
import Lightfall from '../../ts-default/Backgrounds/Lightfall/Lightfall';

const DEFAULT_PROPS = {
  color1: '#A6C8FF',
  color2: '#5227FF',
  color3: '#FF9FFC',
  backgroundColor: '#0A29FF',
  speed: 0.5,
  streakCount: 2,
  streakWidth: 1,
  streakLength: 1,
  glow: 1,
  density: 0.6,
  twinkle: 1,
  zoom: 3,
  backgroundGlow: 0.5,
  mouseInteraction: true,
  mouseStrength: 0.5,
  mouseRadius: 1
};

const LightfallDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    color1,
    color2,
    color3,
    backgroundColor,
    speed,
    streakCount,
    streakWidth,
    streakLength,
    glow,
    density,
    twinkle,
    zoom,
    backgroundGlow,
    mouseInteraction,
    mouseStrength,
    mouseRadius,
    lightMode
  } = props;

  const colors = [color1, color2, color3];

  const propData = useMemo(
    () => [
      {
        name: 'colors',
        type: 'string[]',
        default: "['#A6C8FF', '#5227FF', '#FF9FFC']",
        description:
          'Array of hex colors (up to 8) used to tint the falling light streaks. Each streak is randomly but evenly assigned one of the colors; a single color makes the whole effect uniform.'
      },
      {
        name: 'backgroundColor',
        type: 'string',
        default: "'#0A29FF'",
        description: 'Hex color of the soft ambient glow behind the streaks.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '0.5',
        description: 'Multiplier for how fast the light streaks fall.'
      },
      {
        name: 'streakCount',
        type: 'number',
        default: '2',
        description: 'Number of streak layers rendered per cell (1–16). Higher = busier.'
      },
      {
        name: 'streakWidth',
        type: 'number',
        default: '1',
        description: 'Thickness of each light streak.'
      },
      {
        name: 'streakLength',
        type: 'number',
        default: '1',
        description: 'Length of the glowing tail trailing each streak.'
      },
      {
        name: 'glow',
        type: 'number',
        default: '1',
        description: 'Overall brightness multiplier applied before tone mapping.'
      },
      {
        name: 'density',
        type: 'number',
        default: '0.6',
        description: 'Vertical frequency of streaks. Higher values pack more streaks into view.'
      },
      {
        name: 'twinkle',
        type: 'number',
        default: '1',
        description: 'Amount of per‑streak brightness flicker. 0 = constant brightness.'
      },
      {
        name: 'zoom',
        type: 'number',
        default: '3',
        description: 'Field of view into the tunnel. Higher values zoom further in.'
      },
      {
        name: 'backgroundGlow',
        type: 'number',
        default: '0.5',
        description: 'Intensity of the ambient background glow.'
      },
      {
        name: 'opacity',
        type: 'number',
        default: '1',
        description: 'Overall alpha of the rendered canvas.'
      },
      {
        name: 'mouseInteraction',
        type: 'boolean',
        default: 'true',
        description: 'Enables a soft light that follows the cursor and flares nearby streaks (no warping).'
      },
      {
        name: 'mouseStrength',
        type: 'number',
        default: '0.5',
        description: 'Intensity of the cursor light.'
      },
      {
        name: 'mouseRadius',
        type: 'number',
        default: '1',
        description: 'Falloff radius of the cursor light.'
      },
      {
        name: 'mouseDampening',
        type: 'number',
        default: '0.15',
        description: 'Easing time constant (seconds) for the cursor light to follow the pointer. 0 = immediate.'
      },
      {
        name: 'mixBlendMode',
        type: 'string',
        default: 'undefined',
        description: "CSS mix-blend-mode applied to the canvas (e.g. 'screen', 'lighten')."
      },
      {
        name: 'paused',
        type: 'boolean',
        default: 'false',
        description: 'If true, stops rendering updates (freezing the current frame).'
      },
      {
        name: 'dpr',
        type: 'number',
        default: 'window.devicePixelRatio',
        description: 'Overrides device pixel ratio; lower for performance, higher for sharpness.'
      },
      {
        name: 'className',
        type: 'string',
        default: '',
        description: 'Additional class names for the root container.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} hasChanges={hasChanges} resetProps={resetProps}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden" bg={backgroundColor}>
            <Lightfall
              colors={colors}
              backgroundColor={backgroundColor}
              speed={speed}
              streakCount={streakCount}
              streakWidth={streakWidth}
              streakLength={streakLength}
              glow={glow}
              density={density}
              twinkle={twinkle}
              zoom={zoom}
              backgroundGlow={backgroundGlow}
              mouseInteraction={mouseInteraction}
              mouseStrength={mouseStrength}
              mouseRadius={mouseRadius}
              lightMode={lightMode}
            />

            <BackgroundContent pillText="New Background" headline="Let the light rain down" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="lightfall"
              currentProps={{
                colors,
                backgroundColor,
                speed,
                streakCount,
                streakWidth,
                streakLength,
                glow,
                density,
                twinkle,
                zoom,
                backgroundGlow,
                mouseInteraction,
                mouseStrength,
                mouseRadius
              }}
              defaultProps={{
                colors: ['#A6C8FF', '#5227FF', '#FF9FFC'],
                backgroundColor: '#0A29FF',
                speed: 1,
                streakCount: 8,
                streakWidth: 1,
                streakLength: 1,
                glow: 1,
                density: 1,
                twinkle: 1,
                zoom: 2,
                backgroundGlow: 1,
                opacity: 1,
                mouseInteraction: true,
                mouseStrength: 1,
                mouseRadius: 0.6
              }}
            />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom title="Color 1" color={color1} onChange={val => updateProp('color1', val)} />
            <PreviewColorPickerCustom title="Color 2" color={color2} onChange={val => updateProp('color2', val)} />
            <PreviewColorPickerCustom title="Color 3" color={color3} onChange={val => updateProp('color3', val)} />
            <PreviewColorPickerCustom
              title="Background"
              color={backgroundColor}
              onChange={val => updateProp('backgroundColor', val)}
            />

            <PreviewSwitch
              title="Cursor Light"
              isChecked={mouseInteraction}
              onChange={val => updateProp('mouseInteraction', val)}
            />

            <PreviewSlider title="Speed" min={0} max={4} step={0.1} value={speed} onChange={v => updateProp('speed', v)} />
            <PreviewSlider
              title="Streak Count"
              min={1}
              max={16}
              step={1}
              value={streakCount}
              onChange={v => updateProp('streakCount', v)}
            />
            <PreviewSlider
              title="Streak Width"
              min={0.2}
              max={4}
              step={0.1}
              value={streakWidth}
              onChange={v => updateProp('streakWidth', v)}
            />
            <PreviewSlider
              title="Streak Length"
              min={0.3}
              max={3}
              step={0.1}
              value={streakLength}
              onChange={v => updateProp('streakLength', v)}
            />
            <PreviewSlider
              title="Density"
              min={0.3}
              max={3}
              step={0.1}
              value={density}
              onChange={v => updateProp('density', v)}
            />
            <PreviewSlider
              title="Twinkle"
              min={0}
              max={1}
              step={0.05}
              value={twinkle}
              onChange={v => updateProp('twinkle', v)}
            />
            <PreviewSlider title="Glow" min={0.2} max={3} step={0.1} value={glow} onChange={v => updateProp('glow', v)} />
            <PreviewSlider
              title="Background Glow"
              min={0}
              max={3}
              step={0.1}
              value={backgroundGlow}
              onChange={v => updateProp('backgroundGlow', v)}
            />
            <PreviewSlider title="Zoom" min={1} max={5} step={0.1} value={zoom} onChange={v => updateProp('zoom', v)} />
            <PreviewSlider
              title="Cursor Strength"
              min={0}
              max={3}
              step={0.1}
              value={mouseStrength}
              onChange={v => updateProp('mouseStrength', v)}
            />
            <PreviewSlider
              title="Cursor Radius"
              min={0.1}
              max={2}
              step={0.05}
              value={mouseRadius}
              onChange={v => updateProp('mouseRadius', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={lightfall} componentName="Lightfall" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LightfallDemo;
