import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';
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
import '../../css/preview-slider.css';

import NeonLogo from '../../content/Animations/NeonLogo/NeonLogo';
import { neonLogo } from '../../constants/code/Animations/neonLogoCode';
import logo from '../../assets/logos/react-bits-logo-small.svg';
import wordmark from '../../assets/logos/react-bits-logo.svg';
import apple from '../../assets/logos/apple.svg';
import tesla from '../../assets/logos/tesla.svg';
import openai from '../../assets/logos/openai.svg';
import viceCity from '../../assets/logos/vice-city.webp';

const LOGOS = { viceCity, logo, wordmark, apple, tesla, openai };

const FONT = 'Geist, system-ui, sans-serif';

const IDLE_OPTIONS = [
  { value: 'drift', label: 'Drift' },
  { value: 'lit', label: 'Lit' },
  { value: 'none', label: 'None' }
];

const DEFAULT_PROPS = {
  text: 'Miami',
  colors: ['#ffc9f4', '#ea6fe0', '#d351b6', '#a6f3fa', '#6fd6f7', '#5aaef0', '#2b4bb8', '#121646'],
  baseColor: '#a855f7',
  scale: 0.7,
  heat: 0.5,
  radius: 1.5,
  softness: 0.25,
  swell: 0.1,
  idle: 'drift',
  speed: 2,
  igniteOnClick: true,
  interactive: true,
  intro: true
};

const propData = [
  {
    name: 'src',
    type: 'string',
    default: 'undefined',
    description:
      'Any image URL. SVGs and transparent PNGs are read by their alpha, opaque images by keying out their backdrop color. When set, it replaces the text.'
  },
  { name: 'text', type: 'string', default: "'NEON'", description: 'Word to draw when no src is given.' },
  {
    name: 'fontFamily',
    type: 'string',
    default: "'Inter, system-ui, sans-serif'",
    description: 'Font for the text. It is loaded before the first frame when it is available on the page.'
  },
  { name: 'fontWeight', type: 'number', default: '500', description: 'Weight of the text.' },
  {
    name: 'scale',
    type: 'number',
    default: '0.7',
    description: 'Size of the logo as a fraction of the container. The glow reaches a little past it.'
  },
  {
    name: 'baseColor',
    type: 'string',
    default: "'#a855f7'",
    description: 'Flat color the logo rests in wherever the heat is not showing.'
  },
  {
    name: 'colors',
    type: 'string[]',
    default: "['#ffc9f4', '#ea6fe0', ..., '#121646']",
    description: 'Heat map colors, from the glowing rim to the dark core of every stroke.'
  },
  {
    name: 'heat',
    type: 'number',
    default: '0.5',
    description: 'How strongly the heat opens up under the cursor, thinning the strokes as if they were melting.'
  },
  { name: 'radius', type: 'number', default: '1.5', description: 'Size of the hot area around the cursor.' },
  {
    name: 'softness',
    type: 'number',
    default: '0.25',
    description: 'How soft the edges are. Higher values let nearby strokes run together.'
  },
  {
    name: 'swell',
    type: 'number',
    default: '0.1',
    description: 'How much the strokes swell and merge where the heat is.'
  },
  {
    name: 'idle',
    type: "'drift' | 'lit' | 'none'",
    default: "'drift'",
    description:
      'What happens when the cursor is away. Drift sends a slow hot spot wandering over the logo, lit keeps the whole heat map showing, none rests in the base color.'
  },
  { name: 'speed', type: 'number', default: '2', description: 'Speed of the drifting hot spot.' },
  {
    name: 'igniteOnClick',
    type: 'boolean',
    default: 'true',
    description: 'A click sends a wave of heat across the logo, followed by a wave that cools it back down.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'Lets the cursor reveal the heat map.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Melts the logo in when it first appears. A new logo or word always melts in.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const NeonLogoDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [image, setImage] = useState('viceCity');
  const [upload, setUpload] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!upload) return undefined;
    return () => URL.revokeObjectURL(upload.url);
  }, [upload]);

  const handleFile = e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUpload({ url: URL.createObjectURL(file), name: file.name });
    setImage('upload');
  };

  const imageOptions = useMemo(
    () => [
      { label: 'Vice City', value: 'viceCity' },
      { label: 'React Bits', value: 'logo' },
      { label: 'React Bits Full', value: 'wordmark' },
      { label: 'Apple', value: 'apple' },
      { label: 'Tesla', value: 'tesla' },
      { label: 'OpenAI', value: 'openai' },
      { label: 'Text', value: 'text' },
      ...(upload ? [{ label: 'Your upload', value: 'upload' }] : [])
    ],
    [upload]
  );

  const src = image === 'upload' && upload ? upload.url : image === 'text' ? undefined : LOGOS[image] || logo;

  const resetAll = () => {
    resetProps();
    setImage('viceCity');
  };

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetAll} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <NeonLogo key={key} src={src} fontFamily={FONT} {...props} />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={props.colors}
              min={2}
              max={10}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSelect title="Image" options={imageOptions} value={image} onChange={setImage} />
            <div className="scrubber">
              <button
                type="button"
                className="scrubber-track scrubber-track--select"
                onClick={() => inputRef.current?.click()}
              >
                <span className="scrubber-label">Upload</span>
                <span className="scrubber-select-right">
                  <span
                    className="scrubber-value"
                    style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {upload ? upload.name : 'SVG or PNG'}
                  </span>
                </span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/svg+xml,image/png,image/webp,image/jpeg"
                hidden
                onChange={handleFile}
              />
            </div>
            <PreviewInput
              title="Text"
              value={props.text}
              maxLength={16}
              isDisabled={image !== 'text'}
              onChange={value => updateProp('text', value)}
            />
            <PreviewSelect
              title="Idle"
              options={IDLE_OPTIONS}
              value={props.idle}
              onChange={value => updateProp('idle', value)}
            />
            <PreviewColorPickerCustom
              title="Base Color"
              color={props.baseColor}
              onChange={value => updateProp('baseColor', value)}
            />
            <PreviewSlider
              title="Heat"
              min={0}
              max={1}
              step={0.01}
              value={props.heat}
              onChange={value => updateProp('heat', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0.5}
              max={1.8}
              step={0.01}
              value={props.radius}
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.01}
              value={props.softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Swell"
              min={0}
              max={1.5}
              step={0.01}
              value={props.swell}
              onChange={value => updateProp('swell', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={props.speed}
              isDisabled={props.idle !== 'drift'}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.2}
              max={0.9}
              step={0.01}
              value={props.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSwitch
              title="Ignite On Click"
              isChecked={props.igniteOnClick}
              onChange={value => updateProp('igniteOnClick', value)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={props.interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={props.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={neonLogo} componentName="NeonLogo" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default NeonLogoDemo;
