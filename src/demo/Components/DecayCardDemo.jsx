import { useMemo } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import DecayCard from '../../content/Components/DecayCard/DecayCard';
import { decayCard } from '../../constants/code/Components/decayCardCode';

const DEFAULT_PROPS = {
  width: 300,
  height: 400,
  baseFrequency: 0.015,
  numOctaves: 5,
  seed: 4,
  maxDisplacement: 400,
  movementBound: 50
};

const DecayCardDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { width, height, baseFrequency, numOctaves, seed, maxDisplacement, movementBound } = props;
  const [key, forceRerender] = useForceRerender();

  const propData = useMemo(
    () => [
      {
        name: 'children',
        type: 'ReactNode',
        default: '',
        description: 'The content (JSX) to be rendered inside the card.'
      },
      {
        name: 'width',
        type: 'number',
        default: '300',
        description: 'The width of the card in pixels.'
      },
      {
        name: 'height',
        type: 'number',
        default: '400',
        description: 'The height of the card in pixels.'
      },
      {
        name: 'image',
        type: 'string',
        default: 'https://picsum.photos/300/400?grayscale',
        description: 'Allows setting the background image of the card.'
      },
      {
        name: 'baseFrequency',
        type: 'number',
        default: '0.015',
        description: 'Base frequency for the turbulence filter. Lower values create larger, smoother patterns.'
      },
      {
        name: 'numOctaves',
        type: 'number',
        default: '5',
        description: 'Number of octaves for the turbulence filter. Higher values add finer detail.'
      },
      {
        name: 'seed',
        type: 'number',
        default: '4',
        description: 'Seed value for the turbulence random number generator.'
      },
      {
        name: 'maxDisplacement',
        type: 'number',
        default: '400',
        description: 'Maximum displacement scale applied when the cursor moves. Controls the intensity of the decay effect.'
      },
      {
        name: 'movementBound',
        type: 'number',
        default: '50',
        description: 'Maximum pixel distance the card can translate from its origin when following the cursor.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} overflow="hidden">
            <DecayCard
              key={key}
              width={width}
              height={height}
              baseFrequency={baseFrequency}
              numOctaves={numOctaves}
              seed={seed}
              maxDisplacement={maxDisplacement}
              movementBound={movementBound}
            >
              <Text mixBlendMode="overlay">
                Decay
                <br />
                Card
              </Text>
            </DecayCard>
          </Box>

          <Customize>
            <PreviewSlider title="Width" min={100} max={600} step={25} value={width} onChange={v => { updateProp('width', v); forceRerender(); }} />
            <PreviewSlider title="Height" min={200} max={600} step={25} value={height} onChange={v => { updateProp('height', v); forceRerender(); }} />
            <PreviewSlider title="Base Frequency" min={0.001} max={0.1} step={0.001} value={baseFrequency} onChange={v => { updateProp('baseFrequency', v); forceRerender(); }} />
            <PreviewSlider title="Num Octaves" min={1} max={10} step={1} value={numOctaves} onChange={v => { updateProp('numOctaves', v); forceRerender(); }} />
            <PreviewSlider title="Seed" min={0} max={100} step={1} value={seed} onChange={v => { updateProp('seed', v); forceRerender(); }} />
            <PreviewSlider title="Max Displacement" min={50} max={1000} step={50} value={maxDisplacement} onChange={v => updateProp('maxDisplacement', v)} />
            <PreviewSlider title="Movement Bound" min={10} max={150} step={5} value={movementBound} onChange={v => updateProp('movementBound', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={decayCard} componentName="DecayCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default DecayCardDemo;
