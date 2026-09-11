import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import useThemedProps from '../../hooks/useThemedProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import { faultyTerminal } from '../../constants/code/Backgrounds/faultyTerminalCode';
import FaultyTerminal from '../../content/Backgrounds/FaultyTerminal/FaultyTerminal';

const DEFAULT_PROPS = {
  scale: 1.5,
  digitSize: 1.2,
  timeScale: 0.5,
  scanlineIntensity: 0.5,
  curvature: 0.1,
  tint: '#A7EF9E',
  mouseReact: true,
  mouseStrength: 0.5,
  pageLoadAnimation: true,
  noiseAmp: 1,
  brightness: 0.6
};

const FaultyTerminalDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const themedProps = useThemedProps(props, DEFAULT_PROPS, {
    lightMode: true,
    tint: '#4f46e5',
    brightness: 0.8,
    scanlineIntensity: 0.18
  });
  const {
    scale,
    digitSize,
    timeScale,
    scanlineIntensity,
    curvature,
    tint,
    mouseReact,
    mouseStrength,
    pageLoadAnimation,
    noiseAmp,
    brightness,
    lightMode
  } = themedProps;
  const [key, forceRerender] = useForceRerender();

  const handleChange = propName => value => {
    updateProp(propName, value);
    forceRerender();
  };

  const propData = useMemo(
    () => [
      {
        name: 'scale',
        type: 'number',
        default: '1',
        description: 'Controls the zoom/scale of the pattern.'
      },
      {
        name: 'gridMul',
        type: 'Vec2',
        default: '[2, 1]',
        description: 'Grid multiplier for glyph density [x, y].'
      },
      {
        name: 'digitSize',
        type: 'number',
        default: '1.5',
        description: 'Size of individual glyphs.'
      },
      {
        name: 'timeScale',
        type: 'number',
        default: '0.3',
        description: 'Animation speed multiplier.'
      },
      {
        name: 'pause',
        type: 'boolean',
        default: 'false',
        description: 'Pause/resume animation.'
      },
      {
        name: 'scanlineIntensity',
        type: 'number',
        default: '0.3',
        description: 'Strength of scanline effects.'
      },
      {
        name: 'glitchAmount',
        type: 'number',
        default: '1',
        description: 'Glitch displacement intensity.'
      },
      {
        name: 'flickerAmount',
        type: 'number',
        default: '1',
        description: 'Flicker effect strength.'
      },
      {
        name: 'noiseAmp',
        type: 'number',
        default: '1',
        description: 'Noise pattern amplitude.'
      },
      {
        name: 'chromaticAberration',
        type: 'number',
        default: '0',
        description: 'RGB channel separation in pixels.'
      },
      {
        name: 'dither',
        type: 'number | boolean',
        default: '0',
        description: 'Dithering effect intensity.'
      },
      {
        name: 'curvature',
        type: 'number',
        default: '0.2',
        description: 'Barrel distortion amount.'
      },
      {
        name: 'tint',
        type: 'string',
        default: "'#ffffff'",
        description: 'Color tint (hex).'
      },
      {
        name: 'mouseReact',
        type: 'boolean',
        default: 'true',
        description: 'Enable/disable mouse interaction.'
      },
      {
        name: 'mouseStrength',
        type: 'number',
        default: '0.2',
        description: 'Mouse interaction intensity.'
      },
      {
        name: 'pageLoadAnimation',
        type: 'boolean',
        default: 'true',
        description: 'Enable fade-in animation on load.'
      },
      {
        name: 'brightness',
        type: 'number',
        default: '1',
        description: 'Overall opacity/brightness control.'
      },
      {
        name: 'className',
        type: 'string',
        default: "''",
        description: 'Additional CSS classes.'
      },
      {
        name: 'style',
        type: 'React.CSSProperties',
        default: '{}',
        description: 'Inline styles.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <FaultyTerminal
              key={key}
              scale={scale}
              digitSize={digitSize}
              timeScale={timeScale}
              scanlineIntensity={scanlineIntensity}
              curvature={curvature}
              tint={tint}
              mouseReact={mouseReact}
              mouseStrength={mouseStrength}
              pageLoadAnimation={pageLoadAnimation}
              noiseAmp={noiseAmp}
              brightness={brightness}
              lightMode={lightMode}
            />

            <BackgroundContent pillText="New Background" headline="It works on my machine, please check again" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="faulty-terminal"
              currentProps={{
                scale,
                digitSize,
                scanlineIntensity,
                curvature,
                tint,
                mouseReact,
                mouseStrength,
                noiseAmp,
                brightness
              }}
              defaultProps={{
                scale: 1,
                digitSize: 1.5,
                scanlineIntensity: 0.3,
                glitchAmount: 1,
                flickerAmount: 1,
                noiseAmp: 0,
                chromaticAberration: 0,
                dither: 0,
                curvature: 0.2,
                tint: '#ffffff',
                mouseReact: true,
                mouseStrength: 0.2,
                brightness: 1
              }}
            />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom title="Tint Color" color={tint} onChange={val => handleChange('tint')(val)} />

            <PreviewSlider title="Scale" min={1} max={3} step={0.1} value={scale} onChange={handleChange('scale')} />

            <PreviewSlider
              title="Digit Size"
              min={0.5}
              max={3}
              step={0.1}
              value={digitSize}
              onChange={handleChange('digitSize')}
            />

            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.1}
              value={timeScale}
              onChange={handleChange('timeScale')}
            />

            <PreviewSlider
              title="Noise Amplitude"
              min={0.5}
              max={1}
              step={0.1}
              value={noiseAmp}
              onChange={handleChange('noiseAmp')}
            />

            <PreviewSlider
              title="Brightness"
              min={0.1}
              max={1}
              step={0.1}
              value={brightness}
              onChange={handleChange('brightness')}
            />

            <PreviewSlider
              title="Scanline Intensity"
              min={0}
              max={2}
              step={0.1}
              value={scanlineIntensity}
              onChange={handleChange('scanlineIntensity')}
            />

            <PreviewSlider
              title="Curvature"
              min={0}
              max={0.5}
              step={0.01}
              value={curvature}
              onChange={handleChange('curvature')}
            />

            <PreviewSlider
              title="Mouse Strength"
              min={0}
              max={2}
              step={0.1}
              value={mouseStrength}
              onChange={handleChange('mouseStrength')}
            />

            <PreviewSwitch title="Mouse React" isChecked={mouseReact} onChange={handleChange('mouseReact')} />

            <PreviewSwitch
              title="Page Load Animation"
              isChecked={pageLoadAnimation}
              onChange={handleChange('pageLoadAnimation')}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={faultyTerminal} componentName="FaultyTerminal" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FaultyTerminalDemo;
