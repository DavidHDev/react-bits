import { useParams } from 'react-router-dom';
import SplitTextDemo from '../demo/SplitTextDemo';
import BlurTextDemo from '../demo/BlurTextDemo';
import BlobCursorDemo from '../demo/BlobCursorDemo';

const CategoryPage = () => {
  const { category, subcategory } = useParams(); // Extract category and subcategory from the URL

  const componentMap = {
    'split-text': SplitTextDemo,
    'blur-text': BlurTextDemo,
    'blob-cursor': BlobCursorDemo
    // Map other subcategories to their components here
  };

  const decodeLabel = (label) => label
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const SubcategoryComponent = componentMap[subcategory];

  return (
    <div className='category-page'>
      <h1 className='main-category'>{decodeLabel(category)}</h1>
      <h2 className='sub-category'>{decodeLabel(subcategory)}</h2>
      {SubcategoryComponent ? (
        <SubcategoryComponent />
      ) : (
        <p>This component is not available yet.</p>
      )}
    </div>
  );
}

export default CategoryPage;