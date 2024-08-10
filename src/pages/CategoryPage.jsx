import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { componentMap } from '../constants/ComponentMap';

const CategoryPage = () => {
  const { category, subcategory } = useParams(); // Extract category and subcategory from the URL

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
        <>
          <Helmet>
            <title>React Bits - {decodeLabel(subcategory)}</title>
          </Helmet>
          <SubcategoryComponent />
        </>
      ) : (
        <p className='coming-soon'>This component is work in progress. <br />
          Follow the project on <a href="https://github.com/DavidHDev/react-bits" target="_blank" rel="noreferrer">GitHub</a> for regular updates.
        </p>
      )}
    </div>
  );
}

export default CategoryPage;