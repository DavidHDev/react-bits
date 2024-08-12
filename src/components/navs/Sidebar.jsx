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
  Image,
  Divider
} from '@chakra-ui/react';
import { ArrowForwardIcon, CloseIcon, HamburgerIcon } from '@chakra-ui/icons';

import { Link, useLocation } from 'react-router-dom';

// Assuming you have the logo imported already
import Logo from '../../assets/logos/bits-logo.svg';
import { useRef, useState } from 'react';
import { CATEGORIES } from '../../constants/CategoryConstants';

const scrollToTop = () => window.scrollTo(0, 0);

const Sidebar = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const sidebarBgColor = useColorModeValue('gray.100', 'black');
  const linkHoverColor = useColorModeValue('gray.800', 'gray');
  const btnRef = useRef();

  const location = useLocation(); // Get the current location;

  return (
    <>
      <Box display={{ md: 'none' }} position="fixed" top={0} left={0} zIndex="overlay" p={"1em"} w={"100%"} bgColor={'#000'}>
        <Flex alignItems="center" gap={"1em"}>
          <IconButton ref={btnRef} icon={<HamburgerIcon />} onClick={() => setDrawerOpen(true)} />
          <Link to="/">
            <Image src={Logo} height="25px" />
          </Link>
        </Flex>
      </Box>

      <Drawer isOpen={isDrawerOpen} placement="left" onClose={() => setDrawerOpen(false)} finalFocusRef={btnRef} size="full">
        <DrawerOverlay />
        <DrawerContent className='sidebar-mobile'>
          <DrawerHeader py={0} h={"72px"} borderBottomWidth="1px" className='sidebar-logo'>
            <Flex alignItems="center">
              <IconButton
                size="md"
                icon={<CloseIcon boxSize={3} />}
                aria-label="Close Menu"
                onClick={() => setDrawerOpen(false)}
              />
              <Link to="/">
                <Image height="25px" src={Logo} alt="Bits Logo" />
              </Link>
            </Flex>
          </DrawerHeader>
          <DrawerBody pb={'6em'}>
            <VStack align="stretch" spacing={5} mt={8}>
              {CATEGORIES.map(category => (
                <Category key={category.name} category={category} hoverColor={linkHoverColor} location={location} handleClick={() => { setDrawerOpen(false); scrollToTop(); }} />
              ))}
            </VStack>
            <Divider my={4} />
            <p className='useful-links'>Useful Links</p>
            <Flex direction="column">
              <Link className="nav-link mobile-nav-link" to="https://github.com/DavidHDev/react-bits" target='_blank' display="block" mb={2} onClick={() => setDrawerOpen(false)}>
                GitHub<ArrowForwardIcon boxSize={7} transform={"rotate(-45deg)"} position="relative" top="-1px" />
              </Link>
              <Link className="nav-link mobile-nav-link" to="https://davidhaz.com/" target='_blank' display="block" mb={2} onClick={() => setDrawerOpen(false)}>
                Who made this?<ArrowForwardIcon boxSize={7} transform={"rotate(-45deg)"} position="relative" top="-1px" />
              </Link>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box as="nav" position="fixed" top={'57px'} height="calc(100vh - 57px)" className='sidebar' overflowY="auto" bg={sidebarBgColor} w={{ base: 0, md: 60 }} p={5} display={{ base: 'none', md: 'block' }}>
        <VStack align="stretch" spacing={4}>
          {CATEGORIES.map(category => (
            <Category key={category.name} category={category} location={location} hoverColor={linkHoverColor} />
          ))}
        </VStack>
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
      <Stack spacing={0.5} pl={0}>
        {category.subcategories.map(sub => {
          const path = `/${formatForURL(category.name)}/${formatForURL(sub)}`;
          const isActive = location.pathname === path; // Determine if this is the active link

          return (
            <Link
              key={path}
              className={isActive ? 'sidebar-item active-sidebar-item' : 'sidebar-item'}
              to={path}
              onClick={handleClick}
            >
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
