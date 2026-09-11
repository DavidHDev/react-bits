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
import BackgroundContent from '@/components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';

import FloatingLines from '@/content/Backgrounds/FloatingLines/FloatingLines';
import { floatingLines } from '../../constants/code/Backgrounds/floatingLinesCode';

const DEFAULT_PROPS = {
  enabledWaves: ['top', 'middle', 'bottom'],
  lineCount: 8,
  lineDistance: 8,
  animationSpeed: 1,
  interactive: true,
  bendRadius: 8,
  bendStrength: -2,
  gradientStart: '#e945f5',
  gradientMid: '#6f6f6f',
  gradientEnd: '#6a6a6a'
};

const FloatingLinesDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { enabledWaves, lineCount, lineDistance, animationSpeed, interactive, bendRadius, bendStrength, gradientStart, gradientMid, gradientEnd, backgroundColor, lightMode } = props;

  const toggleWave = wave => {
    updateProp(
      'enabledWaves',
      enabledWaves.includes(wave) ? enabledWaves.filter(w => w !== wave) : [...enabledWaves, wave]
    );
  };

  const propData = useMemo(
    () => [
      {
        name: 'linesGradient',
        type: 'string[]',
        default: 'undefined',
        description: 'Array of hex color strings for gradient coloring of lines (max 8 colors).'
      },
      {
        name: 'enabledWaves',
        type: "Array<'top' | 'middle' | 'bottom'>",
        default: "['top', 'middle', 'bottom']",
        description: 'Which wave layers to display. Can toggle individual waves on/off.'
      },
      {
        name: 'lineCount',
        type: 'number | number[]',
        default: '[6]',
        description: 'Number of lines per wave. Single number applies to all waves, or array for per-wave control.'
      },
      {
        name: 'lineDistance',
        type: 'number | number[]',
        default: '[5]',
        description: 'Spacing between lines. Single number applies to all waves, or array for per-wave control.'
      },
      {
        name: 'topWavePosition',
        type: '{ x: number; y: number; rotate: number }',
        default: 'undefined',
        description: 'Position and rotation settings for the top wave layer.'
      },
      {
        name: 'middleWavePosition',
        type: '{ x: number; y: number; rotate: number }',
        default: 'undefined',
        description: 'Position and rotation settings for the middle wave layer.'
      },
      {
        name: 'bottomWavePosition',
        type: '{ x: number; y: number; rotate: number }',
        default: '{ x: 2.0, y: -0.7, rotate: -1 }',
        description: 'Position and rotation settings for the bottom wave layer.'
      },
      {
        name: 'animationSpeed',
        type: 'number',
        default: '1',
        description: 'Speed multiplier for the wave animation.'
      },
      {
        name: 'interactive',
        type: 'boolean',
        default: 'true',
        description: 'Whether the lines react to mouse/pointer movement.'
      },
      {
        name: 'bendRadius',
        type: 'number',
        default: '5',
        description: 'Radius of the area affected by mouse interaction.'
      },
      {
        name: 'bendStrength',
        type: 'number',
        default: '-0.5',
        description: 'Intensity of the bend effect when interacting with mouse.'
      },
      {
        name: 'mouseDamping',
        type: 'number',
        default: '0.05',
        description: 'Smoothing factor for mouse movement tracking (0-1).'
      },
      {
        name: 'parallax',
        type: 'boolean',
        default: 'true',
        description: 'Enable parallax effect with mouse movement.'
      },
      {
        name: 'parallaxStrength',
        type: 'number',
        default: '0.2',
        description: 'Strength of the parallax effect.'
      },
      {
        name: 'mixBlendMode',
        type: "React.CSSProperties['mixBlendMode']",
        default: "'screen'",
        description: 'CSS mix-blend-mode applied to the canvas element.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <FloatingLines
              enabledWaves={enabledWaves}
              lineCount={lineCount}
              lineDistance={lineDistance}
              animationSpeed={animationSpeed}
              interactive={interactive}
              bendRadius={bendRadius}
              bendStrength={bendStrength}
              linesGradient={[gradientStart, gradientMid, gradientEnd]}
              backgroundColor={backgroundColor}
              lightMode={lightMode}
            />
            <BackgroundContent pillText="New Background" headline="Waves are cool! Even cooler with lines!" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="floating-lines"
              currentProps={{ enabledWaves, lineCount, lineDistance, animationSpeed, interactive, bendRadius, bendStrength, linesGradient: [gradientStart, gradientMid, gradientEnd] }}
              defaultProps={{
                linesGradient: ['#E945F5', '#2F4BC0', '#E945F5'],
                animationSpeed: 1,
                interactive: true,
                bendRadius: 5,
                bendStrength: -0.5,
                mouseDamping: 0.05,
                parallax: true,
                parallaxStrength: 0.2
              }}
            />
          </Flex>

          <Customize>
            <PreviewSwitch
              title="Top Wave"
              isChecked={enabledWaves.includes('top')}
              onChange={() => toggleWave('top')}
            />
            <PreviewSwitch
              title="Middle Wave"
              isChecked={enabledWaves.includes('middle')}
              onChange={() => toggleWave('middle')}
            />
            <PreviewSwitch
              title="Bottom Wave"
              isChecked={enabledWaves.includes('bottom')}
              onChange={() => toggleWave('bottom')}
            />

            <PreviewSlider
              title="Line Count"
              min={1}
              max={20}
              step={1}
              value={lineCount}
              onChange={val => updateProp('lineCount', val)}
            />
            <PreviewSlider
              title="Line Distance"
              min={1}
              max={100}
              step={0.5}
              value={lineDistance}
              onChange={val => updateProp('lineDistance', val)}
            />
            <PreviewSlider
              title="Animation Speed"
              min={0.1}
              max={5}
              step={0.1}
              value={animationSpeed}
              onChange={val => updateProp('animationSpeed', val)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={interactive}
              onChange={val => updateProp('interactive', val)}
            />
            <PreviewSlider
              title="Bend Radius"
              min={1}
              max={30}
              step={0.5}
              value={bendRadius}
              onChange={val => updateProp('bendRadius', val)}
            />
            <PreviewSlider
              title="Bend Strength"
              min={-15}
              max={15}
              step={0.5}
              value={bendStrength}
              onChange={val => updateProp('bendStrength', val)}
            />
            <PreviewColorPickerCustom title="Gradient Start" color={gradientStart} onChange={v => updateProp('gradientStart', v)} />
            <PreviewColorPickerCustom title="Gradient Mid" color={gradientMid} onChange={v => updateProp('gradientMid', v)} />
            <PreviewColorPickerCustom title="Gradient End" color={gradientEnd} onChange={v => updateProp('gradientEnd', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['three']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={floatingLines} componentName="FloatingLines" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FloatingLinesDemo;
