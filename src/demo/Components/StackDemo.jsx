import { Flex } from "@chakra-ui/react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import Stack from "../../content/Components/Stack/Stack";
import CodeExample from '../../components/code/CodeExample';

const StackDemo = () => {
  const { stack } = CODE_EXAMPLES;

  return (
    <>
      <h2 className="demo-title">Demo</h2>
      <Flex overflow="hidden" justifyContent="center" alignItems="center" minH={400} position="relative" pb={"4em"} className="demo-container">
        <Stack />
      </Flex>

      <p className="demo-details">
        This component uses <span>@react-spring/web</span> for the animation and <span>react-use-gesture</span> for drag gestures.
      </p>

      <CodeExample codeObject={stack} />
    </>

  );
}

export default StackDemo;