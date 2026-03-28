import { useMemo, useState } from 'react';
import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import RefreshButton from '../../components/common/Preview/RefreshButton';
import CodeExample from '../../components/code/CodeExample';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import PropTable from '../../components/common/Preview/PropTable';

import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import Customize from '../../components/common/Preview/Customize';

import MagicRings from '../../content/Animations/MagicRings/MagicRings';
import { magicRings } from '../../constants/code/Animations/magicRingsCode';
import { Sparkles } from 'lucide-react';
import { FaGithub, FaReact } from 'react-icons/fa6';

const DEFAULT_PROPS = {
  color: '#fc42ff',
  colorTwo: '#42fcff',
  ringCount: 6,
  speed: 1,
  attenuation: 10,
  lineThickness: 2,
  baseRadius: 0.35,
  radiusStep: 0.1,
  scaleRate: 0.1,
  opacity: 1,
  blur: 0,
  noiseAmount: 0.1,
  rotation: 0,
  ringGap: 1.5,
  fadeIn: 0.7,
  fadeOut: 0.5,
  followMouse: false,
  mouseInfluence: 0.2,
  hoverScale: 1.2,
  parallax: 0.05,
  clickBurst: false
};

const MagicRingsDemo = () => {
  const [example, setExample] = useState('basic');
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    color,
    colorTwo,
    ringCount,
    speed,
    attenuation,
    lineThickness,
    baseRadius,
    radiusStep,
    scaleRate,
    opacity,
    blur,
    noiseAmount,
    rotation,
    ringGap,
    fadeIn,
    fadeOut,
    followMouse,
    mouseInfluence,
    hoverScale,
    parallax,
    clickBurst
  } = props;

  const [key, forceRerender] = useForceRerender();

  const propData = useMemo(
    () => [
      { name: 'color', type: 'string', default: '"#fc42ff"', description: 'Hex color for the rings.' },
      {
        name: 'colorTwo',
        type: 'string',
        default: '"#42fcff"',
        description: 'Second color — rings interpolate from color to colorTwo.'
      },
      { name: 'ringCount', type: 'number', default: '6', description: 'Number of concentric rings to draw (1–10).' },
      { name: 'speed', type: 'number', default: '1', description: 'Animation speed multiplier.' },
      {
        name: 'attenuation',
        type: 'number',
        default: '10',
        description: 'Glow falloff — higher values produce tighter glow.'
      },
      { name: 'lineThickness', type: 'number', default: '2', description: 'Thickness of each ring line.' },
      {
        name: 'baseRadius',
        type: 'number',
        default: '0.35',
        description: 'Radius of the innermost ring (normalized).'
      },
      { name: 'radiusStep', type: 'number', default: '0.1', description: 'Spacing between successive rings.' },
      { name: 'scaleRate', type: 'number', default: '0.1', description: 'How much rings expand over time.' },
      { name: 'opacity', type: 'number', default: '1', description: 'Overall opacity of the effect (0–1).' },
      { name: 'blur', type: 'number', default: '0', description: 'CSS blur in px — creates a bloom/glow effect.' },
      { name: 'noiseAmount', type: 'number', default: '0.1', description: 'Film-grain noise intensity.' },
      { name: 'rotation', type: 'number', default: '0', description: 'Static rotation of the pattern in degrees.' },
      {
        name: 'ringGap',
        type: 'number',
        default: '1.5',
        description: 'Exponential base for angular cutaway per ring.'
      },
      { name: 'fadeIn', type: 'number', default: '0.7', description: 'Duration of ring fade-in within cycle.' },
      { name: 'fadeOut', type: 'number', default: '0.5', description: 'Start time of ring fade-out within cycle.' },
      { name: 'followMouse', type: 'boolean', default: 'false', description: 'Rings shift toward the mouse cursor.' },
      {
        name: 'mouseInfluence',
        type: 'number',
        default: '0.2',
        description: 'Strength of mouse follow (when followMouse is true).'
      },
      { name: 'hoverScale', type: 'number', default: '1.2', description: 'Scale multiplier on hover.' },
      {
        name: 'parallax',
        type: 'number',
        default: '0.05',
        description: 'Per-ring depth offset based on mouse position.'
      },
      {
        name: 'clickBurst',
        type: 'boolean',
        default: 'false',
        description: 'Click triggers a brightness flash and scale pulse.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            background="#060010"
            h={600}
            p="0"
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {example === 'card' ? (
              <div className="mr-demo-card">
                <div className="mr-demo-card-visual">
                  <MagicRings
                    key={key}
                    color={color}
                    colorTwo={colorTwo}
                    ringCount={ringCount}
                    speed={speed}
                    attenuation={attenuation}
                    lineThickness={lineThickness}
                    baseRadius={baseRadius}
                    radiusStep={radiusStep}
                    scaleRate={scaleRate}
                    opacity={opacity}
                    blur={blur}
                    noiseAmount={noiseAmount}
                    rotation={rotation}
                    ringGap={ringGap}
                    fadeIn={fadeIn}
                    fadeOut={fadeOut}
                    followMouse={followMouse}
                    mouseInfluence={mouseInfluence}
                    hoverScale={hoverScale}
                    parallax={parallax}
                    clickBurst={clickBurst}
                  />
                  <Icon
                    as={Sparkles}
                    strokeWidth={1}
                    boxSize={12}
                    color="#fc42ff"
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    opacity={0.8}
                  />
                </div>
                <div className="mr-demo-card-body">
                  <h3 className="mr-demo-card-title">Magic Rings</h3>
                  <p className="mr-demo-card-subtitle">Interactive WebGL effect</p>
                  <div className="mr-demo-card-meta">
                    <span>
                      <Icon as={FaGithub} boxSize={4} />
                      Free & open source
                    </span>
                    <span>
                      <Icon as={FaReact} boxSize={4} />
                      React
                    </span>
                  </div>
                  <div className="mr-demo-card-actions">
                    <button className="mr-demo-card-cta">Copy to clipboard</button>
                    <div className="mr-demo-card-heart">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b19eef" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <MagicRings
                key={key}
                color={color}
                colorTwo={colorTwo}
                ringCount={ringCount}
                speed={speed}
                attenuation={attenuation}
                lineThickness={lineThickness}
                baseRadius={baseRadius}
                radiusStep={radiusStep}
                scaleRate={scaleRate}
                opacity={opacity}
                blur={blur}
                noiseAmount={noiseAmount}
                rotation={rotation}
                ringGap={ringGap}
                fadeIn={fadeIn}
                fadeOut={fadeOut}
                followMouse={followMouse}
                mouseInfluence={mouseInfluence}
                hoverScale={hoverScale}
                parallax={parallax}
                clickBurst={clickBurst}
              />
            )}
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect
              title="Example"
              name="magic-rings-example"
              width={140}
              value={example}
              options={[
                { label: 'Basic', value: 'basic' },
                { label: 'Card', value: 'card' }
              ]}
              onChange={val => setExample(val)}
            />

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              <Flex alignItems="center" my={6}>
                <Text fontSize="sm" mr={2}>
                  Color
                </Text>
                <input
                  type="color"
                  value={color}
                  style={{ height: '22px', outline: 'none', border: 'none' }}
                  onChange={e => {
                    updateProp('color', e.target.value);
                    forceRerender();
                  }}
                />
              </Flex>
              <Flex alignItems="center" my={6}>
                <Text fontSize="sm" mr={2}>
                  Color Two
                </Text>
                <input
                  type="color"
                  value={colorTwo}
                  style={{ height: '22px', outline: 'none', border: 'none' }}
                  onChange={e => {
                    updateProp('colorTwo', e.target.value);
                    forceRerender();
                  }}
                />
              </Flex>
              <Box>
                <PreviewSlider
                  title="Ring Count"
                  min={1}
                  max={10}
                  step={1}
                  value={ringCount}
                  onChange={val => {
                    updateProp('ringCount', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
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
              </Box>
              <Box>
                <PreviewSlider
                  title="Attenuation"
                  min={1}
                  max={30}
                  step={0.5}
                  value={attenuation}
                  onChange={val => {
                    updateProp('attenuation', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Line Thickness"
                  min={1}
                  max={10}
                  step={0.5}
                  value={lineThickness}
                  onChange={val => {
                    updateProp('lineThickness', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Base Radius"
                  min={0.1}
                  max={0.5}
                  step={0.01}
                  value={baseRadius}
                  onChange={val => {
                    updateProp('baseRadius', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Radius Step"
                  min={0.05}
                  max={0.3}
                  step={0.01}
                  value={radiusStep}
                  onChange={val => {
                    updateProp('radiusStep', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Scale Rate"
                  min={0}
                  max={0.2}
                  step={0.01}
                  value={scaleRate}
                  onChange={val => {
                    updateProp('scaleRate', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Opacity"
                  min={0}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={val => {
                    updateProp('opacity', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Blur"
                  min={0}
                  max={10}
                  step={0.5}
                  value={blur}
                  onChange={val => {
                    updateProp('blur', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Noise Amount"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={noiseAmount}
                  onChange={val => {
                    updateProp('noiseAmount', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Rotation"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={val => {
                    updateProp('rotation', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Ring Gap"
                  min={1}
                  max={3}
                  step={0.1}
                  value={ringGap}
                  onChange={val => {
                    updateProp('ringGap', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Fade In"
                  min={0.1}
                  max={1.5}
                  step={0.05}
                  value={fadeIn}
                  onChange={val => {
                    updateProp('fadeIn', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Fade Out"
                  min={0.5}
                  max={3}
                  step={0.05}
                  value={fadeOut}
                  onChange={val => {
                    updateProp('fadeOut', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Mouse Influence"
                  min={0}
                  max={1}
                  step={0.05}
                  value={mouseInfluence}
                  onChange={val => {
                    updateProp('mouseInfluence', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Hover Scale"
                  min={1}
                  max={2}
                  step={0.05}
                  value={hoverScale}
                  onChange={val => {
                    updateProp('hoverScale', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSlider
                  title="Parallax"
                  min={0}
                  max={0.1}
                  step={0.005}
                  value={parallax}
                  onChange={val => {
                    updateProp('parallax', val);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSwitch
                  title="Follow Mouse"
                  isChecked={followMouse}
                  onChange={checked => {
                    updateProp('followMouse', checked);
                    forceRerender();
                  }}
                />
              </Box>
              <Box>
                <PreviewSwitch
                  title="Click Burst"
                  isChecked={clickBurst}
                  onChange={checked => {
                    updateProp('clickBurst', checked);
                    forceRerender();
                  }}
                />
              </Box>
            </SimpleGrid>
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={magicRings} componentName="MagicRings" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default MagicRingsDemo;
