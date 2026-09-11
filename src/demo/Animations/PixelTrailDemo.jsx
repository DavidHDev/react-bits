import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Text } from '@chakra-ui/react';

import RefreshButton from '../../components/common/Preview/RefreshButton';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import useForceRerender from '../../hooks/useForceRerender';
import PropTable from '../../components/common/Preview/PropTable';

import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import Customize from '../../components/common/Preview/Customize';

import PixelTrail from '../../content/Animations/PixelTrail/PixelTrail';
import { pixelTrail } from '../../constants/code/Animations/pixelTrailCode';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

const DEFAULT_PROPS = {
  gridSize: 50,
  trailSize: 0.1,
  maxAge: 250,
  interpolate: 5,
  color: '#5227FF',
  gooeyEnabled: true,
  gooStrength: 2
};

const PixelTrailDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { gridSize, trailSize, maxAge, interpolate, color, gooeyEnabled, gooStrength } = props;

  const [key, forceRerender] = useForceRerender();

  const propData = useMemo(
    () => [
      { name: 'gridSize', type: 'number', default: '40', description: 'Number of pixels in grid.' },
      { name: 'trailSize', type: 'number', default: '0.1', description: 'Size of each trail dot.' },
      { name: 'maxAge', type: 'number', default: '250', description: 'Duration of the trail effect.' },
      { name: 'interpolate', type: 'number', default: '5', description: 'Interpolation factor for pointer movement.' },
      { name: 'color', type: 'string', default: '#ffffff', description: 'Pixel color.' },
      {
        name: 'gooeyFilter',
        type: 'object',
        default: "{ id: 'custom-goo-filter', strength: 5 }",
        description: 'Configuration for gooey filter.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} p={0} overflow="hidden">
            <RefreshButton onClick={forceRerender} />
            <PixelTrail
              key={key}
              gridSize={gridSize}
              trailSize={trailSize}
              maxAge={maxAge}
              interpolate={interpolate}
              color={color}
              gooeyFilter={gooeyEnabled ? { id: 'custom-goo-filter', strength: gooStrength } : undefined}
            />
            <Text className="demo-instruction" position="absolute" zIndex={0} fontSize="clamp(2rem, 6vw, 6rem)" fontWeight={600}>
              Move Cursor.
            </Text>
          </Box>

          <Customize>
            <PreviewSlider
              title="Grid Size"
              min={10}
              max={100}
              step={1}
              value={gridSize}
              onChange={val => {
                updateProp('gridSize', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Trail Size"
              min={0.05}
              max={0.5}
              step={0.01}
              value={trailSize}
              onChange={val => {
                updateProp('trailSize', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Max Age"
              min={100}
              max={1000}
              step={50}
              value={maxAge}
              onChange={val => {
                updateProp('maxAge', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Interpolate"
              min={0}
              max={10}
              step={0.1}
              value={interpolate}
              onChange={val => {
                updateProp('interpolate', val);
                forceRerender();
              }}
            />

            <PreviewColorPickerCustom title="Color" color={color} onChange={val => { updateProp('color', val); forceRerender(); }} />

            <PreviewSwitch
              title="Gooey Filter"
              isChecked={gooeyEnabled}
              onChange={checked => {
                updateProp('gooeyEnabled', checked);
                forceRerender();
              }}
            />

            {gooeyEnabled && (
              <PreviewSlider
                title="Gooey Strength"
                min={1}
                max={20}
                step={1}
                value={gooStrength}
                onChange={val => {
                  updateProp('gooStrength', val);
                  forceRerender();
                }}
              />
            )}
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@react-three/fiber', '@react-three/drei', 'three']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={pixelTrail} componentName="PixelTrail" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PixelTrailDemo;
