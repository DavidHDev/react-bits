import { Box, Button, ButtonGroup, Divider, Flex, Text } from "@chakra-ui/react";
import Dock from "../content/Components/Dock/Dock";
import { useState } from "react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import { CODE_EXAMPLES } from "../constants/ExampleConstants";
import CodeExample from "../components/CodeExample";

const DockDemo = () => {
  const [position, setPosition] = useState('bottom');
  const [responsive, setResponsive] = useState('bottom');
  const [collapsible, setCollapsible] = useState(false);

  const [counter, setCounter] = useState(0);

  const reRender = () => {
    setCounter((prevCounter) => prevCounter + 1);
  };

  const { dock } = CODE_EXAMPLES;

  return (
    <>
      <h2 className="demo-title">Demo</h2>
      <Box position="relative" className="demo-container" minH={400}>
        <Dock key={counter} position={position} collapsible={collapsible} responsive={responsive} />
      </Box>

      <h2 className="demo-title">Options</h2>
      <Flex gap={2} alignItems="center" fontSize="xs" wrap="wrap">
        <Button
          fontSize="xs"
          h={8}
          onClick={() => {
            setCollapsible(!collapsible);
            reRender();
          }}
        >
          Collapsible: <Text color={collapsible ? "lightgreen" : "coral"}>&nbsp;{String(collapsible)}</Text>
        </Button>

        <Divider mx={2} h={6} orientation="vertical" display={{ base: 'none', md: 'inline' }} />

        <ButtonGroup isAttached size="sm">
          <Button
            fontSize="xs"
            h={8}
            bg="#999"
            isDisabled
            _disabled={{ bg: '#222', cursor: 'not-allowed', _hover: { bg: '#222' } }}
          >
            Position
          </Button>
          <Button
            bg={position === 'top' ? '#00f0ff' : '#111'}
            _hover={{ backgroundColor: `${position === "top" ? '#00f0ff' : '#111'}` }}
            color={position === 'top' ? 'black' : 'white'}
            fontSize="xs"
            h={8}
            onClick={() => {
              setPosition('top');
            }}
          >
            Top
          </Button>
          <Button
            bg={position === 'right' ? '#00f0ff' : '#111'}
            _hover={{ backgroundColor: `${position === "right" ? '#00f0ff' : '#111'}` }}
            color={position === 'right' ? 'black' : 'white'}
            fontSize="xs"
            h={8}
            onClick={() => {
              setPosition('right');
            }}
          >
            Right
          </Button>
          <Button
            bg={position === 'bottom' ? '#00f0ff' : '#111'}
            _hover={{ backgroundColor: `${position === "bottom" ? '#00f0ff' : '#111'}` }}
            color={position === 'bottom' ? 'black' : 'white'}
            fontSize="xs"
            h={8}
            onClick={() => {
              setPosition('bottom');
            }}
          >
            Bottom
          </Button>
          <Button
            bg={position === 'left' ? '#00f0ff' : '#111'}
            _hover={{ backgroundColor: `${position === "left" ? '#00f0ff' : '#111'}` }}
            color={position === 'left' ? 'black' : 'white'}
            fontSize="xs"
            h={8}
            onClick={() => {
              setPosition('left');
            }}
          >
            Left
          </Button>
        </ButtonGroup>

        <Divider mx={2} h={6} orientation="vertical" display={{ base: 'none', md: 'inline' }} />

        <ButtonGroup isAttached size="sm">
          <Button
            fontSize="xs"
            h={8}
            bg="#999"
            isDisabled
            _disabled={{ bg: '#222', cursor: 'not-allowed', _hover: { bg: '#222' } }}
          >
            Responsive
          </Button>
          <Button
            bg={responsive === 'top' ? '#00f0ff' : '#111'}
            _hover={{ backgroundColor: `${responsive === "top" ? '#00f0ff' : '#111'}` }}
            color={responsive === 'top' ? 'black' : 'white'}
            fontSize="xs"
            h={8}
            onClick={() => {
              setResponsive('top');
            }}
          >
            Top
          </Button>
          <Button
            bg={responsive === 'bottom' ? '#00f0ff' : '#111'}
            _hover={{ backgroundColor: `${responsive === "bottom" ? '#00f0ff' : '#111'}` }}
            color={responsive === 'bottom' ? 'black' : 'white'}
            fontSize="xs"
            h={8}
            onClick={() => {
              setResponsive('bottom');
            }}
          >
            Bottom
          </Button>
        </ButtonGroup>
      </Flex>

      <p className="demo-extra-info">
        <InfoOutlineIcon position="relative" />The `responsive` prop overrides the `position` on mobile (under 768px) devices.
      </p>

      <p className="demo-details">
        This component uses <span>@react-spring/web</span> for the animation.
      </p>

      <CodeExample codeObject={dock} />

    </>
  );
}

export default DockDemo;