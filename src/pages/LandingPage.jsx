import { useEffect, useState } from "react";
import { getRandomGradient, getStarsCount } from "../utils/utils";
import { Box, Button, Flex, Image, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import Logo from '../assets/logos/bits-logo.svg';
import GitHub from '../assets/logos/github.svg';
import Blob from '../assets/landing/blob.svg';
import { StarIcon } from "@chakra-ui/icons";
import { Link } from "react-router-dom";
import { SHOWCASE } from "../constants/CategoryConstants";
import { BlurText } from "../content/TextAnimations/BlurText/BlurText";
import { landingImageMap } from "../constants/LandingImageMap";

const LandingPage = () => {
  const [stars, setStars] = useState(0);

  useEffect(() => {
    const fetchStars = async () => {
      const count = await getStarsCount();
      setTimeout(() => {
        setStars(count);
      }, 1000);
    };

    fetchStars();
  }, []);

  let subcategoryCount = 0;

  return (
    <Flex direction="column" w={"100%"} alignItems="center">
      <Flex className="landing-main" position="relative" justifyContent="center" alignItems="center" direction="column" w="100%" pb={{ base: 0 }} minH="500px" mt={"57px"} borderBottom={"1px solid #ffffff1c"}>
        <div className="landing-main-bg"></div>
        <div className="landing-gray-overlay"></div>
        <Image src={Blob} className="blob" />
        <Image src={Logo} w={180} mb={6} />
        <Text letterSpacing={'-.4px'} mb={6} className="landing-text" lineHeight={1.4} px={4} maxW={"30ch"} align="center">
          An open source React.js snippet library for animated components.
        </Text>
        <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
          <Button
            as={Link}
            h={'36px'}
            px={6}
            fontSize={14}
            letterSpacing={'-.4px'}
            bgColor={"white"}
            to="/text-animations/split-text"
            color={"black"}
            className="get-started-button"
            width="100%"
          >
            Get Started
          </Button>
          <Button
            as="a"
            overflow="hidden"
            h={'36px'}
            href="https://github.com/DavidHDev/react-bits" // Replace with your GitHub URL
            target="_blank"
            rel="noopener noreferrer"
            px={6}
            fontSize={14}
            letterSpacing={'-.4px'}
            bgColor={"#111"}
            color={"white"}
            border={"1px solid #ffffff1c"}
            className='github-button-landing'
            width="100%"
          >
            <Image src={GitHub} filter={"invert(100%)"} w={'16px'} mr={1} />
            GitHub
            <StarIcon color={"#00f0ff"} boxSize={3} ml={4} mr={1} position="relative" top="-.5px" />
            {stars ? <BlurText delay={20} text={String(stars)} /> : <Box><Spinner boxSize={2} /></Box>}
          </Button>
        </Flex>
      </Flex>

      <Text className="components-title" mt={6} mb={2}>Components</Text>

      <SimpleGrid className="components-grid" columns={{ base: 1, md: 3 }} spacing={6} mb={6} p={4} >
        {SHOWCASE.map((category) =>
          category.subcategories.map((subcategory, index) => {
            if (subcategoryCount >= 6) return null;
            subcategoryCount += 1;
            const componentString = `${subcategory.replace(/\s+/g, '')}`;
            const subcategoryString = subcategory.toLowerCase().replace(/\s+/g, '-');
            const path = `/${category.name.toLowerCase().replace(/\s+/g, '-')}/${subcategory.toLowerCase().replace(/\s+/g, '-')}`;
            const gradientBackground = getRandomGradient();

            const image = landingImageMap[subcategoryString];

            return (
              <Box
                as={Link}
                to={path}
                key={`${category.name}-${index}`}
                minW={{ base: '70vw', md: 250 }}
                minH={190}
                color="white"
                className="component-card"
              >
                <Flex direction="column" h={"100%"} justifyContent="flex-end">
                  <Flex justifyContent="center" alignItems="center" width={"100%"} h={150} borderRadius="2xl" bg={gradientBackground}>
                    <Image w={100} src={image} className={subcategoryString} />
                  </Flex>
                  <Text className="component-title" letterSpacing="-1px" mt={2} fontSize="l" fontWeight="500">
                    <span>&lt;</span>{componentString} <span>/&gt;</span>
                  </Text>
                  <Text className="component-subtitle">
                    {category.name}
                  </Text>
                </Flex>
              </Box>
            )
          })
        )}
      </SimpleGrid>

      <Button as={Link} to="/text-animations/split-text" border={"1px solid #ffffff1c"} fontSize="sm" mb={16}>Browse more</Button>

      <Text color={"#a1a1aa"} fontSize="sm" mb={12}>© 2024 David Haz. All rights reserved.</Text>
    </Flex>
  );
};

export default LandingPage;
