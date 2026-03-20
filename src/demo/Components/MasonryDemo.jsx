import { useMemo, useState } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';

import { masonry } from '../../constants/code/Components/masonryCode';
import Masonry from '../../content/Components/Masonry/Masonry';

const DEFAULT_PROPS = {
  ease: 'power3.out',
  animateFrom: 'bottom',
  duration: 0.6,
  stagger: 0.05,
  scaleOnHover: true,
  blurToFocus: true,
  colorShiftOnHover: false
};

const MasonryDemo = () => {
  const [key, setKey] = useState(0);
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { ease, animateFrom, duration, stagger, scaleOnHover, blurToFocus, colorShiftOnHover } = props;

  const easeOptions = [
    { value: 'power1.out', label: 'power1.out' },
    { value: 'power2.out', label: 'power2.out' },
    { value: 'power3.out', label: 'power3.out' },
    { value: 'power4.out', label: 'power4.out' },
    { value: 'back.out', label: 'back.out' },
    { value: 'bounce.out', label: 'bounce.out' },
    { value: 'elastic.out', label: 'elastic.out' },
    { value: 'sine.out', label: 'sine.out' }
  ];

  const animateFromOptions = [
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'center', label: 'Center' },
    { value: 'random', label: 'Random' }
  ];

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  const propData = useMemo(
    () => [
      {
        name: 'items',
        type: 'array',
        default: 'required',
        description:
          'Array of items to display in the masonry layout. Each item should have id, img, url, and height properties.'
      },
      {
        name: 'ease',
        type: 'string',
        default: '"power3.out"',
        description: 'GSAP easing function for animations.'
      },
      {
        name: 'duration',
        type: 'number',
        default: '0.6',
        description: 'Duration of the transition animations in seconds.'
      },
      {
        name: 'stagger',
        type: 'number',
        default: '0.05',
        description: "Delay between each item's animation in seconds."
      },
      {
        name: 'animateFrom',
        type: 'string',
        default: '"bottom"',
        description:
          "Direction from which items animate in. Options: 'top', 'bottom', 'left', 'right', 'center', 'random'."
      },
      {
        name: 'scaleOnHover',
        type: 'boolean',
        default: 'true',
        description: 'Whether items should scale on hover.'
      },
      {
        name: 'hoverScale',
        type: 'number',
        default: '0.95',
        description: 'Scale value when hovering over items (only applies if scaleOnHover is true).'
      },
      {
        name: 'blurToFocus',
        type: 'boolean',
        default: 'true',
        description: 'Whether items should animate from blurred to focused on initial load.'
      },
      {
        name: 'colorShiftOnHover',
        type: 'boolean',
        default: 'false',
        description: 'Whether to show a color overlay effect on hover.'
      },
      {
        name: 'adjustHeight',
        type: 'boolean',
        default: 'false',
        description: 'Automatically adjusts container height to fit all items and prevent overlap.'
      }
    ],
    []
  );

  const items = [
    {
      id: '1',
      img: 'https://picsum.photos/id/1015/600/900?grayscale',
      url: 'https://example.com/one',
      height: 400
    },
    {
      id: '2',
      img: 'https://picsum.photos/id/1011/600/750?grayscale',
      url: 'https://example.com/two',
      height: 250
    },
    {
      id: '3',
      img: 'https://picsum.photos/id/1020/600/800?grayscale',
      url: 'https://example.com/three',
      height: 600
    },
    {
      id: '4',
      img: 'https://picsum.photos/id/1018/600/660?grayscale',
      url: 'https://example.com/four',
      height: 260
    },
    {
      id: '5',
      img: 'https://picsum.photos/id/1016/600/520?grayscale',
      url: 'https://example.com/five',
      height: 120
    },
    {
      id: '6',
      img: 'https://picsum.photos/id/1025/600/850?grayscale',
      url: 'https://example.com/six',
      height: 850
    },
    {
      id: '7',
      img: 'https://picsum.photos/id/1031/600/720?grayscale',
      url: 'https://example.com/seven',
      height: 720
    },
    {
      id: '8',
      img: 'https://picsum.photos/id/1035/600/680?grayscale',
      url: 'https://example.com/eight',
      height: 200
    },
    {
      id: '9',
      img: 'https://picsum.photos/id/1040/600/950?grayscale',
      url: 'https://example.com/nine',
      height: 350
    },
    {
      id: '10',
      img: 'https://picsum.photos/id/1043/600/600?grayscale',
      url: 'https://example.com/ten',
      height: 300
    },
    {
      id: '11',
      img: 'https://picsum.photos/id/1050/600/780?grayscale',
      url: 'https://example.com/eleven',
      height: 350
    },
    {
      id: '12',
      img: 'https://picsum.photos/id/1055/600/640?grayscale',
      url: 'https://example.com/twelve',
      height: 240
    },
    {
      id: '13',
      img: 'https://picsum.photos/id/1060/600/820?grayscale',
      url: 'https://example.com/thirteen',
      height: 320
    },
    {
      id: '14',
      img: 'https://picsum.photos/id/1065/600/590?grayscale',
      url: 'https://example.com/fourteen',
      height: 290
    }
  ];

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={700} overflow="hidden">
            <RefreshButton onClick={handleRefresh} />
            <Masonry
              key={key}
              items={items}
              ease={ease}
              animateFrom={animateFrom}
              duration={duration}
              stagger={stagger}
              scaleOnHover={scaleOnHover}
              blurToFocus={blurToFocus}
              colorShiftOnHover={colorShiftOnHover}
              autoAdjust={false}
            />
          </Box>

          <Customize>
            <PreviewSelect
              title="Ease"
              options={easeOptions}
              value={ease}
              width={120}
              onChange={val => updateProp('ease', val)}
            />

            <PreviewSelect
              title="Animate From"
              options={animateFromOptions}
              value={animateFrom}
              width={120}
              onChange={val => updateProp('animateFrom', val)}
            />

            <PreviewSlider
              title="Duration"
              min={0.1}
              max={2.0}
              step={0.1}
              value={duration}
              valueUnit="s"
              width={150}
              onChange={val => updateProp('duration', val)}
            />

            <PreviewSlider
              title="Stagger"
              min={0.01}
              max={0.2}
              step={0.01}
              value={stagger}
              valueUnit="s"
              width={150}
              onChange={val => updateProp('stagger', val)}
            />

            <PreviewSwitch
              title="Scale on Hover"
              isChecked={scaleOnHover}
              onChange={val => updateProp('scaleOnHover', val)}
            />

            <PreviewSwitch
              title="Blur to Focus"
              isChecked={blurToFocus}
              onChange={val => updateProp('blurToFocus', val)}
            />

            <PreviewSwitch
              title="Color Shift on Hover"
              isChecked={colorShiftOnHover}
              onChange={val => updateProp('colorShiftOnHover', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={masonry} componentName="Masonry" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default MasonryDemo;
