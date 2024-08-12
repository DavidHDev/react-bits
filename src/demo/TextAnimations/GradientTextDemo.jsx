import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import CodeExample from "../../components/code/CodeExample";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";
import GradientText from "../../content/TextAnimations/GradientText/GradientText";
import { useState } from "react";
import { InfoOutlineIcon } from "@chakra-ui/icons";

const GradientTextDemo = () => {
  const { gradientText } = CODE_EXAMPLES;
  const [colors, setColors] = useState('#40ffaa, #4079ff, #40ffaa, #4079ff, #40ffaa');
  const [speed, setSpeed] = useState(3);
  const [showBorder, setShowBorder] = useState(true);

  return (
    <TabbedLayout>
      <PreviewTab>
        <h2 className="demo-title-extra">Default</h2>
        <Box position="relative" className="demo-container" minH={150}>
          <Text fontSize={'2rem'} as='div'>
            <GradientText
              colors={colors.split(',')} // Custom gradient colors
              animationSpeed={speed} // Custom animation speed in seconds
              showBorder={false} // Show or hide border
            >
              Add a splash of color!
            </GradientText>
          </Text>
        </Box>

        <h2 className="demo-title-extra">Border Animation</h2>
        <Box position="relative" className="demo-container" minH={150}>
          <Text fontSize={'2rem'} as='div'>
            <GradientText
              colors={colors.split(',')} // Custom gradient colors
              animationSpeed={speed} // Custom animation speed in seconds
              showBorder={showBorder} // Show or hide border
              className="custom-gradient-class"
            >
              Now with a cool border!
            </GradientText>
          </Text>
        </Box>

        <div className="preview-options">
          <h2 className="demo-title-extra">Options</h2>
          <Flex gap={4} wrap="wrap">
            <Flex gap={2} alignItems="center">
              Colors &nbsp;- <Input fontSize="xs" type="text" w='auto' h={8} px={2} onChange={(e) => setColors(e.target.value)} value={colors} />
            </Flex>

            <Flex gap={2} alignItems="center">
              Speed &nbsp;- <Input type="tel" w={50} h={8} px={2} onChange={(e) => setSpeed(e.target.value)} maxLength={3} value={speed} />
            </Flex>

            <Button
              fontSize="xs"
              h={8}
              onClick={() => {
                setShowBorder(!showBorder);
              }}
            >
              Show border: <Text color={showBorder ? "lightgreen" : "coral"}>&nbsp;{String(showBorder)}</Text>
            </Button>
          </Flex>
        </div>

        <p className="demo-extra-info">
          <InfoOutlineIcon position="relative" /> For a smoother animation, the gradient should start & end with the same color.
        </p>


      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={gradientText} />
      </CodeTab>
    </TabbedLayout>

  );
}

export default GradientTextDemo;