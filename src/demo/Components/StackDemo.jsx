import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Stack from '../../content/Components/Stack/Stack';
import { stack } from '../../constants/code/Components/stackCode';

const IMAGES = [
  'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1781242629922-6f39cc3671cd?q=80&w=500&auto=format'
];

const LAYOUT_OPTIONS = [
  { label: 'Fan', value: 'fan' },
  { label: 'Cascade', value: 'cascade' },
  { label: 'Deck', value: 'deck' },
  { label: 'Pile', value: 'pile' }
];

const DEFAULT_PROPS = {
  layout: 'fan',
  visible: 4,
  spread: 0.5,
  depth: 0.5,
  radius: 16,
  frame: 0,
  frameColor: '#ffffff',
  shadow: true,
  tilt: 30,
  threshold: 90,
  speed: 1,
  sendToBackOnClick: false,
  autoplay: false,
  autoplayDelay: 3000,
  pauseOnHover: false
};

const StackDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [key, forceRerender] = useForceRerender();

  const cards = useMemo(
    () => IMAGES.map((src, index) => <img key={src} src={src} alt={`Card ${index + 1}`} draggable={false} />),
    []
  );

  const propData = useMemo(
    () => [
      {
        name: 'cards',
        type: 'ReactNode[]',
        default: 'four sample photos',
        description:
          'The cards in the stack, top first. Images fill the card automatically, any other content works too.'
      },
      {
        name: 'layout',
        type: "'fan' | 'cascade' | 'deck' | 'pile'",
        default: "'fan'",
        description:
          'How the cards behind sit. Fan tilts them out from a corner, cascade offsets them diagonally, deck stacks them upward and pile scatters them like loose photos.'
      },
      {
        name: 'visible',
        type: 'number',
        default: '4',
        description: 'How many cards show, counting the top one. The rest wait hidden at the back.'
      },
      {
        name: 'spread',
        type: 'number',
        default: '0.5',
        description: 'How far the cards behind fan, offset or scatter, from 0 for a neat stack to 1 for a wide one.'
      },
      {
        name: 'depth',
        type: 'number',
        default: '0.5',
        description: 'How much smaller and darker each card behind gets, from 0 for none to 1 for a strong recede.'
      },
      {
        name: 'radius',
        type: 'number',
        default: '16',
        description: 'Corner radius of the cards in pixels.'
      },
      {
        name: 'frame',
        type: 'number',
        default: '0',
        description: 'Width of a border around each card in pixels, like the edge of a printed photo.'
      },
      {
        name: 'frameColor',
        type: 'string',
        default: "'#ffffff'",
        description: 'Color of the frame around each card.'
      },
      {
        name: 'shadow',
        type: 'boolean',
        default: 'true',
        description: 'Gives every card a soft drop shadow.'
      },
      {
        name: 'tilt',
        type: 'number',
        default: '30',
        description:
          'How far the top card leans in 3D while it is dragged, in degrees. It tilts around the point you hold and leans into fast moves. Use 0 to keep it flat.'
      },
      {
        name: 'threshold',
        type: 'number',
        default: '90',
        description:
          'How far in pixels the top card has to be dragged before it goes to the back. A quick flick works too.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '1',
        description: 'Speed of every animation, from 0.5 for slow and soft to 2 for fast and snappy.'
      },
      {
        name: 'sendToBackOnClick',
        type: 'boolean',
        default: 'false',
        description: 'Clicking the top card also sends it to the back.'
      },
      {
        name: 'autoplay',
        type: 'boolean',
        default: 'false',
        description: 'Cycles through the cards on its own.'
      },
      {
        name: 'autoplayDelay',
        type: 'number',
        default: '3000',
        description: 'Time in milliseconds between automatic cycles.'
      },
      {
        name: 'pauseOnHover',
        type: 'boolean',
        default: 'false',
        description: 'Pauses autoplay while the pointer is over the stack.'
      },
      {
        name: 'onChange',
        type: '(index: number) => void',
        default: '-',
        description: 'Called with the index of the new top card whenever the stack moves.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root element.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={480} overflow="hidden">
            <div style={{ width: 230, height: 230 }}>
              <Stack key={key} cards={cards} {...props} />
            </div>
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect
              title="Layout"
              options={LAYOUT_OPTIONS}
              value={props.layout}
              onChange={value => updateProp('layout', value)}
            />
            <PreviewSlider
              title="Visible Cards"
              min={1}
              max={6}
              step={1}
              value={props.visible}
              onChange={value => updateProp('visible', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={1}
              step={0.05}
              value={props.spread}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0}
              max={1}
              step={0.05}
              value={props.depth}
              onChange={value => updateProp('depth', value)}
            />

            <PreviewSlider
              title="Corner Radius"
              min={0}
              max={40}
              step={1}
              value={props.radius}
              onChange={value => updateProp('radius', value)}
              displayValue={value => `${value}px`}
            />
            <PreviewSlider
              title="Frame"
              min={0}
              max={16}
              step={1}
              value={props.frame}
              onChange={value => updateProp('frame', value)}
              displayValue={value => `${value}px`}
            />
            <PreviewColorPickerCustom
              title="Frame Color"
              color={props.frameColor}
              onChange={value => updateProp('frameColor', value)}
            />
            <PreviewSwitch title="Shadow" isChecked={props.shadow} onChange={value => updateProp('shadow', value)} />

            <PreviewSlider
              title="Tilt"
              min={0}
              max={60}
              step={1}
              value={props.tilt}
              onChange={value => updateProp('tilt', value)}
              displayValue={value => `${value}°`}
            />
            <PreviewSlider
              title="Swipe Threshold"
              min={30}
              max={200}
              step={10}
              value={props.threshold}
              onChange={value => updateProp('threshold', value)}
              displayValue={value => `${value}px`}
            />
            <PreviewSlider
              title="Speed"
              min={0.5}
              max={2}
              step={0.1}
              value={props.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSwitch
              title="Send To Back On Click"
              isChecked={props.sendToBackOnClick}
              onChange={value => updateProp('sendToBackOnClick', value)}
            />

            <PreviewSwitch
              title="Autoplay"
              isChecked={props.autoplay}
              onChange={value => updateProp('autoplay', value)}
            />
            <PreviewSlider
              title="Autoplay Delay"
              min={1000}
              max={6000}
              step={250}
              value={props.autoplayDelay}
              onChange={value => updateProp('autoplayDelay', value)}
              displayValue={value => `${value}ms`}
            />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={props.pauseOnHover}
              onChange={value => updateProp('pauseOnHover', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={stack} componentName="Stack" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default StackDemo;
