import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';

import Customize from '../../components/common/Preview/Customize';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Carousel from '../../content/Components/Carousel/Carousel';
import { carousel } from '../../constants/code/Components/carouselCode';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';

const DEFAULT_PROPS = {
  baseWidth: 300,
  autoplay: false,
  autoplayDelay: 3000,
  pauseOnHover: false,
  loop: false,
  round: false
};

const CarouselDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { baseWidth, autoplay, autoplayDelay, pauseOnHover, loop, round } = props;

  const [key, forceRerender] = useForceRerender();

  const propData = useMemo(
    () => [
      {
        name: 'items',
        type: 'CarouselItem[]',
        default: 'DEFAULT_ITEMS',
        description: 'An array of carousel items. Each item must include title, description, id, and icon.'
      },
      {
        name: 'baseWidth',
        type: 'number',
        default: '300',
        description: 'Total width (in px) of the carousel container. Effective item width is baseWidth minus padding.'
      },
      {
        name: 'autoplay',
        type: 'boolean',
        default: 'false',
        description: 'Enables automatic scrolling to the next item at a fixed interval.'
      },
      {
        name: 'autoplayDelay',
        type: 'number',
        default: '3000',
        description: 'Delay in milliseconds between automatic scrolls when autoplay is enabled.'
      },
      {
        name: 'pauseOnHover',
        type: 'boolean',
        default: 'false',
        description: 'Pauses the autoplay functionality when the carousel is hovered.'
      },
      {
        name: 'loop',
        type: 'boolean',
        default: 'false',
        description: 'When true, the carousel loops seamlessly from the last item back to the first.'
      },
      {
        name: 'round',
        type: 'boolean',
        default: 'false',
        description: 'When true, the carousel is rendered with a 1:1 aspect ratio and circular container/items.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow="hidden">
            <Carousel
              key={key}
              baseWidth={baseWidth}
              autoplay={autoplay}
              autoplayDelay={autoplayDelay}
              pauseOnHover={pauseOnHover}
              loop={loop}
              round={round}
            />
          </Box>

          <Customize>
            <PreviewSlider
              title="Width"
              min={250}
              max={330}
              step={10}
              value={baseWidth}
              onChange={val => {
                updateProp('baseWidth', val);
                forceRerender();
              }}
            />

            <PreviewSwitch
              title="Round Variant"
              isChecked={round}
              onChange={checked => {
                updateProp('round', checked);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="Loop"
              isChecked={loop}
              onChange={checked => {
                updateProp('loop', checked);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="Autoplay"
              isChecked={autoplay}
              onChange={checked => {
                updateProp('autoplay', checked);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Delay"
              min={1000}
              max={4000}
              step={1000}
              value={autoplayDelay}
              isDisabled={!autoplay}
              onChange={val => {
                updateProp('autoplayDelay', val);
                forceRerender();
              }}
            />

            <PreviewSwitch
              title="Pause On Hover"
              isChecked={pauseOnHover}
              isDisabled={!autoplay}
              onChange={checked => {
                updateProp('pauseOnHover', checked);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={carousel} componentName="Carousel" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CarouselDemo;
