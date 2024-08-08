import { Box } from "@chakra-ui/react";
import Masonry from "../content/Components/Masonry/Masonry";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import { CODE_EXAMPLES } from "../constants/ExampleConstants";
import CodeExample from "../components/CodeExample";

const MasonryDemo = () => {
  const data = [
    { id: 1, image: 'https://picsum.photos/id/10/200/300', height: 400 },
    { id: 2, image: 'https://picsum.photos/id/14/200/300', height: 300 },
    { id: 3, image: 'https://picsum.photos/id/15/200/300', height: 300 },
    { id: 4, image: 'https://picsum.photos/id/16/200/300', height: 300 },
    { id: 5, image: 'https://picsum.photos/id/17/200/300', height: 300 },
    { id: 6, image: 'https://picsum.photos/id/19/200/300', height: 300 },
    { id: 7, image: 'https://picsum.photos/id/37/200/300', height: 200 },
    { id: 8, image: 'https://picsum.photos/id/39/200/300', height: 300 },
    { id: 9, image: 'https://picsum.photos/id/85/200/300', height: 200 },
    { id: 10, image: 'https://picsum.photos/id/103/200/300', height: 400 }
  ];

  const { masonry } = CODE_EXAMPLES;

  return (
    <>
      <h2 className="demo-title">Demo</h2>
      <Box position="relative" className="demo-container" overflow="hidden">
        <Masonry data={data} />
      </Box>

      <p className="demo-extra-info">
        <InfoOutlineIcon position="relative" />Demo best viewed on desktop, try resizing the window!
      </p>

      <p className="demo-details">
        This component uses <span>@react-spring/web</span> for the animation.
      </p>

      <CodeExample codeObject={masonry} />

    </>
  );
}

export default MasonryDemo;