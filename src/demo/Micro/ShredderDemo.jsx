import { useMemo, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import Shredder from '../../content/Micro/Shredder/Shredder';
import { shredder } from '../../constants/code/Micro/shredderCode';

const photo = id => `https://images.unsplash.com/${id}?q=80&w=160&h=160&auto=format&fit=crop`;

const FILES = [
  {
    title: 'Harbour at dusk',
    meta: 'Edited yesterday',
    size: '4.1 MB',
    image: photo('photo-1782977389500-dd7adad33ebe')
  },
  {
    title: 'Studio, take two',
    meta: 'Edited 2 days ago',
    size: '2.8 MB',
    image: photo('photo-1776394254711-4a0d7345269a')
  },
  {
    title: 'Fog over the bay',
    meta: 'Edited last week',
    size: '6.3 MB',
    image: photo('photo-1781499455083-6ccc3beb20cd')
  },
  { title: 'Sunday market', meta: 'Edited 12 Mar', size: '3.5 MB', image: photo('photo-1781242629922-6f39cc3671cd') }
];

const build = run => FILES.map((file, i) => ({ ...file, id: `${run}-${i}` }));

const ROW_RADIUS = 12;
const ROW_PAD = 6;

const DEFAULT_PROPS = {
  width: 340,
  height: 460,
  inset: 14,
  gap: 10,
  slitHeight: 4,
  fallHeight: 140,
  feedSpeed: 180,
  bite: 18,
  autoFeed: true,
  stripWidth: 10,
  curl: 1,
  autoAnimate: false,
  loop: false,
  loopAfterDelete: false,
  dragTilt: 6,
  lift: 1.02,
  slitColor: '#3f3f46',
  color: '#f5f5f5',
  disabled: false
};

const Row = ({ item, surface }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: `${ROW_PAD}px 14px ${ROW_PAD}px ${ROW_PAD}px`,
      borderRadius: ROW_RADIUS,
      background: surface,
      boxSizing: 'border-box'
    }}
  >
    <img
      src={item.image}
      alt=""
      draggable={false}
      style={{
        width: 48,
        height: 48,
        borderRadius: ROW_RADIUS - ROW_PAD,
        objectFit: 'cover',
        flex: 'none',
        display: 'block',
        filter: 'grayscale(1)'
      }}
    />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1, textAlign: 'left' }}>
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {item.title}
      </span>
      <span style={{ fontSize: 12, lineHeight: 1.2, opacity: 0.5, whiteSpace: 'nowrap' }}>{item.meta}</span>
    </div>
    <span style={{ fontSize: 12, lineHeight: 1, opacity: 0.45, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>
      {item.size}
    </span>
  </div>
);

const ShredderDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    width,
    height,
    inset,
    gap,
    slitHeight,
    fallHeight,
    feedSpeed,
    bite,
    autoFeed,
    stripWidth,
    curl,
    autoAnimate,
    loop,
    loopAfterDelete,
    dragTilt,
    lift,
    slitColor,
    color,
    disabled
  } = props;
  const [run, setRun] = useState(0);
  const [items, setItems] = useState(() => build(0));

  const renderedSlit = useColorModeValue(slitColor === DEFAULT_PROPS.slitColor ? '#18181b' : slitColor, slitColor);
  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const surface = useColorModeValue('#f6f6f6', '#27272a');

  const restart = () => {
    setRun(r => {
      const next = r + 1;
      setItems(build(next));
      return next;
    });
  };

  const propData = useMemo(
    () => [
      {
        name: 'items',
        type: 'T[]',
        default: '[]',
        description: 'Rows to render, top to bottom. Each item needs a unique id.'
      },
      {
        name: 'renderItem',
        type: '(item: T, index: number) => ReactNode',
        default: '-',
        description:
          'Renders one row. A snapshot of the rendered row is what gets cut into strips, so plain markup, inline images and inline SVG all work.'
      },
      {
        name: 'onShred',
        type: '(item: T) => void',
        default: '-',
        description:
          'Called the moment a row has gone through the rollers. Remove the item from your list here, unless loop, loopAfterDelete or autoAnimate is on.'
      },
      {
        name: 'onReorder',
        type: '(items: T[]) => void',
        default: '-',
        description: 'Called with the items in their new order after a row is dropped somewhere else in the list.'
      },
      { name: 'width', type: 'number', default: '340', description: 'Width of the whole machine in pixels.' },
      {
        name: 'height',
        type: 'number',
        default: '460',
        description: 'Total height. The rows stack up from the slit, which sits above the fall zone at the bottom.'
      },
      {
        name: 'inset',
        type: 'number',
        default: '14',
        description: 'Horizontal inset of the rows from the edges. The slit is 6px wider than the rows on each side.'
      },
      { name: 'gap', type: 'number', default: '10', description: 'Space between rows in pixels.' },
      {
        name: 'slitHeight',
        type: 'number',
        default: '4',
        description: 'Thickness of the slit. It is always a full pill.'
      },
      {
        name: 'fallHeight',
        type: 'number',
        default: '140',
        description: 'Height of the zone under the slit where the strips fall and fade out.'
      },
      {
        name: 'feedSpeed',
        type: 'number',
        default: '180',
        description: 'Roller speed in pixels per second. The first pull is faster and eases into it.'
      },
      {
        name: 'bite',
        type: 'number',
        default: '18',
        description: 'How far a row has to be pushed into the slit before the rollers grab it, in pixels.'
      },
      {
        name: 'autoFeed',
        type: 'boolean',
        default: 'true',
        description:
          'Grab the row as soon as it is pushed in far enough, even while it is still held. Off, it feeds only on release over the slit.'
      },
      {
        name: 'stripWidth',
        type: 'number',
        default: '10',
        description: 'Target width of each strip in pixels. The row is cut into equal columns.'
      },
      {
        name: 'curl',
        type: 'number',
        default: '1',
        description: 'How much the strips curl and wave as they come out. 0 keeps them straight.'
      },
      {
        name: 'autoAnimate',
        type: 'boolean',
        default: 'false',
        description:
          'Plays through the rows on its own, bottom to top, then brings them back and starts over. Keep the rows in your list while it runs; onShred still fires.'
      },
      {
        name: 'loop',
        type: 'boolean',
        default: 'false',
        description:
          'Once the last row has been shredded, bring them all back. Keep the rows in your list while it is on.'
      },
      {
        name: 'loopAfterDelete',
        type: 'boolean',
        default: 'false',
        description:
          'After a row is shredded it comes back a moment later at a random spot, so the list never runs dry. Keep the rows in your list while it is on.'
      },
      {
        name: 'dragTilt',
        type: 'number',
        default: '6',
        description: 'Maximum lean in degrees while a row is dragged sideways.'
      },
      { name: 'lift', type: 'number', default: '1.02', description: 'Scale of a row while it is held.' },
      { name: 'slitColor', type: 'string', default: '"#3f3f46"', description: 'Colour of the slit.' },
      { name: 'color', type: 'string', default: '"#f5f5f5"', description: 'Text colour inherited by the rows.' },
      {
        name: 'disabled',
        type: 'boolean',
        default: 'false',
        description: 'Rows cannot be dragged or shredded.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={520} overflow="hidden">
            <RefreshButton onClick={restart} />
            <Shredder
              key={run}
              items={items}
              renderItem={item => <Row item={item} surface={surface} />}
              onShred={item => {
                if (!autoAnimate && !loop && !loopAfterDelete) setItems(prev => prev.filter(row => row.id !== item.id));
              }}
              onReorder={next => setItems(next)}
              width={width}
              height={height}
              inset={inset}
              gap={gap}
              slitHeight={slitHeight}
              fallHeight={fallHeight}
              feedSpeed={feedSpeed}
              bite={bite}
              autoFeed={autoFeed}
              stripWidth={stripWidth}
              curl={curl}
              autoAnimate={autoAnimate}
              loop={loop}
              loopAfterDelete={loopAfterDelete}
              dragTilt={dragTilt}
              lift={lift}
              slitColor={renderedSlit}
              color={renderedColor}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewSlider
              title="Feed speed"
              min={60}
              max={600}
              step={10}
              value={feedSpeed}
              valueUnit="px/s"
              onChange={val => updateProp('feedSpeed', val)}
            />
            <PreviewSlider
              title="Bite"
              min={4}
              max={40}
              step={1}
              value={bite}
              valueUnit="px"
              onChange={val => updateProp('bite', val)}
            />
            <PreviewSwitch title="Auto feed" isChecked={autoFeed} onChange={val => updateProp('autoFeed', val)} />
            <PreviewSlider
              title="Strip width"
              min={4}
              max={40}
              step={1}
              value={stripWidth}
              valueUnit="px"
              onChange={val => updateProp('stripWidth', val)}
            />
            <PreviewSlider
              title="Curl"
              min={0}
              max={2}
              step={0.1}
              value={curl}
              onChange={val => updateProp('curl', val)}
            />
            <PreviewSwitch
              title="Auto animate"
              isChecked={autoAnimate}
              onChange={val => {
                updateProp('autoAnimate', val);
                restart();
              }}
            />
            <PreviewSwitch title="Loop" isChecked={loop} onChange={val => updateProp('loop', val)} />
            <PreviewSwitch
              title="Loop after delete"
              isChecked={loopAfterDelete}
              onChange={val => updateProp('loopAfterDelete', val)}
            />
            <PreviewSlider
              title="Drag tilt"
              min={0}
              max={16}
              step={1}
              value={dragTilt}
              valueUnit="°"
              onChange={val => updateProp('dragTilt', val)}
            />
            <PreviewSlider
              title="Lift"
              min={1}
              max={1.1}
              step={0.01}
              value={lift}
              onChange={val => updateProp('lift', val)}
            />
            <PreviewSlider
              title="Width"
              min={260}
              max={460}
              step={10}
              value={width}
              valueUnit="px"
              onChange={val => updateProp('width', val)}
            />
            <PreviewSlider
              title="Height"
              min={300}
              max={500}
              step={10}
              value={height}
              valueUnit="px"
              onChange={val => updateProp('height', val)}
            />
            <PreviewSlider
              title="Inset"
              min={6}
              max={30}
              step={1}
              value={inset}
              valueUnit="px"
              onChange={val => updateProp('inset', val)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={24}
              step={1}
              value={gap}
              valueUnit="px"
              onChange={val => updateProp('gap', val)}
            />
            <PreviewSlider
              title="Slit thickness"
              min={1}
              max={14}
              step={1}
              value={slitHeight}
              valueUnit="px"
              onChange={val => updateProp('slitHeight', val)}
            />
            <PreviewSlider
              title="Fall height"
              min={60}
              max={240}
              step={5}
              value={fallHeight}
              valueUnit="px"
              onChange={val => updateProp('fallHeight', val)}
            />
            <PreviewColorPickerCustom
              title="Slit"
              color={renderedSlit}
              onChange={val => updateProp('slitColor', val)}
            />
            <PreviewColorPickerCustom title="Text" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={shredder} componentName="Shredder" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ShredderDemo;
