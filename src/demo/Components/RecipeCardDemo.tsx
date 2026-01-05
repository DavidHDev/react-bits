import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Button } from '@chakra-ui/react';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import useForceRerender from '../../hooks/useForceRerender';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import { recipeCard } from '../../constants/code/Components/recipeCardCode';
import RecipeCard from '../../content/Components/RecipeCard/RecipeCard';

const DEFAULT_PROPS = {
  enableHoverEffect: true,
  title: 'Spaghetti Bolognese',
  category: 'Pasta',
  cookTime: 30,
  servings: 1,
  difficulty: 'Medium' as const,
  backColor: '#151515',
  glowColor: '#ff9966',
  circleColors: {
    primary: '#ffbb66',
    secondary: '#ff8866',
    tertiary: '#ff2233'
  }
};

const RecipeCardDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { 
    enableHoverEffect,
    title,
    category,
    cookTime,
    servings,
    difficulty,
    backColor,
    glowColor,
    circleColors 
  } = props;

  const [key, forceRerender] = useForceRerender();

  const generateRandomColors = () => {
    const randomHue1 = Math.floor(Math.random() * 360);
    const randomHue2 = Math.floor(Math.random() * 360);
    const randomHue3 = Math.floor(Math.random() * 360);

    updateProp('glowColor', `hsla(${randomHue1}, 100%, 70%, 0.8)`);
    updateProp('circleColors', {
      primary: `hsla(${randomHue1}, 80%, 60%, 0.8)`,
      secondary: `hsla(${randomHue2}, 80%, 60%, 0.8)`,
      tertiary: `hsla(${randomHue3}, 80%, 60%, 0.8)`
    });
    (forceRerender as any)();
  };

  const propData = useMemo(
    () => [
      {
        name: 'imageUrl',
        type: 'string',
        default: '""',
        description: 'URL for the recipe image displayed on the card front'
      },
      {
        name: 'title',
        type: 'string',
        default: '"Spaghetti Bolognese"',
        description: 'Recipe title displayed prominently on the card'
      },
      {
        name: 'category',
        type: 'string',
        default: '"Pasta"',
        description: 'Recipe category or tag displayed as a badge'
      },
      {
        name: 'cookTime',
        type: 'number',
        default: '30',
        description: 'Estimated cooking time in minutes'
      },
      {
        name: 'servings',
        type: 'number',
        default: '1',
        description: 'Number of servings the recipe yields'
      },
      {
        name: 'difficulty',
        type: '"Easy" | "Medium" | "Hard"',
        default: '"Medium"',
        description: 'Difficulty level of the recipe with color-coded display'
      },
      {
        name: 'enableHoverEffect',
        type: 'boolean',
        default: 'true',
        description: 'Toggle the 3D flip animation on hover'
      },
      {
        name: 'className',
        type: 'string',
        default: '""',
        description: 'Additional CSS classes to apply to the card wrapper'
      },
      {
        name: 'style',
        type: 'CSSProperties',
        default: 'undefined',
        description: 'Custom inline styles for the card container'
      },
      {
        name: 'onClick',
        type: '() => void',
        default: 'undefined',
        description: 'Callback function called when the card is clicked'
      },
      {
        name: 'backColor',
        type: 'string',
        default: '"#151515"',
        description: 'Background color for the back side of the card'
      },
      {
        name: 'glowColor',
        type: 'string',
        default: '"#ff9966"',
        description: 'Color for the rotating glow effect on the back of the card'
      },
      {
        name: 'circleColors',
        type: '{ primary?: string; secondary?: string; tertiary?: string; }',
        default: '{ primary: "#ffbb66", secondary: "#ff8866", tertiary: "#ff2233" }',
        description: 'Colors for the floating circle effects on the card front'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout className="">
        <PreviewTab>
          <Box position="relative" className="demo-container" h={700} overflow="hidden">
            <Box display="flex" justifyContent="center" alignItems="center" h="100%">
              <RecipeCard
                key={key}
                title={title}
                category={category}
                cookTime={cookTime}
                servings={servings}
                difficulty={difficulty}
                enableHoverEffect={enableHoverEffect}
                backColor={backColor}
                glowColor={glowColor}
                circleColors={circleColors}
                onClick={() => console.log('Recipe card clicked')}
              />
            </Box>
          </Box>
          <Customize>
            <Button
              onClick={generateRandomColors}
              fontSize="xs"
              bg="#170D27"
              borderRadius="10px"
              border="1px solid #271E37"
              _hover={{ bg: '#271E37' }}
              color="#fff"
              h={8}
              mb={4}
            >
              Randomize Colors
            </Button>

            <PreviewSwitch
              title="Hover Effect"
              isChecked={enableHoverEffect}
              isDisabled={false}
              onChange={() => {
                updateProp('enableHoverEffect', !enableHoverEffect);
                (forceRerender as any)();
              }}
            />
          </Customize>
          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={recipeCard} componentName="RecipeCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default RecipeCardDemo;