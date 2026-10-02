import { useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { TbMenu } from 'react-icons/tb';

import PreviewSwitch from './PreviewSwitch';
import logo from '../../../assets/logos/react-bits-logo.svg';
import { useColorModeValue } from '../../setup/color-mode';

const BackgroundContent = ({
  headline = 'Build interfaces that feel alive'
}) => {
  const [showContent, setShowContent] = useState(true);
  const glassBackground = useColorModeValue('rgba(255, 255, 255, 0.68)', 'rgba(255, 255, 255, 0.03)');
  const glassBorder = useColorModeValue('rgba(24, 24, 27, 0.1)', 'rgba(255, 255, 255, 0.08)');
  const primaryText = useColorModeValue('#18181b', '#ffffff');
  const secondaryText = useColorModeValue('rgba(24, 24, 27, 0.58)', 'rgba(255,255,255,0.5)');
  const solidBackground = useColorModeValue('#18181b', '#ffffff');
  const solidText = useColorModeValue('#ffffff', '#09090b');
  const tagBackground = useColorModeValue('rgba(255, 255, 255, 0.78)', 'rgba(18, 15, 23, 0.5)');
  const logoFilter = useColorModeValue('brightness(0)', 'none');
  const headlineShadow = useColorModeValue('0 2px 20px rgba(255,255,255,0.75)', '0 4px 24px rgba(0,0,0,0.5)');

  return (
    <Box userSelect="none" className="background-demo-content">
      {/* Toggle */}
      <Box
        position="absolute"
        bottom={3}
        right={3}
        w="180px"
        zIndex={10}
        opacity={0.5}
        _hover={{ opacity: 1 }}
        transition="opacity 0.3s ease"
        userSelect="none"
      >
        <PreviewSwitch title="Demo Content" isChecked={showContent} onChange={setShowContent} />
      </Box>

      {showContent && (
        <>
          {/* Nav */}
          <Box position="absolute" top={0} left={0} w="100%" zIndex={2} pointerEvents="none">
            <Box
              mx="auto"
              mt={5}
              w={{ base: '92%', md: '70%' }}
              h="48px"
              borderRadius="14px"
              p="0px 8px 0px 14px"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              bg={glassBackground}
              border={`1px solid ${glassBorder}`}
              backdropFilter="blur(18px) saturate(140%)"
              className="bg-content-glass"
            >
              <Box display="flex" alignItems="center" gap={2}>
                <img src={logo} alt="Logo" style={{ height: '20px', borderRadius: '50px', filter: logoFilter }} />
              </Box>

              <Box display={{ base: 'flex', md: 'none' }} alignItems="center" color={secondaryText}>
                <TbMenu size={18} />
              </Box>

              <Box display={{ base: 'none', md: 'flex' }} alignItems="center" gap={5}>
                {['Features', 'About'].map(item => (
                  <Text key={item} color={secondaryText} fontSize="13px" fontWeight={500}>{item}</Text>
                ))}
                <Box
                  h="30px"
                  px={4}
                  borderRadius="8px"
                  bg={solidBackground}
                  color={solidText}
                  fontSize="12px"
                  fontWeight={600}
                  display="flex"
                  alignItems="center"
                >
                  Sign up
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Hero */}
          <Box
            position="absolute"
            inset={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            zIndex={1}
            pointerEvents="none"
            px={6}
          >
            {/* Tag */}
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              px="14px"
              py="5px"
              pl="5px"
              borderRadius="50px"
              border={`1px solid ${glassBorder}`}
              bg={tagBackground}
              backdropFilter="blur(18px) saturate(140%)"
              className="bg-content-glass"
            >
              <Box
                px="10px"
                py="3px"
                borderRadius="50px"
                bg={solidBackground}
                fontSize="11px"
                fontWeight={600}
                color={solidText}
                textTransform="uppercase"
                letterSpacing="0.02em"
              >
                New
              </Box>
              <Text fontSize="12px" fontWeight={500} color={secondaryText}>
                Creative Components
              </Text>
            </Box>

            {/* Headline */}
            <Text
              mt={6}
              color={primaryText}
              fontSize="clamp(1.6rem, 4vw, 2.4rem)"
              lineHeight={1.1}
              textAlign="center"
              letterSpacing="-0.03em"
              fontWeight={600}
              maxW="20ch"
              textShadow={headlineShadow}
            >
              {headline}
            </Text>

            {/* Buttons */}
            <Box display="flex" gap={3} mt={7} alignItems="center" pointerEvents="none">
              <Box
                as="span"
                h="40px"
                px={5}
                bg={solidBackground}
                color={solidText}
                borderRadius="10px"
                fontSize="13px"
                fontWeight={600}
                display="flex"
                alignItems="center"
              >
                Get started
              </Box>
              <Box
                as="span"
                h="40px"
                px={5}
                borderRadius="10px"
                fontSize="13px"
                fontWeight={500}
                color={secondaryText}
                border={`1px solid ${glassBorder}`}
                bg={glassBackground}
                backdropFilter="blur(18px) saturate(140%)"
                display="flex"
                alignItems="center"
                className="bg-content-glass"
              >
                Learn more
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default BackgroundContent;
