import { useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import GhostFibers from '@/content/Backgrounds/GhostFibers/GhostFibers';
import { ghostFibers } from '../../constants/code/Backgrounds/ghostFibersCode';

const DEFAULT_PROPS = {
  glowColor: '#2f5bff',
  lineColor: '',
  speed: 0.2,
  scale: 2,
  rotation: 0,
  rotationSpeed: 0.25,
  layers: 4,
  waves: 0.015,
  twist: 0.1,
  threads: 1,
  spread: 1,
  thickness: 1,
  glow: 2,
  brightness: 1.4,
  vignette: 0.8,
  grain: 0.03,
  mouseInteraction: true,
  lightMode: false
};

const propData = [
  { name: 'glowColor', type: 'string', default: "'#2f5bff'", description: 'Color of the light around the fibers.' },
  {
    name: 'lineColor',
    type: 'string',
    default: '-',
    description: 'Color of the fine fiber cores. Leave it out to use a pale tint of the glow color.'
  },
  { name: 'speed', type: 'number', default: '0.2', description: 'Animation speed. 0 holds the fibers still.' },
  { name: 'scale', type: 'number', default: '2', description: 'Zoom of the field. Higher values show larger fibers.' },
  { name: 'rotation', type: 'number', default: '0', description: 'Rotation of the field in degrees.' },
  { name: 'rotationSpeed', type: 'number', default: '0.25', description: 'How fast the field slowly turns.' },
  { name: 'layers', type: 'number', default: '4', description: 'Number of fiber layers, from 1 to 10.' },
  { name: 'waves', type: 'number', default: '0.015', description: 'How much the fibers ripple.' },
  { name: 'twist', type: 'number', default: '0.1', description: 'How much the fibers swirl around the center.' },
  { name: 'threads', type: 'number', default: '1', description: 'Number of fine threads in each fiber.' },
  { name: 'spread', type: 'number', default: '1', description: 'Space between the threads of a fiber.' },
  { name: 'thickness', type: 'number', default: '1', description: 'Width of the threads in pixels.' },
  { name: 'glow', type: 'number', default: '2', description: 'Strength of the soft light around the fibers.' },
  { name: 'brightness', type: 'number', default: '1.4', description: 'Overall brightness.' },
  { name: 'vignette', type: 'number', default: '0.8', description: 'How much the edges fade out, from 0 to 1.' },
  { name: 'grain', type: 'number', default: '0.03', description: 'Strength of the film grain.' },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Brightens the fibers softly around the cursor.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Fades the fibers in on mount.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the fibers as ink for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const GhostFibersDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { lineColor, ...settings } = props;
  const line = lineColor || undefined;

  const computedProps = useMemo(() => (line ? { lineColor: line } : {}), [line]);

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['lineColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <GhostFibers {...settings} {...computedProps} />
            <BackgroundContent headline="Light woven from the quiet parts of the spectrum." />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="ghost-fibers"
              currentProps={{ ...settings, ...computedProps }}
              defaultProps={DEFAULT_PROPS}
            />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom
              title="Glow Color"
              color={props.glowColor}
              onChange={value => updateProp('glowColor', value)}
            />
            <PreviewColorPickerCustom
              title="Line Color"
              color={lineColor || props.glowColor}
              onChange={value => updateProp('lineColor', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={1}
              step={0.01}
              value={props.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.5}
              max={4}
              step={0.05}
              value={props.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={-180}
              max={180}
              step={1}
              value={props.rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Rotation Speed"
              min={-1}
              max={1}
              step={0.01}
              value={props.rotationSpeed}
              onChange={value => updateProp('rotationSpeed', value)}
            />
            <PreviewSlider
              title="Layers"
              min={1}
              max={10}
              step={1}
              value={props.layers}
              onChange={value => updateProp('layers', value)}
            />
            <PreviewSlider
              title="Waves"
              min={0}
              max={0.3}
              step={0.005}
              value={props.waves}
              onChange={value => updateProp('waves', value)}
            />
            <PreviewSlider
              title="Twist"
              min={0}
              max={0.6}
              step={0.01}
              value={props.twist}
              onChange={value => updateProp('twist', value)}
            />
            <PreviewSlider
              title="Threads"
              min={1}
              max={9}
              step={1}
              value={props.threads}
              onChange={value => updateProp('threads', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0.3}
              max={3}
              step={0.05}
              value={props.spread}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.3}
              max={3}
              step={0.1}
              value={props.thickness}
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={4}
              step={0.05}
              value={props.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.3}
              max={3}
              step={0.05}
              value={props.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Vignette"
              min={0}
              max={1}
              step={0.05}
              value={props.vignette}
              onChange={value => updateProp('vignette', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.1}
              step={0.005}
              value={props.grain}
              onChange={value => updateProp('grain', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={props.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Light Mode"
              isChecked={props.lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={ghostFibers} componentName="GhostFibers" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GhostFibersDemo;
