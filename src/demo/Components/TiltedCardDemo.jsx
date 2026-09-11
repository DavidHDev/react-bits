import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';

import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import TiltedCard from '../../content/Components/TiltedCard/TiltedCard';
import { tiltedCard } from '../../constants/code/Components/tiltedCardCode';

const DEFAULT_PROPS = {
  rotateAmplitude: 12,
  scaleOnHover: 1.05,
  showTooltip: true,
  displayOverlayContent: true
};

const TiltedCardDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { rotateAmplitude, scaleOnHover, showTooltip, displayOverlayContent } = props;

  const propData = useMemo(
    () => [
      {
        name: 'imageSrc',
        type: 'string',
        default: 'N/A',
        description: 'The source URL of the image.'
      },
      {
        name: 'altText',
        type: 'string',
        default: 'Tilted card image',
        description: 'Alternative text for the image.'
      },
      {
        name: 'captionText',
        type: 'string',
        default: '',
        description: 'Text for the tooltip caption.'
      },
      {
        name: 'containerHeight',
        type: 'string',
        default: '300px',
        description: 'Height of the overall card container.'
      },
      {
        name: 'containerWidth',
        type: 'string',
        default: '100%',
        description: 'Width of the overall card container.'
      },
      {
        name: 'imageHeight',
        type: 'string',
        default: '300px',
        description: 'Height of the inner image.'
      },
      {
        name: 'imageWidth',
        type: 'string',
        default: '300px',
        description: 'Width of the inner image.'
      },
      {
        name: 'scaleOnHover',
        type: 'number',
        default: '1.1',
        description: 'Scaling factor applied on hover.'
      },
      {
        name: 'rotateAmplitude',
        type: 'number',
        default: '14',
        description: 'Controls how much the card tilts with mouse movement.'
      },
      {
        name: 'showMobileWarning',
        type: 'boolean',
        default: 'true',
        description: 'Whether to show a small alert about mobile usage.'
      },
      {
        name: 'showTooltip',
        type: 'boolean',
        default: 'true',
        description: 'Toggles the visibility of the tooltip (figcaption).'
      },
      {
        name: 'displayOverlayContent',
        type: 'boolean',
        default: 'false',
        description: 'Whether to display any overlayContent on top of the image.'
      },
      {
        name: 'overlayContent',
        type: 'ReactNode',
        default: 'null',
        description: 'A React node to display as an overlay on the card.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} overflow="hidden">
            <TiltedCard
              imageSrc="https://i.scdn.co/image/ab67616d0000b273d9985092cd88bffd97653b58"
              altText="Kendrick Lamar - GNX Album Cover"
              captionText="Kendrick Lamar - GNX"
              containerHeight="300px"
              containerWidth="300px"
              imageHeight="300px"
              imageWidth="300px"
              rotateAmplitude={rotateAmplitude}
              scaleOnHover={scaleOnHover}
              showMobileWarning={false}
              showTooltip={showTooltip}
              displayOverlayContent={displayOverlayContent}
              overlayContent={<p className="tilted-card-demo-text">Kendrick Lamar - GNX</p>}
            />
          </Box>

          <Customize className="preview-options">
            <PreviewSlider
              title="Rotate Amplitude"
              min={0}
              max={30}
              step={1}
              value={rotateAmplitude}
              onChange={val => updateProp('rotateAmplitude', val)}
            />

            <PreviewSlider
              title="Scale on Hover"
              min={1}
              max={1.5}
              step={0.05}
              value={scaleOnHover}
              onChange={val => updateProp('scaleOnHover', val)}
              displayValue={val => val.toFixed(2)}
            />

            <PreviewSwitch
              title="Show Tooltip"
              isChecked={showTooltip}
              onChange={checked => updateProp('showTooltip', checked)}
            />
            <PreviewSwitch
              title="Show Overlay Content"
              isChecked={displayOverlayContent}
              onChange={checked => updateProp('displayOverlayContent', checked)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={tiltedCard} componentName="TiltedCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TiltedCardDemo;
