import { Box, Flex, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import { imageTrail } from '../../constants/code/Animations/imageTrailCode';
import ImageTrail from '../../content/Animations/ImageTrail/ImageTrail';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/ImageTrail';

const ITEMS = [
  'https://picsum.photos/id/287/300/300',
  'https://picsum.photos/id/1001/300/300',
  'https://picsum.photos/id/1025/300/300',
  'https://picsum.photos/id/1026/300/300',
  'https://picsum.photos/id/1027/300/300',
  'https://picsum.photos/id/1028/300/300',
  'https://picsum.photos/id/1029/300/300',
  'https://picsum.photos/id/1030/300/300'
];

const DEFAULT_PROPS = { preset: 'classic', ...LOOK };

const propData = [
  { name: 'items', type: 'string[]', default: '[]', description: 'Image URLs shown in the trail, in order.' },
  {
    name: 'size',
    type: 'number | string',
    default: '190',
    description: 'Width of each image in pixels, or any CSS length.'
  },
  { name: 'aspectRatio', type: 'number', default: '1.1', description: 'Width divided by height for each image.' },
  { name: 'radius', type: 'number | string', default: '15', description: 'Corner radius of the images.' },
  {
    name: 'threshold',
    type: 'number',
    default: '80',
    description: 'How far the cursor travels, in pixels, before the next image appears.'
  },
  { name: 'lifetime', type: 'number', default: '0.4', description: 'Seconds an image stays before it fades out.' },
  {
    name: 'appearScale',
    type: 'number',
    default: '1',
    description:
      'Size an image starts at as it appears. 0 grows it from nothing and 1 shows it at full size right away.'
  },
  {
    name: 'zoom',
    type: 'number',
    default: '1',
    description: 'How far each photo starts zoomed in before settling inside its frame. 1 turns it off.'
  },
  { name: 'flash', type: 'number', default: '0', description: 'Brightness flash as an image appears, from 0 to 1.' },
  {
    name: 'exitScale',
    type: 'number',
    default: '0.2',
    description: 'Size an image shrinks or grows to while it fades out. 1 keeps its size.'
  },
  {
    name: 'drift',
    type: 'number',
    default: '0',
    description: 'How far images keep flying in the direction of the cursor as they fade, from 0 to 1.'
  },
  { name: 'rotation', type: 'number', default: '0', description: 'Random tilt of each image, in degrees.' },
  {
    name: 'sizeVariance',
    type: 'number',
    default: '0',
    description: 'Random size variation between images, from 0 to 1.'
  },
  {
    name: 'alignToMotion',
    type: 'boolean',
    default: 'false',
    description: 'Turns each image to face the direction the cursor is moving.'
  },
  {
    name: 'stack',
    type: 'number',
    default: '0',
    description:
      'Keeps this many of the newest images on screen in a pile, instead of fading each one on its own. 0 turns it off.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '0',
    description: 'Tilts images in 3D toward the edge where they appear, in degrees.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const ImageTrailDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow="hidden">
            <ImageTrail key={key} items={ITEMS} {...settings} />

            <Flex position="absolute" justifyContent="center" flexDirection="column" alignItems="center">
              <Text className="demo-instruction" fontSize="clamp(2rem, 6vw, 6rem)" fontWeight={600} mb={0}>
                Hover Me.
              </Text>
            </Flex>
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="image-trail" currentProps={settings} defaultProps={LOOK} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSlider
              title="Size"
              min={80}
              max={320}
              step={10}
              value={settings.size}
              valueUnit="px"
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={60}
              step={1}
              value={settings.radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSlider
              title="Threshold"
              min={20}
              max={200}
              step={5}
              value={settings.threshold}
              valueUnit="px"
              onChange={value => updateProp('threshold', value)}
            />
            <PreviewSlider
              title="Lifetime"
              min={0.1}
              max={2}
              step={0.05}
              value={settings.lifetime}
              valueUnit="s"
              onChange={value => updateProp('lifetime', value)}
            />
            <PreviewSlider
              title="Appear Scale"
              min={0}
              max={1}
              step={0.05}
              value={settings.appearScale}
              onChange={value => updateProp('appearScale', value)}
            />
            <PreviewSlider
              title="Exit Scale"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.exitScale}
              onChange={value => updateProp('exitScale', value)}
            />
            <PreviewSlider
              title="Zoom"
              min={1}
              max={3}
              step={0.1}
              value={settings.zoom}
              onChange={value => updateProp('zoom', value)}
            />
            <PreviewSlider
              title="Flash"
              min={0}
              max={1}
              step={0.05}
              value={settings.flash}
              onChange={value => updateProp('flash', value)}
            />
            <PreviewSlider
              title="Drift"
              min={0}
              max={1}
              step={0.05}
              value={settings.drift}
              onChange={value => updateProp('drift', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={0}
              max={30}
              step={1}
              value={settings.rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Size Variance"
              min={0}
              max={1}
              step={0.05}
              value={settings.sizeVariance}
              onChange={value => updateProp('sizeVariance', value)}
            />
            <PreviewSlider
              title="Stack"
              min={0}
              max={7}
              step={1}
              value={settings.stack}
              onChange={value => updateProp('stack', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={40}
              step={1}
              value={settings.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSwitch
              title="Align to Motion"
              isChecked={settings.alignToMotion}
              onChange={value => updateProp('alignToMotion', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={imageTrail} componentName="ImageTrail" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ImageTrailDemo;
