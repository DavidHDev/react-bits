import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import ShapeBlur from '../../content/Animations/ShapeBlur/ShapeBlur';
import { shapeBlur } from '../../constants/code/Animations/shapeBlurCode';
import logo from '../../assets/logos/react-bits-logo-small.svg';

const DEFAULT_PROPS = {
  preset: 'lens',
  form: 'logo',
  sides: 6,
  size: 0.6,
  roundness: 0.2,
  thickness: 2,
  fill: true,
  echoes: 1,
  spacing: 14,
  color: '',
  blur: 16,
  lensSize: 0.3,
  lensSoftness: 0.7,
  focus: false,
  chroma: 0.3,
  rotation: 0,
  spin: 0,
  idle: true
};

const PRESETS = {
  lens: {},
  focus: { focus: true, blur: 18, lensSize: 0.34 }
};

const PRESET_OPTIONS = [
  { value: 'lens', label: 'Lens' },
  { value: 'focus', label: 'Focus' }
];

const SHAPE_OPTIONS = [
  { value: 'logo', label: 'Logo' },
  { value: 'rect', label: 'Rectangle' },
  { value: 'circle', label: 'Circle' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'star', label: 'Star' }
];

const propData = [
  {
    name: 'shape',
    type: "'rect' | 'circle' | 'polygon' | 'star'",
    default: "'rect'",
    description: 'Shape to draw. A rectangle follows the container so it works as a frame.'
  },
  {
    name: 'src',
    type: 'string',
    default: '-',
    description:
      'URL of an SVG or transparent PNG to use as the shape instead. Its silhouette is traced, so outline, echoes and blur all work on it.'
  },
  { name: 'sides', type: 'number', default: '6', description: 'Sides of the polygon or points of the star.' },
  {
    name: 'size',
    type: 'number',
    default: '0.8',
    description: 'How much of the container the shape fills, from 0 to 1. 1 reaches the edges.'
  },
  { name: 'roundness', type: 'number', default: '0.2', description: 'Rounds the corners, from 0 to 1.' },
  { name: 'thickness', type: 'number', default: '2', description: 'Line width in pixels.' },
  { name: 'fill', type: 'boolean', default: 'false', description: 'Fills the shape instead of drawing its outline.' },
  {
    name: 'echoes',
    type: 'number',
    default: '1',
    description: 'Number of lines. Outlines nest inward and filled shapes ripple outward.'
  },
  { name: 'spacing', type: 'number', default: '12', description: 'Distance between echoes in pixels.' },
  {
    name: 'color',
    type: 'string',
    default: "'#ffffff'",
    description: 'Line color. Dark colors are drawn for light backgrounds.'
  },
  {
    name: 'blur',
    type: 'number',
    default: '16',
    description: 'How far out of focus the lens pushes the shape, in pixels.'
  },
  {
    name: 'lensSize',
    type: 'number',
    default: '0.3',
    description: 'Radius of the lens around the pointer, relative to the shorter side of the container.'
  },
  {
    name: 'lensSoftness',
    type: 'number',
    default: '0.7',
    description: 'How gradually the blur fades out toward the edge of the lens, from 0 to 1.'
  },
  {
    name: 'focus',
    type: 'boolean',
    default: 'false',
    description: 'Inverts the lens: the shape stays blurred and the pointer brings it into focus.'
  },
  {
    name: 'chroma',
    type: 'number',
    default: '0.3',
    description: 'Color fringing in the blurred parts, like a real lens, from 0 to 1.'
  },
  { name: 'rotation', type: 'number', default: '0', description: 'Rotation of the shape in degrees.' },
  { name: 'spin', type: 'number', default: '0', description: 'Rotation speed in degrees per second.' },
  {
    name: 'idle',
    type: 'boolean',
    default: 'true',
    description: 'Lets the lens drift on its own while the pointer is away.'
  },
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'Content centered on top of the shape, for example a headline inside a frame.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const ShapeBlurDemo = () => {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, form, ...settings } = props;
  const ink = useColorModeValue('#120f17', '#ffffff');
  const color = props.color || ink;
  const shapeProps = form === 'logo' ? { src: logo } : { shape: form };
  const computedProps = useMemo(
    () => (form === 'logo' ? { color, src: '/logo.svg' } : { color, shape: form }),
    [color, form]
  );

  const applyPreset = value => {
    updateProps({ ...DEFAULT_PROPS, ...PRESETS[value], preset: value });
  };

  const polygonal = form === 'polygon' || form === 'star';

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'form']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <ShapeBlur {...settings} {...shapeProps} color={color} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={form}
              onChange={value => updateProp('form', value)}
            />
            {polygonal && (
              <PreviewSlider
                title="Sides"
                min={3}
                max={12}
                step={1}
                value={props.sides}
                onChange={value => updateProp('sides', value)}
              />
            )}
            <PreviewColorPickerCustom title="Color" color={color} onChange={value => updateProp('color', value)} />
            <PreviewSlider
              title="Size"
              min={0.2}
              max={1}
              step={0.01}
              value={props.size}
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Roundness"
              min={0}
              max={1}
              step={0.05}
              value={props.roundness}
              onChange={value => updateProp('roundness', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.5}
              max={12}
              step={0.5}
              value={props.thickness}
              valueUnit="px"
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Echoes"
              min={1}
              max={20}
              step={1}
              value={props.echoes}
              onChange={value => updateProp('echoes', value)}
            />
            <PreviewSlider
              title="Spacing"
              min={4}
              max={60}
              step={1}
              value={props.spacing}
              valueUnit="px"
              onChange={value => updateProp('spacing', value)}
            />
            <PreviewSlider
              title="Blur"
              min={0}
              max={80}
              step={1}
              value={props.blur}
              valueUnit="px"
              onChange={value => updateProp('blur', value)}
            />
            <PreviewSlider
              title="Lens Size"
              min={0.05}
              max={1}
              step={0.01}
              value={props.lensSize}
              onChange={value => updateProp('lensSize', value)}
            />
            <PreviewSlider
              title="Lens Softness"
              min={0}
              max={1}
              step={0.05}
              value={props.lensSoftness}
              onChange={value => updateProp('lensSoftness', value)}
            />
            <PreviewSlider
              title="Chroma"
              min={0}
              max={1}
              step={0.05}
              value={props.chroma}
              onChange={value => updateProp('chroma', value)}
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
              title="Spin"
              min={-90}
              max={90}
              step={1}
              value={props.spin}
              valueUnit="°/s"
              onChange={value => updateProp('spin', value)}
            />
            <PreviewSwitch title="Fill" isChecked={props.fill} onChange={value => updateProp('fill', value)} />
            <PreviewSwitch title="Focus" isChecked={props.focus} onChange={value => updateProp('focus', value)} />
            <PreviewSwitch title="Idle Drift" isChecked={props.idle} onChange={value => updateProp('idle', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={shapeBlur} componentName="ShapeBlur" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ShapeBlurDemo;
