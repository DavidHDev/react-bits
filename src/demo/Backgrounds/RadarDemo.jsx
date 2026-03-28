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
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';

import Radar from '../../content/Backgrounds/Radar/Radar';
import { radar } from '../../constants/code/Backgrounds/radarCode';

const DEFAULT_PROPS = {
  speed: 1.0,
  scale: 0.5,
  ringCount: 10.0,
  spokeCount: 10.0,
  ringThickness: 0.05,
  spokeThickness: 0.01,
  sweepSpeed: 1.0,
  sweepWidth: 2.0,
  sweepLobes: 1.0,
  color: '#9f29ff',
  backgroundColor: '#000000',
  falloff: 2.0,
  brightness: 1.0,
  enableMouseInteraction: true,
  mouseInfluence: 0.1
};

const RadarDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    speed,
    scale,
    ringCount,
    spokeCount,
    ringThickness,
    spokeThickness,
    sweepSpeed,
    sweepWidth,
    sweepLobes,
    color,
    backgroundColor,
    falloff,
    brightness,
    enableMouseInteraction,
    mouseInfluence
  } = props;

  const propData = useMemo(
    () => [
      {
        name: 'speed',
        type: 'number',
        default: '1.0',
        description: 'Overall animation speed multiplier.'
      },
      {
        name: 'scale',
        type: 'number',
        default: '0.5',
        description: 'Zoom level of the radar pattern.'
      },
      {
        name: 'ringCount',
        type: 'number',
        default: '10.0',
        description: 'Number of concentric rings.'
      },
      {
        name: 'spokeCount',
        type: 'number',
        default: '10.0',
        description: 'Number of radial spoke lines.'
      },
      {
        name: 'ringThickness',
        type: 'number',
        default: '0.05',
        description: 'Thickness of the concentric ring lines.'
      },
      {
        name: 'spokeThickness',
        type: 'number',
        default: '0.01',
        description: 'Thickness of the radial spoke lines.'
      },
      {
        name: 'sweepSpeed',
        type: 'number',
        default: '1.0',
        description: 'Rotation speed of the sweep beam.'
      },
      {
        name: 'sweepWidth',
        type: 'number',
        default: '2.0',
        description: 'Width of the sweep trail (higher = thinner).'
      },
      {
        name: 'sweepLobes',
        type: 'number',
        default: '1.0',
        description: 'Number of sweep beams around the radar.'
      },
      {
        name: 'color',
        type: 'string',
        default: '"#9f29ff"',
        description: 'Primary radar color in HEX format.'
      },
      {
        name: 'backgroundColor',
        type: 'string',
        default: '"#000000"',
        description: 'Background color in HEX format.'
      },
      {
        name: 'falloff',
        type: 'number',
        default: '2.0',
        description: 'Edge fade intensity based on distance from center.'
      },
      {
        name: 'brightness',
        type: 'number',
        default: '1.0',
        description: 'Overall brightness multiplier.'
      },
      {
        name: 'enableMouseInteraction',
        type: 'boolean',
        default: 'true',
        description: 'Enable cursor-reactive center offset.'
      },
      {
        name: 'mouseInfluence',
        type: 'number',
        default: '0.1',
        description: 'Strength of the mouse offset effect.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={600} overflow="hidden" p={0}>
            <Radar
              speed={speed}
              scale={scale}
              ringCount={ringCount}
              spokeCount={spokeCount}
              ringThickness={ringThickness}
              spokeThickness={spokeThickness}
              sweepSpeed={sweepSpeed}
              sweepWidth={sweepWidth}
              sweepLobes={sweepLobes}
              color={color}
              backgroundColor={backgroundColor}
              falloff={falloff}
              brightness={brightness}
              enableMouseInteraction={enableMouseInteraction}
              mouseInfluence={mouseInfluence}
            />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="radar"
              currentProps={{
                speed,
                scale,
                ringCount,
                spokeCount,
                ringThickness,
                spokeThickness,
                sweepSpeed,
                sweepWidth,
                sweepLobes,
                color,
                backgroundColor,
                falloff,
                brightness,
                enableMouseInteraction,
                mouseInfluence
              }}
              defaultProps={DEFAULT_PROPS}
            />
          </Flex>

          <Customize>
            <Flex gap={4} align="center" mt={4}>
              <Text fontSize="sm">Color</Text>
              <Input
                type="color"
                value={color}
                onChange={e => {
                  updateProp('color', e.target.value);
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
              min={0.1}
              max={5}
              step={0.1}
              title="Speed"
              value={speed}
              onChange={val => {
                updateProp('speed', val);
              }}
            />

            <PreviewSlider
              min={0.1}
              max={3}
              step={0.1}
              title="Scale"
              value={scale}
              onChange={val => {
                updateProp('scale', val);
              }}
            />

            <PreviewSlider
              min={1}
              max={30}
              step={1}
              title="Ring Count"
              value={ringCount}
              onChange={val => {
                updateProp('ringCount', val);
              }}
            />

            <PreviewSlider
              min={1}
              max={36}
              step={1}
              title="Spoke Count"
              value={spokeCount}
              onChange={val => {
                updateProp('spokeCount', val);
              }}
            />

            <PreviewSlider
              min={0.01}
              max={0.3}
              step={0.01}
              title="Ring Thickness"
              value={ringThickness}
              onChange={val => {
                updateProp('ringThickness', val);
              }}
            />

            <PreviewSlider
              min={0.01}
              max={0.2}
              step={0.01}
              title="Spoke Thickness"
              value={spokeThickness}
              onChange={val => {
                updateProp('spokeThickness', val);
              }}
            />

            <PreviewSlider
              min={0.1}
              max={5}
              step={0.1}
              title="Sweep Speed"
              value={sweepSpeed}
              onChange={val => {
                updateProp('sweepSpeed', val);
              }}
            />

            <PreviewSlider
              min={1}
              max={20}
              step={1}
              title="Sweep Width"
              value={sweepWidth}
              onChange={val => {
                updateProp('sweepWidth', val);
              }}
            />

            <PreviewSlider
              min={1}
              max={6}
              step={1}
              title="Sweep Lobes"
              value={sweepLobes}
              onChange={val => {
                updateProp('sweepLobes', val);
              }}
            />

            <PreviewSlider
              min={0.1}
              max={3}
              step={0.1}
              title="Falloff"
              value={falloff}
              onChange={val => {
                updateProp('falloff', val);
              }}
            />

            <PreviewSlider
              min={0.1}
              max={3}
              step={0.1}
              title="Brightness"
              value={brightness}
              onChange={val => {
                updateProp('brightness', val);
              }}
            />

            <PreviewSwitch
              title="Mouse Interaction"
              value={enableMouseInteraction}
              onChange={val => {
                updateProp('enableMouseInteraction', val);
              }}
            />

            {enableMouseInteraction && (
              <PreviewSlider
                min={0.1}
                max={1}
                step={0.05}
                title="Mouse Influence"
                value={mouseInfluence}
                onChange={val => {
                  updateProp('mouseInfluence', val);
                }}
              />
            )}
          </Customize>
          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={radar} componentName="Radar" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default RadarDemo;
