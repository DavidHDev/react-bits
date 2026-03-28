import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { TbBug, TbBulb } from 'react-icons/tb';
import { useParams } from 'react-router-dom';
import { colors } from '../../constants/colors';

const ISSUE_BASE = 'https://github.com/DavidHDev/react-bits/issues/new';

const BTN_STYLE = {
  cursor: 'pointer',
  fontSize: 'xs',
  bg: colors.bgElevated,
  borderRadius: '10px',
  border: `1px solid ${colors.borderPrimary}`,
  _hover: { bg: colors.bgHover },
  color: '#fff',
  h: 10,
  w: { base: '90%', md: 'auto' }
};

const ContributionSection = () => {
  const { subcategory, category } = useParams();
  const title = `${category}/${subcategory}`;

  return (
    <Box className="contribute-container">
      <Text fontSize={{ base: '1rem', md: '1.65rem' }} color={colors.accent} className="demo-title-contribute">
        Help improve this component!
      </Text>
      <Flex gap={2} justifyContent="center" alignItems="center" direction={{ base: 'column', md: 'row' }}>
        <Button
          as="a"
          href={`${ISSUE_BASE}?template=1-bug-report.yml&title=${encodeURIComponent(`[BUG]: ${title}`)}&labels=bug`}
          rel="noreferrer"
          target="_blank"
          {...BTN_STYLE}
        >
          <Icon as={TbBug} />
          &nbsp;Report an issue
        </Button>
        <Text mx={2} color={colors.textMuted} display={{ base: 'none', md: 'inline' }}>
          or
        </Text>
        <Button
          as="a"
          href={`${ISSUE_BASE}?template=2-feature-request.yml&title=${encodeURIComponent(`[FEAT]: ${title}`)}&labels=enhancement`}
          rel="noreferrer"
          target="_blank"
          {...BTN_STYLE}
        >
          <Icon as={TbBulb} />
          &nbsp;Request a feature
        </Button>
      </Flex>
    </Box>
  );
};

export default ContributionSection;
