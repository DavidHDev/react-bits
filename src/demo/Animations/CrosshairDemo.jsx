import { Box, Button, Flex, Text } from "@chakra-ui/react";

import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";
import CodeExample from '../../components/code/CodeExample';
import Crosshair from "../../content/Animations/Crosshair/Crosshair";
import { useRef, useState } from "react";

const CrosshairDemo = () => {
  const containerRef = useRef(null);
  const [linkText, setLinkText] = useState('Aim.. aand..')
  const [color, setColor] = useState('#ffffff');
  const { crosshair } = CODE_EXAMPLES;

  const [targeted, setTargeted] = useState(true);

  return (
    <TabbedLayout>
      <PreviewTab>
        <Box ref={containerRef} position="relative" className="demo-container" minH={300} overflow="hidden">
          <Crosshair containerRef={targeted ? null : containerRef} color={color} />

          <Flex direction="column" justifyContent="center" alignItems="center">
            <Text _hover={{ color: 'cyan' }} transition=".3s ease" textAlign="center" fontWeight={900} fontSize={{ base: '2rem', md: '4rem' }} as="a" href="https://github.com/DavidHDev/react-bits"
              onMouseEnter={() => setLinkText('Shoot!!!')}
              onMouseLeave={() => setLinkText('Aim.. aand..')}
            >
              {linkText}
            </Text>
            <Text position="relative" top="-10px" color="#444">(hover me)</Text>
          </Flex>
        </Box>

        <div className="preview-options">
          <h2 className="demo-title-extra">Options</h2>
          <Flex gap={2}>
            <Button
              fontSize="xs"
              h={8}
              onClick={() => {
                setTargeted(!targeted);
              }}
            >
              Active on: <Text color={targeted ? "lightgreen" : "coral"}>&nbsp;{targeted ? 'Viewport' : 'Container'}</Text>
            </Button>
            <Flex alignItems="center"
              fontSize="xs"
              h={8}
              onClick={() => {

              }}
            >
              Color:&nbsp;&nbsp;<input type="color" value={color} style={{ height: '22px', outline: 'none', border: 'none' }} onChange={(e) => setColor(e.target.value)} />
            </Flex>
          </Flex>
        </div>

        <h2 className="demo-title-extra">Dependencies</h2>
        <div className="demo-details">
          <span>gsap</span>
        </div>
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={crosshair} />
      </CodeTab>
    </TabbedLayout>
  );
};

export default CrosshairDemo;
