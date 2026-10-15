import { useMemo, useRef } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';
import PropTable from '../../components/common/Preview/PropTable';

import CodeExample from '../../components/code/CodeExample';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import Customize from '../../components/common/Preview/Customize';

import VariableProximity from '../../content/TextAnimations/VariableProximity/VariableProximity';
import { variableProximity } from '../../constants/code/TextAnimations/variableProximityCode';

const LOOK = {
  restWeight: 400,
  peakWeight: 1000,
  radius: 100,
  falloff: 'linear',
  smoothing: 0.2,
  fromColor: '',
  toColor: '',
  scale: 1,
  lift: 0,
  idleWave: false,
  fontSize: 64
};

const PRESETS = {
  classic: { ...LOOK },
  inverse: {
    ...LOOK,
    restWeight: 1000,
    peakWeight: 100,
    radius: 120,
    falloff: 'exponential',
    smoothing: 0.1,
    idleWave: true
  },
  hairline: {
    ...LOOK,
    restWeight: 100,
    peakWeight: 900,
    radius: 180,
    falloff: 'gaussian',
    smoothing: 0.5,
    scale: 1.12,
    fontSize: 72
  },
  lift: {
    ...LOOK,
    restWeight: 300,
    peakWeight: 800,
    radius: 150,
    falloff: 'gaussian',
    smoothing: 0.3,
    toColor: '#ff5a36',
    scale: 1.22,
    lift: 0.16
  }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'inverse', label: 'Inverse' },
  { value: 'hairline', label: 'Hairline' },
  { value: 'lift', label: 'Lift' }
];

const FALLOFF_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'exponential', label: 'Exponential' },
  { value: 'gaussian', label: 'Gaussian' }
];

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK
};

const propData = [
  {
    name: 'label',
    type: 'string',
    default: '""',
    description: 'The text content to display.'
  },
  {
    name: 'fromFontVariationSettings',
    type: 'string',
    default: "'wght' 400, 'opsz' 9",
    description: 'The variation settings letters rest at, away from the cursor.'
  },
  {
    name: 'toFontVariationSettings',
    type: 'string',
    default: "'wght' 1000, 'opsz' 40",
    description: 'The variation settings to reach at cursor proximity.'
  },
  {
    name: 'containerRef',
    type: 'RefObject<HTMLElement>',
    default: 'undefined',
    description:
      'Optional element around the text. Letters skip their distance checks while the cursor is farther than the radius from it.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '50',
    description: 'Proximity radius to influence the effect.'
  },
  {
    name: 'falloff',
    type: "'linear' | 'exponential' | 'gaussian'",
    default: '"linear"',
    description: 'Type of falloff for the effect.'
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0.2',
    description: 'How gently letters ease toward their new settings, from 0 (instant) to 1 (a slow, trailing wake).'
  },
  {
    name: 'fromColor',
    type: 'string',
    default: 'undefined',
    description: 'Color letters rest at. Leave unset to keep the text color.'
  },
  {
    name: 'toColor',
    type: 'string',
    default: 'undefined',
    description: 'Color letters shift toward as the cursor gets close. Leave unset to keep the text color.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Size a letter grows to right under the cursor. 1 keeps letters at their normal size.'
  },
  {
    name: 'lift',
    type: 'number',
    default: '0',
    description: 'How far, in em, a letter right under the cursor rises.'
  },
  {
    name: 'idleWave',
    type: 'boolean',
    default: 'false',
    description:
      'While the cursor is away, a gentle wave of weight travels across the text. It fades out as the cursor comes near.'
  },
  {
    name: 'fontSize',
    type: 'number | string',
    default: 'undefined',
    description: 'Font size of the text. Numbers are pixels. Inherits the surrounding size when unset.'
  }
];

const VariableProximityDemo = () => {
  const containerRef = useRef(null);
  const ink = useColorModeValue('#18181b', '#ffffff');

  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    preset,
    restWeight,
    peakWeight,
    radius,
    falloff,
    smoothing,
    fromColor,
    toColor,
    scale,
    lift,
    idleWave,
    fontSize
  } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(
    () => ({
      fromFontVariationSettings: `'wght' ${restWeight}, 'opsz' 9`,
      toFontVariationSettings: `'wght' ${peakWeight}, 'opsz' 40`,
      ...(fromColor ? { fromColor } : {}),
      ...(toColor ? { toColor } : {})
    }),
    [restWeight, peakWeight, fromColor, toColor]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'restWeight', 'peakWeight', 'fromColor', 'toColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            ref={containerRef}
            position="relative"
            className="demo-container"
            minH={400}
            overflow="hidden"
            p={4}
            style={{ containerType: 'inline-size' }}
          >
            <VariableProximity
              label={'Hover me! And then star React Bits on GitHub, or else...'}
              fromFontVariationSettings={computedProps.fromFontVariationSettings}
              toFontVariationSettings={computedProps.toFontVariationSettings}
              containerRef={containerRef}
              radius={radius}
              falloff={falloff}
              smoothing={smoothing}
              fromColor={fromColor || undefined}
              toColor={toColor || undefined}
              scale={scale}
              lift={lift}
              idleWave={idleWave}
              fontSize={`min(${fontSize}px, 8.5cqi)`}
              style={{ display: 'block', maxWidth: '20ch', lineHeight: 1.05, textAlign: 'center', cursor: 'pointer' }}
            />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="From Color"
              color={fromColor || ink}
              onChange={val => updateProp('fromColor', val)}
            />
            <PreviewColorPickerCustom
              title="To Color"
              color={toColor || fromColor || ink}
              onChange={val => updateProp('toColor', val)}
            />
            <PreviewSelect
              title="Falloff"
              options={FALLOFF_OPTIONS}
              value={falloff}
              onChange={val => updateProp('falloff', val)}
            />
            <PreviewSlider
              title="Radius"
              min={50}
              max={300}
              step={10}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Smoothing"
              min={0}
              max={1}
              step={0.05}
              value={smoothing}
              onChange={val => updateProp('smoothing', val)}
            />
            <PreviewSlider
              title="Scale"
              min={0.8}
              max={1.6}
              step={0.02}
              value={scale}
              onChange={val => updateProp('scale', val)}
            />
            <PreviewSlider
              title="Lift"
              min={0}
              max={0.4}
              step={0.01}
              value={lift}
              valueUnit="em"
              onChange={val => updateProp('lift', val)}
            />
            <PreviewSwitch title="Idle Wave" isChecked={idleWave} onChange={val => updateProp('idleWave', val)} />
            <PreviewSlider
              title="Rest Weight"
              min={100}
              max={1000}
              step={50}
              value={restWeight}
              onChange={val => updateProp('restWeight', val)}
            />
            <PreviewSlider
              title="Peak Weight"
              min={100}
              max={1000}
              step={50}
              value={peakWeight}
              onChange={val => updateProp('peakWeight', val)}
            />
            <PreviewSlider
              title="Font Size"
              min={32}
              max={96}
              step={2}
              value={fontSize}
              valueUnit="px"
              onChange={val => updateProp('fontSize', val)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={variableProximity} componentName="VariableProximity" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default VariableProximityDemo;
