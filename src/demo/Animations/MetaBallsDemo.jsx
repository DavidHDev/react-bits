import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';

import CodeExample from '../../components/code/CodeExample';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import { metaBalls } from '../../constants/code/Animations/metaBallsCode';
import MetaBalls from '../../content/Animations/MetaBalls/MetaBalls';
import { useColorModeValue } from '../../components/setup/color-mode';

const DEFAULT_PROPS = {
  color: '#ffffff',
  cursorBallColor: '#ffffff',
  speed: 0.3,
  animationSize: 30,
  ballCount: 15,
  clumpFactor: 1,
  enableMouseInteraction: true,
  hoverSmoothness: 0.15,
  cursorBallSize: 2
};

const MetaBallsDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    color,
    cursorBallColor,
    speed,
    animationSize,
    ballCount,
    clumpFactor,
    enableMouseInteraction,
    hoverSmoothness,
    cursorBallSize
  } = props;
  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const renderedCursorBallColor = useColorModeValue(
    cursorBallColor === DEFAULT_PROPS.cursorBallColor ? '#18181b' : cursorBallColor,
    cursorBallColor
  );

  const propData = useMemo(
    () => [
      {
        name: 'color',
        type: 'string',
        default: '#ffffff',
        description: 'The base color of the metaballs.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '0.3',
        description: 'Speed multiplier for the animation.'
      },
      {
        name: 'enableMouseInteraction',
        type: 'boolean',
        default: 'true',
        description: 'Enables or disables the ball following the mouse.'
      },
      {
        name: 'enableTransparency',
        type: 'boolean',
        default: 'false',
        description: 'Enables or disables transparency for the container of the animation.'
      },
      {
        name: 'hoverSmoothness',
        type: 'number',
        default: '0.05',
        description: 'Smoothness factor for the cursor ball when following the mouse.'
      },
      {
        name: 'animationSize',
        type: 'number',
        default: '30',
        description: 'The size of the world for the animation.'
      },
      {
        name: 'ballCount',
        type: 'number',
        default: '15',
        description: 'Number of metaballs rendered.'
      },
      {
        name: 'clumpFactor',
        type: 'number',
        default: '1',
        description: 'Determines how close together the balls are rendered.'
      },
      {
        name: 'cursorBallSize',
        type: 'number',
        default: '3',
        description: 'Size of the cursor-controlled ball.'
      },
      {
        name: 'cursorBallColor',
        type: 'string',
        default: '#ffffff',
        description: 'Color of the cursor ball.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} p={0} overflow="hidden">
            <MetaBalls
              color={renderedColor}
              cursorBallColor={renderedCursorBallColor}
              cursorBallSize={cursorBallSize}
              ballCount={ballCount}
              animationSize={animationSize}
              enableMouseInteraction={enableMouseInteraction}
              hoverSmoothness={hoverSmoothness}
              clumpFactor={clumpFactor}
              speed={speed}
            />
          </Box>

          <Customize className="preview-options">
            <PreviewColorPickerCustom title="Color" color={renderedColor} onChange={val => { updateProp('color', val); updateProp('cursorBallColor', val); }} />

            <PreviewSlider
              title="Ball Count"
              min={2}
              max={30}
              step={1}
              value={ballCount}
              onChange={val => updateProp('ballCount', val)}
              width={150}
            />

            <PreviewSlider
              title="Speed"
              min={0.1}
              max={1}
              step={0.1}
              value={speed}
              onChange={val => updateProp('speed', val)}
              width={150}
            />

            <PreviewSlider
              title="Size"
              min={10}
              max={50}
              step={1}
              value={animationSize}
              onChange={val => updateProp('animationSize', val)}
              width={150}
            />

            <PreviewSlider
              title="Clump Factor"
              min={0.1}
              max={2}
              step={0.1}
              value={clumpFactor}
              onChange={val => updateProp('clumpFactor', val)}
              width={150}
            />

            <PreviewSwitch
              title="Follow Cursor"
              isChecked={enableMouseInteraction}
              onChange={checked => updateProp('enableMouseInteraction', checked)}
            />

            <PreviewSlider
              title="Cursor Smoothing"
              min={0.001}
              max={0.25}
              step={0.001}
              value={hoverSmoothness}
              onChange={val => updateProp('hoverSmoothness', val)}
              width={150}
            />

            <PreviewSlider
              title="Cursor Size"
              min={1}
              max={5}
              step={1}
              value={cursorBallSize}
              onChange={val => updateProp('cursorBallSize', val)}
              width={150}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={metaBalls} componentName="MetaBalls" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default MetaBallsDemo;
