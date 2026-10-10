import { useEffect, useMemo, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { useColorModeValue } from '../../components/setup/color-mode';

import ElasticMesh from '../../content/Animations/ElasticMesh/ElasticMesh';
import { elasticMesh } from '../../constants/code/Animations/elasticMeshCode';
import logo from '../../assets/logos/react-bits-logo-small.svg';

const BALLOON = {
  material: 'balloon',
  color: '#3b5bff',
  inflate: 1,
  stiffness: 0.5,
  wobble: 0.6
};

const DEFAULT_PROPS = {
  preset: 'balloon',
  content: 'text',
  text: 'Squish',
  ...BALLOON,
  grabRadius: 70,
  stretch: 0.5,
  press: 0.5,
  shadow: 0.5,
  intro: true
};

const PRESETS = {
  balloon: BALLOON,
  chrome: { ...BALLOON, material: 'chrome', color: '#ffffff', stiffness: 0.65, wobble: 0.5 },
  jelly: { ...BALLOON, material: 'jelly', color: '#ff5a1f', stiffness: 0.35, wobble: 0.85 },
  clay: { ...BALLOON, material: 'clay', color: '#ece6dc', inflate: 0.85, stiffness: 0.6, wobble: 0.35 }
};

const PRESET_OPTIONS = [
  { value: 'balloon', label: 'Balloon' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'jelly', label: 'Jelly' },
  { value: 'clay', label: 'Clay' }
];

const CONTENT_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'logo', label: 'Logo' }
];

const MATERIAL_OPTIONS = [
  { value: 'balloon', label: 'Balloon' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'jelly', label: 'Jelly' },
  { value: 'clay', label: 'Clay' }
];

const propData = [
  { name: 'text', type: 'string', default: "'Squish'", description: 'Text to inflate. Use \\n for more lines.' },
  {
    name: 'src',
    type: 'string',
    default: "''",
    description: 'URL of an SVG or PNG to inflate instead of text. Its transparent pixels define the shape.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: "'system-ui, sans-serif'",
    description: 'Font used for the text. Heavy, rounded faces inflate best.'
  },
  { name: 'fontWeight', type: 'number', default: '900', description: 'Weight of the text.' },
  { name: 'color', type: 'string', default: "'#3b5bff'", description: 'Base color of the material.' },
  {
    name: 'imageColors',
    type: 'boolean',
    default: 'true',
    description: 'Keeps the colors of the image passed to src instead of using color.'
  },
  {
    name: 'material',
    type: "'balloon' | 'chrome' | 'jelly' | 'clay'",
    default: "'balloon'",
    description: 'Surface finish: glossy balloon, mirror chrome, glowing jelly or soft matte clay.'
  },
  { name: 'inflate', type: 'number', default: '1', description: 'How puffy the shape is. 1 gives round tubes.' },
  {
    name: 'stiffness',
    type: 'number',
    default: '0.5',
    description: 'How firm the material feels, from 0 for soft and stretchy to 1 for firm and quick.'
  },
  {
    name: 'wobble',
    type: 'number',
    default: '0.6',
    description: 'How long it jiggles after a poke or a pull, from 0 to 1.'
  },
  {
    name: 'grabRadius',
    type: 'number',
    default: '70',
    description: 'Size of the area the cursor grabs and presses, in pixels.'
  },
  { name: 'stretch', type: 'number', default: '0.5', description: 'How far the material can be pulled, from 0 to 1.' },
  { name: 'press', type: 'number', default: '0.5', description: 'Depth of the dent under the cursor and of a poke.' },
  { name: 'shadow', type: 'number', default: '0.5', description: 'Strength of the soft drop shadow.' },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Inflates the shape letter by letter on mount.' },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Lighting setup for dark or light pages.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const ElasticMeshDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, content, text, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const [key, forceRerender] = useForceRerender();
  const [typed, setTyped] = useState(text);

  useEffect(() => {
    const timer = setTimeout(() => setTyped(text), 350);
    return () => clearTimeout(timer);
  }, [text]);

  const computedProps = useMemo(
    () => (content === 'logo' ? { src: logo, imageColors: false } : { text: typed }),
    [content, typed]
  );

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], content, text, preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'content', 'text']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <RefreshButton onClick={forceRerender} />
            <ElasticMesh key={key} {...settings} {...computedProps} theme={theme} />
            <Text
              position="absolute"
              bottom={5}
              left="50%"
              transform="translateX(-50%)"
              fontSize="sm"
              color="var(--text-dimmed)"
              userSelect="none"
              pointerEvents="none"
              whiteSpace="nowrap"
            >
              Press, poke and pull
            </Text>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Content"
              options={CONTENT_OPTIONS}
              value={content}
              onChange={value => updateProp('content', value)}
            />
            <PreviewInput
              title="Text"
              value={text}
              maxLength={24}
              isDisabled={content !== 'text'}
              onChange={value => updateProp('text', value)}
            />
            <PreviewSelect
              title="Material"
              options={MATERIAL_OPTIONS}
              value={settings.material}
              onChange={value => updateProp('material', value)}
            />
            <PreviewColorPickerCustom
              title="Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSlider
              title="Inflate"
              min={0.4}
              max={1.6}
              step={0.05}
              value={settings.inflate}
              onChange={value => updateProp('inflate', value)}
            />
            <PreviewSlider
              title="Stiffness"
              min={0}
              max={1}
              step={0.05}
              value={settings.stiffness}
              onChange={value => updateProp('stiffness', value)}
            />
            <PreviewSlider
              title="Wobble"
              min={0}
              max={1}
              step={0.05}
              value={settings.wobble}
              onChange={value => updateProp('wobble', value)}
            />
            <PreviewSlider
              title="Grab Radius"
              min={30}
              max={160}
              step={5}
              value={settings.grabRadius}
              valueUnit="px"
              onChange={value => updateProp('grabRadius', value)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={1}
              step={0.05}
              value={settings.stretch}
              onChange={value => updateProp('stretch', value)}
            />
            <PreviewSlider
              title="Press"
              min={0}
              max={1}
              step={0.05}
              value={settings.press}
              onChange={value => updateProp('press', value)}
            />
            <PreviewSlider
              title="Shadow"
              min={0}
              max={1}
              step={0.05}
              value={settings.shadow}
              onChange={value => updateProp('shadow', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={elasticMesh} componentName="ElasticMesh" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ElasticMeshDemo;
