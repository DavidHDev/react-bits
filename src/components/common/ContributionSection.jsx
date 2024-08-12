// ContributionSection.js
import { Box, Button, Flex, Icon, Text } from "@chakra-ui/react";
import { TbBug, TbBulb } from "react-icons/tb";
import { useParams } from "react-router-dom";

const ContributionSection = () => {
  const { subcategory, category } = useParams();

  return (
    <Box className="contribute-container">
      <h2 className="demo-title-contribute">Help us improve this component!</h2>
      <Flex
        gap={2}
        justifyContent="center"
        alignItems="center"
        direction={{ base: "column", md: "row" }}
      >
        <Button
          cursor="pointer"
          as="a"
          href={`https://github.com/DavidHDev/react-bits/issues/new?title=[BUG]:+${category}/${subcategory}&labels=bug&template=bug.md`}
          rel="noreferrer"
          target="_blank"
          fontSize="sm"
          height={9}
          rounded="xl"
          className="contribute-button"
        >
          <Icon as={TbBug} />
          &nbsp;Report an issue
        </Button>
        <Text mx={2} color="#a1a1aa">
          or
        </Text>
        <Button
          cursor="pointer"
          as="a"
          href={`https://github.com/DavidHDev/react-bits/issues/new?title=[FEAT]:+${category}/${subcategory}&labels=enhancement&template=feature-request.md`}
          rel="noreferrer"
          target="_blank"
          fontSize="sm"
          height={9}
          rounded="xl"
          className="contribute-button"
        >
          <Icon as={TbBulb} />
          &nbsp;Request a feature
        </Button>
      </Flex>
    </Box>
  );
};

export default ContributionSection;
