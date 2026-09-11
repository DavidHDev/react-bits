import { useEffect, useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { useColorModeValue } from '../../components/setup/color-mode';

import ASCIIText from '@content/TextAnimations/ASCIIText/ASCIIText';
import { asciiText } from '../../constants/code/TextAnimations/asciiTextCode';

const DEFAULT_PROPS = {
  text: 'Hey!',
  enableWaves: true,
  asciiFontSize: 8
};

const propData = [
  {
    name: 'text',
    type: 'string',
    default: 'David!',
    description: 'The text displayed on the plane in the ASCII scene.'
  },
  {
    name: 'enableWaves',
    type: 'boolean',
    default: 'true',
    description: 'If false, disables the wavy text animation.'
  },
  {
    name: 'asciiFontSize',
    type: 'number',
    default: '8',
    description: 'Size of the ASCII glyphs in the overlay.'
  },
  {
    name: 'textFontSize',
    type: 'number',
    default: '200',
    description: "Pixel size for the text that's drawn onto the plane texture."
  },
  {
    name: 'planeBaseHeight',
    type: 'number',
    default: '8',
    description: 'How tall the plane is in 3D. The plane width is auto-based on text aspect.'
  },
  {
    name: 'textColor',
    type: 'string',
    default: '#fdf9f3',
    description: 'The color of the text drawn onto the plane texture.'
  },
  {
    name: 'strokeColor',
    type: 'string',
    default: 'N/A',
    description: 'Not used here, but you could add it if you want an outline effect.'
  }
];

const ASCIITextDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { text, enableWaves, asciiFontSize } = props;

  const [key, forceRerender] = useForceRerender();
  const textColor = useColorModeValue('#18181b', '#fdf9f3');
  const dependencyList = useMemo(() => ['three'], []);

  useEffect(() => {
    forceRerender();
  }, [forceRerender]);

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" minH={400} maxH={400} overflow="hidden" mb={6}>
            <ASCIIText
              key={key}
              text={text}
              enableWaves={enableWaves}
              asciiFontSize={asciiFontSize}
              textFontSize={250}
              planeBaseHeight={12}
              textColor={textColor}
            />
          </Box>

          <Customize>
            <PreviewInput
              title="Text"
              value={text}
              placeholder="Enter text..."
              width={200}
              maxLength={10}
              onChange={val => updateProp('text', val)}
            />

            <PreviewSlider
              title="Size"
              min={1}
              max={64}
              step={1}
              value={asciiFontSize}
              onChange={val => {
                updateProp('asciiFontSize', Number(val) || 1);
                forceRerender();
              }}
            />

            <PreviewSwitch
              title="Waves"
              isChecked={enableWaves}
              onChange={checked => {
                updateProp('enableWaves', checked);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={dependencyList} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={asciiText} componentName="ASCIIText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ASCIITextDemo;
