import { Flex } from "@chakra-ui/react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import SkewedInfiniteScroll from "../../content/Components/Skewed Infinite Scroll/SkewedInfiniteScroll";
import CodeExample from '../../components/code/CodeExample';
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";

const SkewedInfiniteScrollDemo = () => {
  const { skewedInfiniteScroll } = CODE_EXAMPLES;

  return (
    <TabbedLayout>
      <PreviewTab>
        <Flex overflow="hidden" justifyContent="center" alignItems="center" minH={400} position="relative" pb={"4em"} className="demo-container">
          <SkewedInfiniteScroll />
        </Flex>
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={skewedInfiniteScroll} />
      </CodeTab>
    </TabbedLayout>

  );
}

export default SkewedInfiniteScrollDemo;