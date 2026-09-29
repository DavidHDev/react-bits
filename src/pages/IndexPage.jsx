import { Box } from '@chakra-ui/react';
import BackToTopButton from '../components/common/BackToTopButton';
import { componentMetadata } from '../constants/Information';
import ComponentList from '../components/common/ComponentList';
import useNewSinceLastVisit from '../hooks/useNewSinceLastVisit';

const IndexPage = () => {
  const newSinceLastVisit = useNewSinceLastVisit(Object.keys(componentMetadata));

  return (
    <Box>
      <title>{`React Bits - Component Index`}</title>
      <ComponentList
        title="Browse All"
        list={componentMetadata}
        hasFavoriteButton
        sorting="newest"
        showSortControl
        newSinceLastVisit={newSinceLastVisit}
      />
      <BackToTopButton />
    </Box>
  );
};

export default IndexPage;
