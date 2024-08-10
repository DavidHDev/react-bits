import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { AnimatedContainer } from "../content/Animations/AnimatedContainer/AnimatedContainer";
import { useState } from "react";
import RefreshButton from "../components/RefreshButton";
import CodeExample from "../components/CodeExample";
import { CODE_EXAMPLES } from "../constants/ExampleConstants";

const AnimatedContainerDemo = () => {
  const [counter, setCounter] = useState(0);
  const [direction, setDirection] = useState('vertical');
  const [distance, setDistance] = useState(100);
  const [reverse, setReverse] = useState(false);

  const reRender = () => {
    setCounter((prevCounter) => prevCounter + 1);
  };

  const { animatedContainer } = CODE_EXAMPLES;

  return (
    <>
      <h2 className="demo-title">Demo</h2>
      <Box position="relative" className="demo-container" minH={200} overflow="hidden">
        <RefreshButton onClick={reRender} />
        <AnimatedContainer key={counter} reverse={reverse} direction={direction} distance={distance}>
          <Flex fontSize="xl" fontWeight="bolder" justifyContent="center" alignItems="center" color="black" h={100} borderRadius="xl" w={200} bg={"#fff"}>Container</Flex>
        </AnimatedContainer>
      </Box>
      <h2 className="demo-title">Options</h2>
      <Flex gap={2}>
        <Button
          fontSize="xs"
          h={8}
          onClick={() => {
            setDirection(direction === 'vertical' ? 'horizontal' : 'vertical');
            reRender();
          }}
        >
          Direction: <Text color={"#a1a1aa"}>&nbsp;{String(direction)}</Text>
        </Button>
        <Button
          fontSize="xs"
          h={8}
          onClick={() => {
            setDistance(distance === 100 ? 50 : 100);
            reRender();
          }}
        >
          Distance: <Text color="#a1a1aa">&nbsp;{String(distance)}</Text>
        </Button>
        <Button
          fontSize="xs"
          h={8}
          onClick={() => {
            setReverse(!reverse);
            reRender();
          }}
        >
          Reverse: <Text color={reverse ? "lightgreen" : "coral"}>&nbsp;{String(reverse)}</Text>
        </Button>
      </Flex>

      <p className="demo-details">
        This component uses <span>@react-spring/web</span> for the animation.
      </p>

      <CodeExample codeObject={animatedContainer} />
    </>
  );
}

export default AnimatedContainerDemo;