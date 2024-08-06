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
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';

import { Link } from 'react-router-dom';

// Assuming you have the logo imported already
import Logo from '../assets/bits-logo.svg';
import { useRef, useState } from 'react';
import { CATEGORIES } from '../constants/CategoryConstants';

const Sidebar = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const sidebarBgColor = useColorModeValue('gray.100', 'black');
  const linkHoverColor = useColorModeValue('gray.800', 'gray');
  const btnRef = useRef();

  return (
    <>
      <Box position="fixed" top={0} zIndex="overlay" p={"1em"} w={"100%"} bgColor={'#000'}>
        <Flex alignItems="center" gap={"1em"}>
          <IconButton
            ref={btnRef}
            icon={<HamburgerIcon />}
            onClick={() => setDrawerOpen(true)}
            display={{ md: 'none' }}
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
                <Category key={category.name} category={category} hoverColor={linkHoverColor} handleClick={() => setDrawerOpen(false)} />
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <Box as="nav" pos="relative" left="0" top="0" height="100vh" className='sidebar' overflowY="auto" bg={sidebarBgColor} w={{ base: 0, md: 60 }} p={5} display={{ base: 'none', md: 'block' }}>
        <Flex justify="start" align="center" mb={10} className='sidebar-logo'>
          <img src={Logo} alt="Company Logo" />
        </Flex>
        <VStack align="stretch" spacing={5}>
          {CATEGORIES.map(category => (
            <Category key={category.name} category={category} hoverColor={linkHoverColor} />
          ))}
        </VStack>
      </Box>
    </>
  );
};

const Category = ({ category, handleClick }) => {
  // Function to format the string for URLs by replacing spaces with dashes
  const formatForURL = (str) => str.replace(/\s+/g, '-').toLowerCase();

  return (
    <Box>
      <Text className='category-name' mb={2}>{category.name}</Text>
      <Stack spacing={1} pl={4}>
        {category.subcategories.map(sub => (
          <Link key={sub} to={`/${formatForURL(category.name)}/${formatForURL(sub)}`} style={{ padding: '4px' }} onClick={handleClick}>
            {sub}
          </Link>
        ))}
      </Stack>
    </Box>
  );
};

export default Sidebar;
