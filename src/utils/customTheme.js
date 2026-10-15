import { createSystem, defaultConfig, defineSlotRecipe } from '@chakra-ui/react';

const drawerRecipe = defineSlotRecipe({
  className: 'drawer',
  slots: ['content'],
  base: {
    content: {
      w: '100vw',
      h: '100vh'
    }
  }
});

const tabsRecipe = defineSlotRecipe({
  className: 'tabs',
  slots: ['trigger'],
  base: {
    trigger: {
      flex: '0 0 auto',
      bg: 'var(--bg-body)',
      borderRadius: '10px',
      fontSize: '14px',
      border: '1px solid var(--border-primary)',
      h: 9,
      px: '1rem',
      transition: 'background-color .3s',

      _hover: { bg: 'var(--bg-hover)' },

      "&[data-state='active']": {
        color: 'var(--text-primary)',
        bg: 'var(--bg-hover)'
      }
    }
  }
});

export { toastStyles } from './toastStyles.js';

export const customTheme = createSystem(defaultConfig, {
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false
  },

  styles: {
    global: {
      'html, body': {
        minHeight: '100vh',
        fontFamily: '"Geist", sans-serif',
        backgroundColor: 'var(--bg-body)'
      }
    }
  },

  components: {
    Slider: {
      baseStyle: {
        thumb: { bg: '#fff', _focus: { boxShadow: 'none' } }
      },
      variants: {
        solid: {
          track: { bg: '#2F293A' },
          filledTrack: { bg: '#fff' }
        }
      },
      defaultProps: { variant: 'solid' }
    },
    Switch: {
      baseStyle: {
        track: {
          bg: '#2F293A',
          _checked: { bg: '#5227FF' },
          _focus: { boxShadow: '0 0 0 3px #2F293A' },
          _active: { bg: '#5227FF' }
        },
        thumb: {
          _checked: { bg: 'white' },
          _active: { bg: 'white' }
        }
      }
    }
  },

  recipes: {
    drawer: drawerRecipe,
    tabs: tabsRecipe
  }
});
