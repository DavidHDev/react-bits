import {
  Box,
  Flex,
  VStack,
  Text,
  Stack,
  IconButton,
  useColorModeValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Image,
  Button,
  Divider,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';

import { Link, useLocation } from 'react-router-dom';

// Assuming you have the logo imported already
import Logo from '../assets/bits-logo.svg';
import GitHub from '../assets/github.svg';
import { useRef, useState } from 'react';
import { CATEGORIES } from '../constants/CategoryConstants';

const Sidebar = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const sidebarBgColor = useColorModeValue('gray.100', 'black');
  const linkHoverColor = useColorModeValue('gray.800', 'gray');
  const btnRef = useRef();

  const location = useLocation(); // Get the current location;

  return (
    <>
      <Box display={{ md: 'none' }} position="fixed" top={0} zIndex="overlay" p={"1em"} w={"100%"} bgColor={'#000'}>
        <Flex alignItems="center" gap={"1em"}>
          <IconButton
            ref={btnRef}
            icon={<HamburgerIcon />}
            onClick={() => setDrawerOpen(true)}
          />
          <Image
            src={Logo}
            width="75px"
          >
          </Image>
        </Flex>
      </Box>

      <Drawer
        isOpen={isDrawerOpen}
        placement="left"
        onClose={() => setDrawerOpen(false)}
        finalFocusRef={btnRef}
        size="full"
      >
        <DrawerOverlay />
        <DrawerContent className='sidebar-mobile'>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" className='sidebar-logo'>
            <img src={Logo} alt="Company Logo" />
          </DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={5} mt={10}>
              {CATEGORIES.map(category => (
                <Category key={category.name} category={category} hoverColor={linkHoverColor} location={location} handleClick={() => setDrawerOpen(false)} />
              ))}
            </VStack>
            <Button
              as="a"
              href="https://github.com/DavidHDev/react-bits" // Replace with your GitHub URL
              target="_blank"
              rel="noopener noreferrer"
              bgColor={"white"}
              color={"black"}
              className='github-button'
              width="100%"
            >
              <Image width={25} src={GitHub} mr={2} />
              GitHub
            </Button>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <Box as="nav" pos="relative" left="0" top="0" height="100vh" className='sidebar' overflowY="auto" bg={sidebarBgColor} w={{ base: 0, md: 60 }} p={5} display={{ base: 'none', md: 'block' }}>
        <Flex justify="start" align="center" mb={10} className='sidebar-logo'>
          <img src={Logo} alt="Company Logo" />
        </Flex>
        <VStack align="stretch" spacing={4}>
          {CATEGORIES.map(category => (
            <Category key={category.name} category={category} location={location} hoverColor={linkHoverColor} />
          ))}
        </VStack>
        <Divider my={5} />
        <Button
          as="a"
          href="https://github.com/DavidHDev/react-bits" // Replace with your GitHub URL
          target="_blank"
          rel="noopener noreferrer"
          bgColor={"white"}
          color={"black"}
          className='github-button'
          width="100%"
        >
          <Image width={25} src={GitHub} mr={2} />
          GitHub
        </Button>
      </Box>
    </>
  );
};

const Category = ({ category, handleClick, location }) => {
  // Function to format the string for URLs by replacing spaces with dashes
  const formatForURL = (str) => str.replace(/\s+/g, '-').toLowerCase();

  return (
    <Box>
      <Text className='category-name' mb={2}>{category.name}</Text>
      <Stack spacing={1} pl={2}>
        {category.subcategories.map(sub => {
          const path = `/${formatForURL(category.name)}/${formatForURL(sub)}`;
          const isActive = location.pathname === path; // Determine if this is the active link
          return (
            <Link className={isActive ? 'active-sidebar-item' : 'sidebar-item'} key={sub} to={`/${formatForURL(category.name)}/${formatForURL(sub)}`} onClick={handleClick}>
              {sub}
            </Link>
          )
        }
        )}
      </Stack>
    </Box>
  );
};

export default Sidebar;
