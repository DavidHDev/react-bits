import { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';

import Dependencies from '../../components/code/Dependencies';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import Customize from '../../components/common/Preview/Customize';

import TrueFocus from '../../content/TextAnimations/TrueFocus/TrueFocus';
import { trueFocus } from '../../constants/code/TextAnimations/trueFocusCode';

const TrueFocusDemo = () => {
  const [manualMode, setManualMode] = useState(false);
  const [blurAmount, setBlurAmount] = useState(5);
  const [animationDuration, setAnimationDuration] = useState(0.5);
  const [pauseBetweenAnimations, setPauseBetweenAnimations] = useState(1);
  const [borderColor, setBorderColor] = useState('#5227FF');

  const config = {
    sentence: 'True Focus',
    manualMode,
    blurAmount,
    borderColor,
    animationDuration: animationDuration,
    pauseBetweenAnimations
  };

  const propData = [
    {
      name: 'sentence',
      type: 'string',
      default: "'True Focus'",
      description: 'The text to display with the focus animation.'
    },
    {
      name: 'separator',
      type: 'string',
      default: "' '",
      description:
        'Optional string used to separate words in the sentence.'
    },
    {
      name: 'manualMode',
      type: 'boolean',
      default: 'false',
      description: 'Disables automatic animation when set to true.'
    },
    {
      name: 'blurAmount',
      type: 'number',
      default: '5',
      description: 'The amount of blur applied to non-active words.'
    },
    {
      name: 'borderColor',
      type: 'string',
      default: "'green'",
      description: 'The color of the focus borders.'
    },
    {
      name: 'glowColor',
      type: 'string',
      default: "'rgba(0, 255, 0, 0.6)'",
      description: 'The color of the glowing effect on the borders.'
    },
    {
      name: 'animationDuration',
      type: 'number',
      default: '0.5',
      description: 'The duration of the animation for each word.'
    },
    {
      name: 'pauseBetweenAnimations',
      type: 'number',
      default: '1',
      description: 'Time to pause between focusing on each word (in auto mode).'
    }
  ];

  return (
    <TabsLayout>
      <PreviewTab>
        <Box position="relative" className="demo-container" minH={400}>
          <TrueFocus {...config} />
        </Box>

        <Customize>
          <Flex align="center" gap={2} mt={4}>
            <Text fontSize="sm">Border Color</Text>
            <input
              type="color"
              value={borderColor}
              onChange={e => setBorderColor(e.target.value)}
              style={{
                width: '40px',
                border: 'none',
                padding: '0',
                background: 'none',
                cursor: 'pointer'
              }}
            />
          </Flex>

          <PreviewSwitch title="Hover Mode" isChecked={manualMode} onChange={checked => setManualMode(checked)} />

          <PreviewSlider
            title="Blur Amount"
            min={0}
            max={15}
            step={0.5}
            value={blurAmount}
            valueUnit="px"
            onChange={setBlurAmount}
          />

          <PreviewSlider
            title="Animation Duration"
            min={0.1}
            max={3}
            step={0.1}
            value={animationDuration}
            valueUnit="s"
            isDisabled={!manualMode}
            onChange={setAnimationDuration}
          />

          <PreviewSlider
            title="Pause Between Animations"
            min={0}
            max={5}
            step={0.5}
            value={pauseBetweenAnimations}
            valueUnit="s"
            isDisabled={manualMode}
            onChange={setPauseBetweenAnimations}
          />
        </Customize>

        <PropTable data={propData} />
        <Dependencies dependencyList={['motion']} />
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={trueFocus} />
      </CodeTab>
    </TabsLayout>
  );
};

export default TrueFocusDemo;
