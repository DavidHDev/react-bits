import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';
import logoDark from '../../assets/logos/reactbits-gh-white.svg';
import logoLight from '../../assets/logos/reactbits-gh-black.svg';

import { staggeredMenu } from '../../constants/code/Components/staggeredMenuCode';
import StaggeredMenu from '@content/Components/StaggeredMenu/StaggeredMenu';

const DEFAULT_PROPS = {
  displaySocials: true,
  accentColor: '#5227FF',
  menuButtonColor: '#ffffff',
  position: 'right'
};

const StaggeredMenuDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { displaySocials, accentColor, menuButtonColor, position } = props;
  const [menuKey, forceMenuRerender] = useForceRerender();
  const logo = useColorModeValue(logoLight, logoDark);
  const renderedMenuButtonColor = useColorModeValue(
    menuButtonColor === DEFAULT_PROPS.menuButtonColor ? '#18181b' : menuButtonColor,
    menuButtonColor
  );

  const items = [
    { label: 'Home', ariaLabel: 'Go to Home section', link: '#home' },
    { label: 'About', ariaLabel: 'Go to About section', link: '#about' },
    { label: 'Projects', ariaLabel: 'Go to Projects section', link: '#projects' },
    { label: 'Contact', ariaLabel: 'Go to Contact section', link: '#contact' }
  ];

  const socialItems = [
    { label: 'GitHub', link: 'https://github.com/your-handle' },
    { label: 'Twitter', link: 'https://twitter.com/your-handle' },
    { label: 'LinkedIn', link: 'https://linkedin.com/in/your-handle' }
  ];

  const propData = useMemo(
    () => [
      {
        name: 'position',
        type: '"left" | "right"',
        default: '"right"',
        description: 'Anchor position for the menu panel (left or right side).'
      },
      {
        name: 'colors',
        type: 'string[]',
        default: '["#B497CF", "#5227FF"]',
        description: 'Colors used for staggered underlay layers.'
      },
      {
        name: 'items',
        type: 'StaggeredMenuItem[]',
        default: '[]',
        description: 'Menu items rendered inside the panel.'
      },
      {
        name: 'socialItems',
        type: 'StaggeredMenuSocialItem[]',
        default: '[]',
        description: 'Social links displayed in the menu panel.'
      },
      {
        name: 'displaySocials',
        type: 'boolean',
        default: 'true',
        description: 'Whether to display the social links section.'
      },
      {
        name: 'displayItemNumbering',
        type: 'boolean',
        default: 'true',
        description: 'Whether to show numbering for menu items.'
      },
      {
        name: 'className',
        type: 'string',
        default: 'undefined',
        description: 'Optional extra class names.'
      },
      {
        name: 'logoUrl',
        type: 'string',
        default: '',
        description: 'Path to the logo image.'
      },
      {
        name: 'menuButtonColor',
        type: 'string',
        default: '"#fff"',
        description: 'Color of the menu toggle button when closed.'
      },
      {
        name: 'openMenuButtonColor',
        type: 'string',
        default: '"#fff"',
        description: 'Color of the menu toggle button when open.'
      },
      {
        name: 'accentColor',
        type: 'string',
        default: 'undefined',
        description: 'Hover accent color for menu items.'
      },
      {
        name: 'changeMenuColorOnOpen',
        type: 'boolean',
        default: 'true',
        description: 'Whether to animate the button color when opening/closing.'
      },
      {
        name: 'onMenuOpen',
        type: '() => void',
        default: 'undefined',
        description: 'Callback function called when menu opens.'
      },
      {
        name: 'onMenuClose',
        type: '() => void',
        default: 'undefined',
        description: 'Callback function called when menu closes.'
      },
      {
        name: 'closeOnClickAway',
        type: 'boolean',
        default: 'true',
        description: 'Whether to close the menu when clicking outside.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container demo-container-dots" h={800} overflow="hidden" p={0}>
            <StaggeredMenu
              key={menuKey}
              logoUrl={logo}
              items={items}
              socialItems={socialItems}
              openMenuButtonColor="#18181b"
              displaySocials={displaySocials}
              accentColor={accentColor}
              menuButtonColor={renderedMenuButtonColor}
              position={position}
            />
          </Box>

          <Customize>
            <PreviewSelect
              title="Position"
              value={position}
              onChange={val => {
                updateProp('position', val);
                forceMenuRerender();
              }}
              options={[
                { value: 'right', label: 'Right' },
                { value: 'left', label: 'Left' }
              ]}
              width={110}
            />
            <PreviewColorPickerCustom title="Accent Color" color={accentColor} onChange={val => updateProp('accentColor', val)} />
            <PreviewColorPickerCustom
              title="Menu Button Color"
              color={renderedMenuButtonColor}
              onChange={val => updateProp('menuButtonColor', val)}
            />
            <PreviewSwitch
              title="Display Socials"
              isChecked={displaySocials}
              onChange={val => updateProp('displaySocials', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={staggeredMenu} componentName="StaggeredMenu" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default StaggeredMenuDemo;
