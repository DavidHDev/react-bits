import code from '@content/Components/RecipeCard/RecipeCard.jsx?raw';
import css from '@content/Components/RecipeCard/RecipeCard.css?raw';
import tsCode from '@ts-default/Components/RecipeCard/RecipeCard.tsx?raw';

export const recipeCard = {
  usage: `import RecipeCard from './RecipeCard'
  
<RecipeCard
  title="Spaghetti Bolognese"
  category="Pasta"
  cookTime={30}
  servings={4}
  difficulty="Medium"
  imageUrl="/path/to/recipe-image.jpg"
  enableHoverEffect={true}
  glowColor="#ff9966"
  backColor="#151515"
  circleColors={{
    primary: "#ffbb66",
    secondary: "#ff8866",
    tertiary: "#ff2233"
  }}
  onClick={() => console.log('Recipe selected')}
/>`,
  
  code,
  css,
  tsCode
};