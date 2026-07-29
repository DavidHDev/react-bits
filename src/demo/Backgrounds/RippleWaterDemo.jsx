import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';

import { rippleWater } from '../../constants/code/Backgrounds/rippleWaterCode';
import RippleWater from '../../content/Backgrounds/RippleWater/RippleWater';

const DEFAULT_PROPS = {
  fromColor: '#52ade3',
  toColor: '#013565',
  color: '#a8d8f5',
  waveAmplitude: 1,
  waveSpeed: 1,
  shimmer: 1,
  reflection: 0.38,
  rippleStrength: 1,
  rippleRadius: 6,
  damping: 0.985,
  spread: 0.5,
  interactive: true,
  showHint: false
};

const RippleWaterDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    fromColor,
    toColor,
    color,
    waveAmplitude,
    waveSpeed,
    shimmer,
    reflection,
    rippleStrength,
    rippleRadius,
    damping,
    spread,
    interactive,
    showHint
  } = props;

  const propData = useMemo(
    () => [
      {
        name: 'fromColor',
        type: 'string',
        default: "'#52ade3'",
        description: 'Shallow end of the water gradient (top-left).'
      },
      {
        name: 'toColor',
        type: 'string',
        default: "'#013565'",
        description: 'Deep end of the water gradient (bottom-right).'
      },
      {
        name: 'color',
        type: 'string',
        default: "'#a8d8f5'",
        description: 'Ripple highlight and sparkle color.'
      },
      {
        name: 'waveAmplitude',
        type: 'number',
        default: '1',
        description: 'Ambient wave strength (0–2).'
      },
      {
        name: 'waveSpeed',
        type: 'number',
        default: '1',
        description: 'Ambient wave animation speed (0–3).'
      },
      {
        name: 'shimmer',
        type: 'number',
        default: '1',
        description: 'Specular shimmer intensity (0–2).'
      },
      {
        name: 'reflection',
        type: 'number',
        default: '0.38',
        description: 'Fresnel reflection strength (0–1).'
      },
      {
        name: 'rippleStrength',
        type: 'number',
        default: '1',
        description: 'Pointer ripple impulse strength (0–3).'
      },
      {
        name: 'rippleRadius',
        type: 'number',
        default: '6',
        description: 'Ripple radius in simulation cells (2–12).'
      },
      {
        name: 'damping',
        type: 'number',
        default: '0.985',
        description: 'Ripple damping — higher values make ripples last longer (0.9–0.999).'
      },
      {
        name: 'spread',
        type: 'number',
        default: '0.5',
        description: 'Ripple propagation speed (0.3–0.7).'
      },
      {
        name: 'interactive',
        type: 'boolean',
        default: 'true',
        description: 'Enable pointer interaction to create ripples.'
      },
      {
        name: 'showHint',
        type: 'boolean',
        default: 'false',
        description: 'Show bottom hint text.'
      },
      {
        name: 'hint',
        type: 'string',
        default: "'Click the water to create ripples'",
        description: 'Hint text shown when showHint is enabled.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <RippleWater
              fromColor={fromColor}
              toColor={toColor}
              color={color}
              waveAmplitude={waveAmplitude}
              waveSpeed={waveSpeed}
              shimmer={shimmer}
              reflection={reflection}
              rippleStrength={rippleStrength}
              rippleRadius={rippleRadius}
              damping={damping}
              spread={spread}
              interactive={interactive}
              showHint={showHint}
            />

            <BackgroundContent
              pillText="New Background"
              headline="WebGL water with shimmering ripples — click to disturb the surface"
            />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="ripple-water"
              currentProps={{
                fromColor,
                toColor,
                color,
                waveAmplitude,
                waveSpeed,
                shimmer,
                reflection,
                rippleStrength,
                rippleRadius,
                damping,
                spread,
                interactive
              }}
              defaultProps={{
                fromColor: '#52ade3',
                toColor: '#013565',
                color: '#a8d8f5',
                waveAmplitude: 1,
                waveSpeed: 1,
                shimmer: 1,
                reflection: 0.38,
                rippleStrength: 1,
                rippleRadius: 6,
                damping: 0.985,
                spread: 0.5,
                interactive: true
              }}
            />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom title="From Color" color={fromColor} onChange={val => updateProp('fromColor', val)} />
            <PreviewColorPickerCustom title="To Color" color={toColor} onChange={val => updateProp('toColor', val)} />
            <PreviewColorPickerCustom title="Highlight Color" color={color} onChange={val => updateProp('color', val)} />

            <PreviewSlider
              title="Wave Amplitude"
              min={0}
              max={2}
              step={0.05}
              value={waveAmplitude}
              onChange={val => updateProp('waveAmplitude', val)}
            />

            <PreviewSlider
              title="Wave Speed"
              min={0}
              max={3}
              step={0.05}
              value={waveSpeed}
              onChange={val => updateProp('waveSpeed', val)}
            />

            <PreviewSlider
              title="Shimmer"
              min={0}
              max={2}
              step={0.05}
              value={shimmer}
              onChange={val => updateProp('shimmer', val)}
            />

            <PreviewSlider
              title="Reflection"
              min={0}
              max={1}
              step={0.02}
              value={reflection}
              onChange={val => updateProp('reflection', val)}
            />

            <PreviewSlider
              title="Ripple Strength"
              min={0}
              max={3}
              step={0.05}
              value={rippleStrength}
              onChange={val => updateProp('rippleStrength', val)}
            />

            <PreviewSlider
              title="Ripple Radius"
              min={2}
              max={12}
              step={1}
              value={rippleRadius}
              onChange={val => updateProp('rippleRadius', val)}
            />

            <PreviewSlider
              title="Damping"
              min={0.9}
              max={0.999}
              step={0.001}
              value={damping}
              onChange={val => updateProp('damping', val)}
            />

            <PreviewSlider
              title="Spread"
              min={0.3}
              max={0.7}
              step={0.01}
              value={spread}
              onChange={val => updateProp('spread', val)}
            />

            <PreviewSwitch title="Interactive" isChecked={interactive} onChange={val => updateProp('interactive', val)} />
            <PreviewSwitch title="Show Hint" isChecked={showHint} onChange={val => updateProp('showHint', val)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={rippleWater} componentName="RippleWater" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default RippleWaterDemo;
