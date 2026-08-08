import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';

import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import WaveBackground from '../../content/Backgrounds/WaveBackground/WaveBackground';
import { waveBackground } from '../../constants/code/Backgrounds/waveBackgroundCode';

// Default prop values for this component
const DEFAULT_PROPS = {
  speed: 1,
  colorWaveStart: '#0072ce',
  colorWaveEnd: '#00d2ff',
  wavePointsColor: '#00ffff',
  rows: 65,
  cols: 85,
  spacing: 40
};

const WaveBackgroundDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { speed, colorWaveStart, colorWaveEnd, wavePointsColor, rows, cols, spacing } = props;

  const [key, forceRerender] = useForceRerender();

  const propData = useMemo(
    () => [
      {
        name: 'speed',
        type: 'number',
        default: '1.0',
        description: 'Animation speed multiplier.'
      },
      {
        name: 'colorWaveStart',
        type: 'string',
        default: '#0072ce',
        description: 'Hex code for the start color of the wave lines gradient.'
      },
      {
        name: 'colorWaveEnd',
        type: 'string',
        default: '#00d2ff',
        description: 'Hex code for the end color of the wave lines gradient.'
      },
      {
        name: 'wavePointsColor',
        type: 'string',
        default: '#00ffff',
        description: 'Hex code for the highlight dot color at the peak heights.'
      },
      {
        name: 'rows',
        type: 'number',
        default: '65',
        description: 'Number of rows in the 3D grid.'
      },
      {
        name: 'cols',
        type: 'number',
        default: '85',
        description: 'Number of columns in the 3D grid.'
      },
      {
        name: 'spacing',
        type: 'number',
        default: '40',
        description: 'Spacing between adjacent nodes in the grid.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <WaveBackground
              key={key}
              speed={speed}
              colorWaveStart={colorWaveStart}
              colorWaveEnd={colorWaveEnd}
              wavePointsColor={wavePointsColor}
              rows={rows}
              cols={cols}
              spacing={spacing}
            />

            {/* For Demo Purposes Only */}
            <BackgroundContent pillText="New Component" headline="Smooth 3D grid waves running completely on canvas" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="wave-background"
              currentProps={{ speed, colorWaveStart, colorWaveEnd, wavePointsColor, rows, cols, spacing }}
              defaultProps={DEFAULT_PROPS}
            />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom
              title="Start Color"
              color={colorWaveStart}
              onChange={val => {
                updateProp('colorWaveStart', val);
                forceRerender();
              }}
            />
            <PreviewColorPickerCustom
              title="End Color"
              color={colorWaveEnd}
              onChange={val => {
                updateProp('colorWaveEnd', val);
                forceRerender();
              }}
            />
            <PreviewColorPickerCustom
              title="Points Color"
              color={wavePointsColor}
              onChange={val => {
                updateProp('wavePointsColor', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.1}
              value={speed}
              onChange={val => {
                updateProp('speed', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Rows"
              min={10}
              max={120}
              step={5}
              value={rows}
              onChange={val => {
                updateProp('rows', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Cols"
              min={10}
              max={150}
              step={5}
              value={cols}
              onChange={val => {
                updateProp('cols', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Spacing"
              min={10}
              max={100}
              step={5}
              value={spacing}
              onChange={val => {
                updateProp('spacing', val);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={waveBackground} componentName="WaveBackground" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default WaveBackgroundDemo;
