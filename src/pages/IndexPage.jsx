import { Box } from '@chakra-ui/react';
import BackToTopButton from '../components/common/BackToTopButton';
import { componentMetadata } from '../constants/Information';
import ComponentList from '../components/common/ComponentList';
import useNewSinceLastVisit from '../hooks/useNewSinceLastVisit';
import usePageSEO from '../hooks/usePageSEO';
import { INDEX_SEO } from '../utils/seo';

const IndexPage = () => {
  const newSinceLastVisit = useNewSinceLastVisit(Object.keys(componentMetadata));
  usePageSEO(INDEX_SEO);

  return (
    <Box>
      <ComponentList
        title={INDEX_SEO.heading}
        intro={INDEX_SEO.intro}
        list={componentMetadata}
        hasFavoriteButton
        sorting="newest"
        showSortControl
        newSinceLastVisit={newSinceLastVisit}
        showDirectory
      />
      <BackToTopButton />
    </Box>
  );
};

export default IndexPage;
