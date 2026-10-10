import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Text } from '@chakra-ui/react';
import BackToTopButton from '../components/common/BackToTopButton';
import ComponentList from '../components/common/ComponentList';
import { componentMetadata } from '../constants/Information';
import useNewSinceLastVisit from '../hooks/useNewSinceLastVisit';
import usePageSEO from '../hooks/usePageSEO';
import { CATEGORY_SEO } from '../utils/seo';

const CATEGORY_KEYS = {
  components: 'Components',
  animations: 'Animations',
  backgrounds: 'Backgrounds',
  'text-animations': 'TextAnimations',
  micro: 'Micro'
};
const CategoryIndexPage = () => {
  const { category } = useParams();
  const key = CATEGORY_KEYS[category];
  const seo = CATEGORY_SEO[category];
  const list = useMemo(
    () => Object.fromEntries(Object.entries(componentMetadata).filter(([, meta]) => meta.category === key)),
    [key]
  );
  const newSinceLastVisit = useNewSinceLastVisit(Object.keys(list));

  usePageSEO(seo ?? { title: 'Category not found | React Bits', robots: 'noindex, follow' });

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
        title={seo.heading}
        list={list}
        hasFavoriteButton
        sorting="alphabetical"
        showSortControl
        newSinceLastVisit={newSinceLastVisit}
        basePath="/c"
        showCategoryFilter={false}
        showDirectory
      />
      <BackToTopButton />
    </Box>
  );
};

export default CategoryIndexPage;
