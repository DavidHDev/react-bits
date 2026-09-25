import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import Dependencies from '../../components/code/Dependencies';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { useColorModeValue } from '../../components/setup/color-mode';
import '../../css/preview-slider.css';

import ElectricLogo from '../../content/Animations/ElectricLogo/ElectricLogo';
import { electricLogo } from '../../constants/code/Animations/electricLogoCode';
import logo from '../../assets/logos/react-bits-logo-small.svg';
import apple from '../../assets/logos/apple.svg';
import tesla from '../../assets/logos/tesla.svg';
import openai from '../../assets/logos/openai.svg';

const LOGOS = { logo, apple, tesla, openai };

const PALETTES = {
  logo: {
    dark: { color: '#ecc7ff', glowColor: '#ad6dff' },
    light: { color: '#a953ff', glowColor: '#c79bff' }
  },
  apple: {
    dark: { color: '#cadcff', glowColor: '#528aff' },
    light: { color: '#3377ff', glowColor: '#99b8ff' }
  },
  tesla: {
    dark: { color: '#ffcdd2', glowColor: '#ff5260' },
    light: { color: '#ef3848', glowColor: '#ffa3ab' }
  },
  openai: {
    dark: { color: '#c2fff1', glowColor: '#1fd8b6' },
    light: { color: '#0ea88f', glowColor: '#7fe6d5' }
  }
};

const LIGHT_BEND = 0.5;

const lightFor = (name, value) =>
  Object.values(PALETTES).find(palette => palette.dark[name] === value)?.light[name] ?? value;

const DEFAULT_PROPS = {
  color: PALETTES.logo.dark.color,
  glowColor: PALETTES.logo.dark.glowColor,
  scale: 0.7,
  intensity: 1,
  glow: 1,
  thickness: 1.5,
  strands: 4,
  bend: 0.6,
  crackle: 1.5,
  arcs: 1,
  flicker: 0.6,
  fill: 0,
  speed: 2.5,
  interactive: true,
  cursorIntensity: 0.75,
  cursorRadius: 100
};

const ElectricLogoDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    color,
    glowColor,
    scale,
    intensity,
    glow,
    thickness,
    strands,
    bend,
    crackle,
    arcs,
    flicker,
    fill,
    speed,
    interactive,
    cursorIntensity,
    cursorRadius
  } = props;

  const [image, setImage] = useState(
    () => Object.keys(PALETTES).find(name => PALETTES[name].dark.color === props.color) || 'logo'
  );
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
      { label: 'React Bits', value: 'logo' },
      { label: 'Apple', value: 'apple' },
      { label: 'Tesla', value: 'tesla' },
      { label: 'OpenAI', value: 'openai' },
      ...(upload ? [{ label: 'Your upload', value: 'upload' }] : [])
    ],
    [upload]
  );

  const src = image === 'upload' && upload ? upload.url : LOGOS[image] || logo;

  const theme = useColorModeValue('light', 'dark');
  const renderedColor = useColorModeValue(lightFor('color', color), color);
  const renderedGlow = useColorModeValue(lightFor('glowColor', glowColor), glowColor);
  const renderedBend = useColorModeValue(bend === DEFAULT_PROPS.bend ? LIGHT_BEND : bend, bend);

  const selectImage = value => {
    setImage(value);
    const palette = PALETTES[value];
    if (palette) updateProps({ color: palette.dark.color, glowColor: palette.dark.glowColor });
  };

  const resetAll = () => {
    resetProps();
    setImage('logo');
  };

  const propData = useMemo(
    () => [
      {
        name: 'src',
        type: 'string',
        default: 'lightning bolt',
        description:
          'Any image URL. SVGs and transparent PNGs are traced by their alpha, opaque images by keying out their backdrop colour.'
      },
      { name: 'color', type: 'string', default: "'#ecc7ff'", description: 'Colour of the hot core of every strand.' },
      {
        name: 'glowColor',
        type: 'string',
        default: "'#ad6dff'",
        description: 'Colour of the glow around the strands, the bloom and the interior fill.'
      },
      {
        name: 'scale',
        type: 'number',
        default: '0.7',
        description: 'Size of the logo as a fraction of the container. The glow and arcs extend beyond it.'
      },
      { name: 'intensity', type: 'number', default: '1', description: 'Overall brightness of the effect.' },
      {
        name: 'glow',
        type: 'number',
        default: '1',
        description: 'Strength of the halo around strands and the soft bloom around the shape.'
      },
      {
        name: 'thickness',
        type: 'number',
        default: '1.5',
        description:
          'Width of the main strand, in px. Satellite strands are thinner, and every strand swells and thins as it flows.'
      },
      {
        name: 'strands',
        type: 'number',
        default: '4',
        description: 'Number of filaments tracing the outline, from 1 to 6. Extra strands come and go along the edge.'
      },
      {
        name: 'bend',
        type: 'number',
        default: '0.6',
        description: 'How far the strands sway and ripple away from the outline. The main strand stays closest.'
      },
      {
        name: 'crackle',
        type: 'number',
        default: '1.5',
        description: 'Size of the fine crinkle along every strand and arc.'
      },
      {
        name: 'arcs',
        type: 'number',
        default: '1',
        description: 'How often short arcs leap off the edge and land further along it. 0 turns them off.'
      },
      {
        name: 'flicker',
        type: 'number',
        default: '0.6',
        description: 'How much the whole effect pulses and each strand shimmers in brightness.'
      },
      {
        name: 'fill',
        type: 'number',
        default: '0',
        description: 'Translucent glow inside the shape, brightest near its edges.'
      },
      { name: 'speed', type: 'number', default: '2.5', description: 'Animation speed. 0 freezes the current frame.' },
      {
        name: 'interactive',
        type: 'boolean',
        default: 'true',
        description:
          'Turn on pointer interactions. Hovering charges the lightning around the cursor, and a click sends a ripple through it with a burst of arcs.'
      },
      {
        name: 'cursorIntensity',
        type: 'number',
        default: '0.75',
        description: 'How strongly the lightning charges up around the cursor. 0 turns the hover charge off.'
      },
      {
        name: 'cursorRadius',
        type: 'number',
        default: '100',
        description: 'Radius of the charged area around the cursor, in px.'
      },
      {
        name: 'theme',
        type: "'dark' | 'light'",
        default: "'dark'",
        description:
          'The background the logo sits on. Dark renders the lightning as emitted light. Light renders crisp electric ink with a white-hot core and a lighter fill.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Extra classes on the container.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles on the container.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetAll} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <ElectricLogo
              key={key}
              src={src}
              color={renderedColor}
              glowColor={renderedGlow}
              scale={scale}
              intensity={intensity}
              glow={glow}
              thickness={thickness}
              strands={strands}
              bend={renderedBend}
              crackle={crackle}
              arcs={arcs}
              flicker={flicker}
              fill={fill}
              speed={speed}
              interactive={interactive}
              cursorIntensity={cursorIntensity}
              cursorRadius={cursorRadius}
              theme={theme}
            />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Image" options={imageOptions} value={image} onChange={selectImage} />
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

            <PreviewColorPickerCustom title="Color" color={renderedColor} onChange={v => updateProp('color', v)} />
            <PreviewColorPickerCustom
              title="Glow Color"
              color={renderedGlow}
              onChange={v => updateProp('glowColor', v)}
            />

            <PreviewSlider
              title="Scale"
              min={0.2}
              max={1}
              step={0.05}
              value={scale}
              onChange={v => updateProp('scale', v)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.2}
              max={2}
              step={0.05}
              value={intensity}
              onChange={v => updateProp('intensity', v)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={2}
              step={0.05}
              value={glow}
              onChange={v => updateProp('glow', v)}
            />
            <PreviewSlider
              title="Fill"
              min={0}
              max={1}
              step={0.05}
              value={fill}
              onChange={v => updateProp('fill', v)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.5}
              max={3}
              step={0.1}
              value={thickness}
              valueUnit="px"
              onChange={v => updateProp('thickness', v)}
            />
            <PreviewSlider
              title="Strands"
              min={1}
              max={6}
              step={1}
              value={strands}
              onChange={v => updateProp('strands', v)}
            />
            <PreviewSlider
              title="Bend"
              min={0}
              max={2}
              step={0.05}
              value={renderedBend}
              onChange={v => updateProp('bend', v)}
            />
            <PreviewSlider
              title="Crackle"
              min={0}
              max={2}
              step={0.05}
              value={crackle}
              onChange={v => updateProp('crackle', v)}
            />
            <PreviewSlider
              title="Arcs"
              min={0}
              max={2}
              step={0.05}
              value={arcs}
              onChange={v => updateProp('arcs', v)}
            />
            <PreviewSlider
              title="Flicker"
              min={0}
              max={1}
              step={0.05}
              value={flicker}
              onChange={v => updateProp('flicker', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={speed}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSwitch title="Interactive" isChecked={interactive} onChange={v => updateProp('interactive', v)} />
            <PreviewSlider
              title="Cursor Intensity"
              min={0}
              max={2}
              step={0.05}
              isDisabled={!interactive}
              value={cursorIntensity}
              onChange={v => updateProp('cursorIntensity', v)}
            />
            <PreviewSlider
              title="Cursor Radius"
              min={40}
              max={300}
              step={5}
              isDisabled={!interactive}
              value={cursorRadius}
              valueUnit="px"
              onChange={v => updateProp('cursorRadius', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={electricLogo} componentName="ElectricLogo" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ElectricLogoDemo;
