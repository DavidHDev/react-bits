import { Box, Divider, Drawer, DrawerBody, DrawerContent, DrawerOverlay, Flex, IconButton, Image, useDisclosure } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import Logo from '../assets/bits-logo.svg'
import { ArrowForwardIcon, CloseIcon, HamburgerIcon } from '@chakra-ui/icons';

const Nav = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box position={'fixed'} zIndex={1} top={0} bg="black" px={6} w={"100%"} borderBottom={"1px solid #ffffff1c"}>
      <Flex h={14} alignItems="center" justifyContent="space-between">
        <Link to="/">
          <Image src={Logo} alt="Logo" height="25px" />
        </Link>

        {/* Hamburger menu button for small screens */}
        <IconButton
          size="md"
          icon={<HamburgerIcon />}
          aria-label="Open Menu"
          display={{ md: 'none' }}
          onClick={onOpen}
        />

        {/* Links for larger screens */}
        <Flex display={{ base: 'none', md: 'flex' }} alignItems="center" gap={8}>
          <Link className="nav-link" to="/text-animations/split-text" mx={2} fontWeight="bold">
            Docs
          </Link>
          <Link className="nav-link" to="https://github.com/DavidHDev/react-bits" target='_blank' mx={2} fontWeight="bold">
            GitHub<ArrowForwardIcon boxSize={5} transform={"rotate(-45deg)"} position="relative" top="-1px" />
          </Link>
          <Link className="nav-link" to="https://davidhaz.com/" target="_blank" mx={2} fontWeight="bold">
            Who made this?<ArrowForwardIcon boxSize={5} transform={"rotate(-45deg)"} position="relative" top="-1px" />
          </Link>
        </Flex>
      </Flex>

      {/* Drawer for mobile navigation */}
      <Drawer placement="top" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay display={{ md: 'none' }}>
          <DrawerContent bg="black" h={'100%'}>
            <DrawerBody px={0} py={0}>
              <Flex direction="column">
                <Flex alignItems="center" justifyContent="space-between" h={'57px'} mb={6} borderBottom={"1px solid #ffffff1c"} px={6}>
                  <Image src={Logo} alt="Logo" height="25px" />
                  <IconButton
                    size="md"
                    icon={<CloseIcon boxSize={3} />}
                    aria-label="Close Menu"
                    display={{ md: 'none' }}
                    onClick={onClose}
                  />
                </Flex>
                <Flex direction="column" px={6}>
                  <p className='useful-links'>Useful Links</p>
                  <Link className="nav-link mobile-nav-link" to="/text-animations/split-text" display="block" mb={2} onClick={onClose}>
                    Docs
                  </Link>
                  <Link className="nav-link mobile-nav-link" to="https://github.com/DavidHDev/react-bits" target='_blank' display="block" mb={2} onClick={onClose}>
                    GitHub<ArrowForwardIcon boxSize={7} transform={"rotate(-45deg)"} position="relative" top="-1px" />
                  </Link>
                  <Divider className='nav-divider' />
                  <p className='useful-links'>Other</p>
                  <Link className="nav-link mobile-nav-link" to="https://davidhaz.com/" target='_blank' display="block" mb={2} onClick={onClose}>
                    Who made this?<ArrowForwardIcon boxSize={7} transform={"rotate(-45deg)"} position="relative" top="-1px" />
                  </Link>
                </Flex>
              </Flex>
            </DrawerBody>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>
    </Box>
  );
}

export default Nav;