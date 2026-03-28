import { useMemo, useState } from 'react';
import { Box, Flex, Icon, Input, Text } from '@chakra-ui/react';
import { VscSparkleFilled } from 'react-icons/vsc';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';

import BorderGlow from '../../content/Components/BorderGlow/BorderGlow';
import { borderGlow } from '../../constants/code/Components/borderGlowCode';

const DEFAULT_PROPS = {
  edgeSensitivity: 30,
  glowColor: '40 80 80',
  backgroundColor: '#060010',
  borderRadius: 28,
  glowRadius: 40,
  glowIntensity: 1.0,
  coneSpread: 25,
  animated: false
};

const BorderGlowDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { edgeSensitivity, backgroundColor, borderRadius, glowRadius, glowIntensity, coneSpread, animated } = props;
  const [colors, setColors] = useState(['#c084fc', '#f472b6', '#38bdf8']);

  const updateColor = (index, value) => {
    const next = [...colors];
    next[index] = value;
    setColors(next);
  };

  const propData = useMemo(
    () => [
      { name: 'children', type: 'ReactNode', default: '-', description: 'Content rendered inside the card.' },
      {
        name: 'className',
        type: 'string',
        default: '""',
        description: 'Additional CSS classes for the outer wrapper.'
      },
      {
        name: 'edgeSensitivity',
        type: 'number',
        default: '30',
        description: 'How close the pointer must be to the edge for the glow to appear (0-100).'
      },
      {
        name: 'glowColor',
        type: 'string',
        default: '"40 80 80"',
        description: 'HSL values for the glow color, as "H S L" (e.g. "40 80 80").'
      },
      { name: 'backgroundColor', type: 'string', default: '"#060010"', description: 'Background color of the card.' },
      { name: 'borderRadius', type: 'number', default: '28', description: 'Corner radius of the card in pixels.' },
      {
        name: 'glowRadius',
        type: 'number',
        default: '40',
        description: 'How far the outer glow extends beyond the card in pixels.'
      },
      { name: 'glowIntensity', type: 'number', default: '1.0', description: 'Multiplier for glow opacity (0.1-3.0).' },
      {
        name: 'coneSpread',
        type: 'number',
        default: '25',
        description: 'Width of the directional cone mask as a percentage (5-45).'
      },
      { name: 'animated', type: 'boolean', default: 'false', description: 'Play an intro sweep animation on mount.' },
      {
        name: 'colors',
        type: 'string[]',
        default: '[...]',
        description: 'Array of 3 hex colors for the mesh gradient border, distributed across positions.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" py={10} h={500}>
            <BorderGlow {...props} colors={colors}>
              <Flex direction="column" alignItems="flex-start" justifyContent="center" p="2em" minH="200px">
                <Icon mb={3} boxSize={10} as={VscSparkleFilled} />
                <Text fontWeight={600} fontSize="1.4rem" letterSpacing="-.5px">
                  Hover Near the Edges
                </Text>
                <Text color="#a1a1aa" fontSize="14px" maxW="40ch" mt={1}>
                  Move your cursor close to the card border to see the colored glow effect follow your pointer
                  direction.
                </Text>
              </Flex>
            </BorderGlow>
          </Box>

          <Customize>
            <PreviewSlider
              min={0}
              max={80}
              step={1}
              title="Edge Sensitivity"
              value={edgeSensitivity}
              onChange={val => updateProp('edgeSensitivity', val)}
            />
            <PreviewSlider
              min={0}
              max={50}
              step={1}
              title="Border Radius"
              value={borderRadius}
              onChange={val => updateProp('borderRadius', val)}
            />
            <PreviewSlider
              min={10}
              max={80}
              step={1}
              title="Glow Radius"
              value={glowRadius}
              onChange={val => updateProp('glowRadius', val)}
            />
            <PreviewSlider
              min={0.1}
              max={3}
              step={0.1}
              title="Glow Intensity"
              value={glowIntensity}
              onChange={val => updateProp('glowIntensity', val)}
            />
            <PreviewSlider
              min={5}
              max={45}
              step={1}
              title="Cone Spread"
              value={coneSpread}
              onChange={val => updateProp('coneSpread', val)}
            />
            <PreviewSwitch title="Animated Intro" value={animated} onChange={val => updateProp('animated', val)} />
            <Flex gap={4} align="center" mt={4}>
              <Text fontSize="sm">Background</Text>
              <Input
                type="color"
                value={backgroundColor}
                onChange={e => updateProp('backgroundColor', e.target.value)}
                width="50px"
              />
            </Flex>
            <Text fontSize="sm" mt={4}>
              Gradient Colors
            </Text>
            <Flex gap={2} flexWrap="wrap" mt={1}>
              {colors.map((c, i) => (
                <Input
                  key={i}
                  type="color"
                  value={c}
                  onChange={e => updateColor(i, e.target.value)}
                  width="40px"
                  p={0}
                  border="none"
                  cursor="pointer"
                />
              ))}
            </Flex>
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={borderGlow} componentName="BorderGlow" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default BorderGlowDemo;
