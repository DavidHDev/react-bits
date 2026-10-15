/* eslint-disable react-refresh/only-export-components */
'use client';

import { ThemeProvider, useTheme } from 'next-themes';
import * as React from 'react';
import { LuMoon, LuSun } from 'react-icons/lu';

function ThemeKeyboardShortcut() {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme();

  React.useEffect(() => {
    const handleKeyDown = event => {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() !== 'd' && event.key.toLowerCase() !== 't') return;

      const target = event.target;
      const isEditing =
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="searchbox"]'
        );

      if (isEditing || forcedTheme) return;

      event.preventDefault();
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [forcedTheme, resolvedTheme, setTheme]);

  return null;
}

export function ColorModeProvider({ children, ...props }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      themes={['dark', 'light']}
      storageKey="react-bits-theme"
      disableTransitionOnChange
      {...props}
    >
      <ThemeKeyboardShortcut />
      {children}
    </ThemeProvider>
  );
}

export function useColorMode() {
  const { theme, resolvedTheme, setTheme, forcedTheme } = useTheme();
  const colorMode = forcedTheme || resolvedTheme;
  const toggleColorMode = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };
  return {
    theme,
    resolvedTheme,
    colorMode: colorMode,
    setColorMode: setTheme,
    toggleColorMode
  };
}

export function useColorModeValue(light, dark) {
  const { colorMode } = useColorMode();
  return colorMode === 'dark' ? dark : light;
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode();
  return colorMode === 'dark' ? <LuMoon /> : <LuSun />;
}
