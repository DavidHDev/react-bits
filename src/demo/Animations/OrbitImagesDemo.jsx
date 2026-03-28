import { useMemo } from 'react';
import { Flex } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import CodeExample from '../../components/code/CodeExample';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import OrbitImages from '../../content/Animations/OrbitImages/OrbitImages';
import { orbitImages } from '../../constants/code/Animations/orbitImagesCode';

const SHAPE_OPTIONS = [
  { label: 'Ellipse', value: 'ellipse' },
  { label: 'Circle', value: 'circle' },
  { label: 'Square', value: 'square' },
  { label: 'Rectangle', value: 'rectangle' },
  { label: 'Triangle', value: 'triangle' },
  { label: 'Star', value: 'star' },
  { label: 'Heart', value: 'heart' },
  { label: 'Infinity', value: 'infinity' },
  { label: 'Wave', value: 'wave' }
];

const DIRECTION_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Reverse', value: 'reverse' }
];

const DEFAULT_PROPS = {
  shape: 'ellipse',
  radiusX: 340,
  radiusY: 80,
  radius: 160,
  rotation: -8,
  duration: 30,
  itemSize: 80,
  direction: 'normal',
  fill: true,
  showPath: true,
  paused: false
};

const OrbitImagesDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { shape, radiusX, radiusY, radius, rotation, duration, itemSize, direction, fill, showPath, paused } = props;

  const images = [
    'https://picsum.photos/300/300?grayscale&random=1',
    'https://picsum.photos/300/300?grayscale&random=2',
    'https://picsum.photos/300/300?grayscale&random=3',
    'https://picsum.photos/300/300?grayscale&random=4',
    'https://picsum.photos/300/300?grayscale&random=5',
    'https://picsum.photos/300/300?grayscale&random=6'
  ];

  const propData = useMemo(
    () => [
      { name: 'images', type: 'string[]', default: '[]', description: 'Array of image URLs to orbit along the path.' },
      {
        name: 'altPrefix',
        type: 'string',
        default: '"Orbiting image"',
        description: 'Prefix for auto-generated alt attributes.'
      },
      {
        name: 'shape',
        type: 'string',
        default: '"ellipse"',
        description:
          'Preset shape: ellipse, circle, square, rectangle, triangle, star, heart, infinity, wave, or custom.'
      },
      {
        name: 'customPath',
        type: 'string',
        default: 'undefined',
        description: 'Custom SVG path string (used when shape="custom").'
      },
      {
        name: 'baseWidth',
        type: 'number',
        default: '1400',
        description: 'Base width for the design coordinate space used for responsive scaling.'
      },
      {
        name: 'radiusX',
        type: 'number',
        default: '700',
        description: 'Horizontal radius for ellipse/rectangle shapes.'
      },
      { name: 'radiusY', type: 'number', default: '170', description: 'Vertical radius for ellipse/rectangle shapes.' },
      {
        name: 'radius',
        type: 'number',
        default: '300',
        description: 'Radius for circle, square, triangle, star, heart shapes.'
      },
      { name: 'starPoints', type: 'number', default: '5', description: 'Number of points for star shape.' },
      { name: 'starInnerRatio', type: 'number', default: '0.5', description: 'Inner radius ratio for star (0-1).' },
      {
        name: 'rotation',
        type: 'number',
        default: '-8',
        description: 'Rotation angle of the entire orbit path in degrees.'
      },
      { name: 'duration', type: 'number', default: '40', description: 'Duration of one complete orbit in seconds.' },
      { name: 'itemSize', type: 'number', default: '64', description: 'Width/height of each orbiting item in pixels.' },
      {
        name: 'direction',
        type: 'string',
        default: '"normal"',
        description: 'Animation direction: "normal" or "reverse".'
      },
      {
        name: 'fill',
        type: 'boolean',
        default: 'true',
        description: 'Whether to distribute items evenly around the orbit.'
      },
      { name: 'width', type: 'number | "100%"', default: '100', description: 'Container width in pixels or "100%".' },
      { name: 'height', type: 'number | "auto"', default: '100', description: 'Container height in pixels or "auto".' },
      { name: 'className', type: 'string', default: '""', description: 'Additional CSS class for the container.' },
      {
        name: 'showPath',
        type: 'boolean',
        default: 'false',
        description: 'Whether to show the orbit path for debugging.'
      },
      {
        name: 'pathColor',
        type: 'string',
        default: '"rgba(0,0,0,0.1)"',
        description: 'Stroke color when showPath is true.'
      },
      { name: 'pathWidth', type: 'number', default: '2', description: 'Stroke width when showPath is true.' },
      {
        name: 'easing',
        type: 'string',
        default: '"linear"',
        description: 'Animation easing: linear, easeIn, easeOut, easeInOut.'
      },
      { name: 'paused', type: 'boolean', default: 'false', description: 'Whether the animation is paused.' },
      {
        name: 'centerContent',
        type: 'ReactNode',
        default: 'undefined',
        description: 'Custom content rendered at the center of the orbit.'
      },
      {
        name: 'responsive',
        type: 'boolean',
        default: 'false',
        description: 'Enable responsive scaling based on container width.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Flex
            overflow="hidden"
            justifyContent="center"
            alignItems="center"
            h={400}
            position="relative"
            className="demo-container"
          >
            <OrbitImages
              key={key}
              images={images}
              shape={shape}
              radiusX={radiusX}
              radiusY={radiusY}
              radius={radius}
              rotation={rotation}
              duration={duration}
              itemSize={itemSize}
              direction={direction}
              fill={fill}
              showPath={showPath}
              paused={paused}
              responsive={true}
              pathColor="rgba(255,255,255,0.15)"
            />
            <RefreshButton onClick={forceRerender} />
          </Flex>

          <Customize>
            <PreviewSelect
              title="Shape"
              name="orbit-shape"
              width={140}
              value={shape}
              options={SHAPE_OPTIONS}
              onChange={val => {
                updateProp('shape', val);
                forceRerender();
              }}
            />

            <PreviewSelect
              title="Direction"
              name="orbit-direction"
              width={120}
              value={direction}
              options={DIRECTION_OPTIONS}
              onChange={val => {
                updateProp('direction', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Radius X"
              min={50}
              max={600}
              step={10}
              value={radiusX}
              valueUnit="px"
              onChange={val => {
                updateProp('radiusX', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Radius Y"
              min={50}
              max={600}
              step={10}
              value={radiusY}
              valueUnit="px"
              onChange={val => {
                updateProp('radiusY', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Radius"
              min={50}
              max={600}
              step={10}
              value={radius}
              valueUnit="px"
              onChange={val => {
                updateProp('radius', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Rotation"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              valueUnit="°"
              onChange={val => {
                updateProp('rotation', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Duration"
              min={5}
              max={120}
              step={5}
              value={duration}
              valueUnit="s"
              onChange={val => {
                updateProp('duration', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Item Size"
              min={20}
              max={120}
              step={4}
              value={itemSize}
              valueUnit="px"
              onChange={val => {
                updateProp('itemSize', val);
                forceRerender();
              }}
            />

            <PreviewSwitch
              title="Fill (Distribute Evenly)"
              isChecked={fill}
              onChange={checked => {
                updateProp('fill', checked);
                forceRerender();
              }}
            />

            <PreviewSwitch
              title="Show Path"
              isChecked={showPath}
              onChange={checked => {
                updateProp('showPath', checked);
                forceRerender();
              }}
            />

            <PreviewSwitch
              title="Paused"
              isChecked={paused}
              onChange={checked => {
                updateProp('paused', checked);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={orbitImages} componentName="OrbitImages" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default OrbitImagesDemo;
