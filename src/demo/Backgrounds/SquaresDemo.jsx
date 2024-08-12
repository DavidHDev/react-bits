import { Box, Button, ButtonGroup, Flex, Input } from "@chakra-ui/react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import CodeExample from "../../components/code/CodeExample";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";
import Squares from "../../content/Backgrounds/Squares";
import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, InfoOutlineIcon } from "@chakra-ui/icons";

const SquaresDemo = () => {
  const { squares } = CODE_EXAMPLES;
  const [direction, setDirection] = useState('diagonal');
  const [borderColor, setBorderColor] = useState('#333');
  const [hoverColor, setHoverColor] = useState('#222222');
  const [speed, setSpeed] = useState(0.5);
  const [size, setSize] = useState(40);

  return (
    <TabbedLayout>
      <PreviewTab>
        <Box direction="relative" minH={200} className="demo-container" overflow="hidden">
          <Box w={"100%"} h={500} border={'1px solid #222'} borderRadius={"10px"} overflow="hidden">
            <Squares squareSize={size} speed={speed} direction={direction} borderColor={borderColor} hoverFillColor={hoverColor} />
          </Box>
        </Box>

        <div className="preview-options">
          <h2 className="demo-title-extra">Options</h2>
          <Flex gap={6} direction="column">
            <ButtonGroup isAttached size="sm">
              <Button
                fontSize="xs"
                h={8}
                bg="#a1a1aa"
                isDisabled
                _disabled={{ bg: '#222', cursor: 'not-allowed', _hover: { bg: '#222' } }}
              >
                Direction
              </Button>
              <Button
                bg={direction === 'diagonal' ? '#00f0ff' : '#111'}
                _hover={{ backgroundColor: `${direction === "diagonal" ? '#00f0ff' : '#111'}` }}
                color={direction === 'diagonal' ? 'black' : 'white'}
                fontSize="xs"
                h={8}
                onClick={() => {
                  setDirection('diagonal');
                }}
              >
                Diagonal
              </Button>
              <Button
                bg={direction === 'up' ? '#00f0ff' : '#111'}
                _hover={{ backgroundColor: `${direction === "up" ? '#00f0ff' : '#111'}` }}
                color={direction === 'up' ? 'black' : 'white'}
                fontSize="xs"
                h={8}
                onClick={() => {
                  setDirection('up');
                }}
              >
                Up
              </Button>
              <Button
                bg={direction === 'right' ? '#00f0ff' : '#111'}
                _hover={{ backgroundColor: `${direction === "right" ? '#00f0ff' : '#111'}` }}
                color={direction === 'right' ? 'black' : 'white'}
                fontSize="xs"
                h={8}
                onClick={() => {
                  setDirection('right');
                }}
              >
                Right
              </Button>
              <Button
                bg={direction === 'down' ? '#00f0ff' : '#111'}
                _hover={{ backgroundColor: `${direction === "down" ? '#00f0ff' : '#111'}` }}
                color={direction === 'down' ? 'black' : 'white'}
                fontSize="xs"
                h={8}
                onClick={() => {
                  setDirection('down');
                }}
              >
                Down
              </Button>
              <Button
                bg={direction === 'left' ? '#00f0ff' : '#111'}
                _hover={{ backgroundColor: `${direction === "left" ? '#00f0ff' : '#111'}` }}
                color={direction === 'left' ? 'black' : 'white'}
                fontSize="xs"
                h={8}
                onClick={() => {
                  setDirection('left');
                }}
              >
                Left
              </Button>
            </ButtonGroup>

            <Flex alignItems="center">
              Border Color:&nbsp;&nbsp;<input type="color" value={borderColor} style={{ height: '22px', outline: 'none', border: 'none' }} onChange={(e) => setBorderColor(e.target.value)} />
            </Flex>

            <Flex alignItems="center">
              Hover Color:&nbsp;&nbsp;<input type="color" value={hoverColor} style={{ height: '22px', outline: 'none', border: 'none' }} onChange={(e) => setHoverColor(e.target.value)} />
            </Flex>

            <Flex gap={2} alignItems="center">
              <Button w={4} h={8} onClick={() => {
                if (size === 100) return;
                setSize(size + 1);
              }}>
                <ArrowUpIcon />
              </Button>

              Size: {size}px

              <Button w={4} h={8} onClick={() => {
                if (size === 10) return;
                setSize(size - 1);
              }}>
                <ArrowDownIcon />
              </Button>
            </Flex>

            <Flex gap={2} alignItems="center">
              Speed &nbsp;- <Input type="tel" w={50} h={8} px={2} onChange={(e) => {
                setSpeed(e.target.value);
              }} maxLength={3} value={speed} />
            </Flex>
          </Flex>
        </div>
        <p className="demo-extra-info">
          <InfoOutlineIcon position="relative" />The ideal speed for the animation is between 0.5 - 1.
        </p>
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={squares} />
      </CodeTab>
    </TabbedLayout>

  );
}

export default SquaresDemo;