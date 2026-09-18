import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Text } from '@chakra-ui/react';
import BackToTopButton from '../components/common/BackToTopButton';
import ComponentList from '../components/common/ComponentList';
import { componentMetadata } from '../constants/Information';
import useNewSinceLastVisit from '../hooks/useNewSinceLastVisit';
import usePageSEO from '../hooks/usePageSEO';

const CATEGORY_KEYS = {
  components: 'Components',
  animations: 'Animations',
  backgrounds: 'Backgrounds',
  'text-animations': 'TextAnimations',
  micro: 'Micro'
};
const CATEGORY_LABELS = {
  components: 'Components',
  animations: 'Animations',
  backgrounds: 'Backgrounds',
  'text-animations': 'Text Animations',
  micro: 'Micro'
};

const CategoryIndexPage = () => {
  const { category } = useParams();
  const key = CATEGORY_KEYS[category];
  const label = CATEGORY_LABELS[category];
  const list = useMemo(
    () => Object.fromEntries(Object.entries(componentMetadata).filter(([, meta]) => meta.category === key)),
    [key]
  );
  const newSinceLastVisit = useNewSinceLastVisit(Object.keys(list));

  usePageSEO({
    title: label ? `React Bits - ${label}` : undefined,
    path: `/c/${category}`
  });

  if (!key) {
    return (
      <Box p={6}>
        <Text color="var(--text-primary)" fontWeight={600} fontSize="18px">
          Not found
        </Text>
        <Text color="var(--text-muted)" fontSize="14px">
          There is no such category.
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <ComponentList
        title={label}
        list={list}
        hasFavoriteButton
        sorting="alphabetical"
        newSinceLastVisit={newSinceLastVisit}
        basePath="/c"
        showCategoryFilter={false}
      />
      <BackToTopButton />
    </Box>
  );
};

export default CategoryIndexPage;
