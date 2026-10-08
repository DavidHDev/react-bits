import { useMemo, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AppWindowMacIcon,
  Delete02Icon,
  Home01Icon,
  Image01Icon,
  Mail01Icon,
  Message01Icon,
  MusicNote03Icon,
  Search01Icon,
  Settings01Icon
} from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import Dock from '../../content/Components/Dock/Dock';
import { dock } from '../../constants/code/Components/dockCode';

const DEFAULT_PROPS = {
  accentColor: '#0a84ff',
  badgeColor: '#ff453a',
  position: 'bottom',
  baseItemSize: 50,
  magnification: 70,
  distance: 200,
  panelHeight: 68,
  gap: 10,
  roundness: 0.5,
  feel: 'smooth',
  bounce: true,
  autoHide: false,
  tiles: true,
  showLabels: true,
  showIndicators: true,
  showBadges: true
};

const SPRINGS = {
  smooth: { mass: 0.1, stiffness: 150, damping: 12 },
  snappy: { mass: 0.1, stiffness: 420, damping: 20 },
  bouncy: { mass: 0.1, stiffness: 220, damping: 4 },
  gentle: { mass: 0.2, stiffness: 120, damping: 14 }
};

const POSITION_OPTIONS = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const FEEL_OPTIONS = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'snappy', label: 'Snappy' },
  { value: 'bouncy', label: 'Bouncy' },
  { value: 'gentle', label: 'Gentle' }
];

const glyph = icon => <HugeiconsIcon icon={icon} size="1em" strokeWidth={1.8} />;

const APPS = [
  { id: 'home', icon: Home01Icon, label: 'Home', windows: ['Design Work', 'Downloads'], actions: ['New Window'] },
  { id: 'search', icon: Search01Icon, label: 'Search', windows: [], actions: ['New Search'] },
  { id: 'mail', icon: Mail01Icon, label: 'Mail', windows: ['Inbox'], actions: ['Get New Mail', 'New Message'] },
  { id: 'messages', icon: Message01Icon, label: 'Messages', windows: [], actions: ['New Message'] },
  { id: 'music', icon: MusicNote03Icon, label: 'Music', windows: [], actions: ['Play', 'Next', 'Previous'] },
  { id: 'photos', icon: Image01Icon, label: 'Photos', windows: [], actions: ['New Album'] },
  { id: 'settings', icon: Settings01Icon, label: 'Settings', windows: [], actions: ['General', 'Appearance'] },
  { separator: true },
  { id: 'trash', icon: Delete02Icon, label: 'Trash', windows: [], actions: [] }
];

const DockDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { feel, ...dockProps } = props;
  const theme = useColorModeValue('light', 'dark');
  const [open, setOpen] = useState(() => new Set(['home', 'mail', 'music']));
  const [badges, setBadges] = useState({ mail: 3, messages: true });
  const [focused, setFocused] = useState({ home: 'Design Work', mail: 'Inbox' });
  const [login, setLogin] = useState({ mail: true });

  const launch = id => {
    setOpen(current => new Set(current).add(id));
    setBadges(current => ({ ...current, [id]: undefined }));
  };

  const quit = id =>
    setOpen(current => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });

  const menuFor = app => {
    const running = open.has(app.id);
    if (app.id === 'trash') {
      return [
        { label: 'Open', onClick: () => launch(app.id) },
        { separator: true },
        { label: 'Empty Trash', disabled: true }
      ];
    }
    const windows = running
      ? app.windows.map(name => ({
          label: name,
          icon: glyph(AppWindowMacIcon),
          checked: focused[app.id] === name,
          onClick: () => setFocused(current => ({ ...current, [app.id]: name }))
        }))
      : [];
    return [
      ...windows,
      ...(windows.length ? [{ separator: true }] : []),
      ...app.actions.map(action => ({ label: action, onClick: () => launch(app.id) })),
      ...(app.actions.length ? [{ separator: true }] : []),
      {
        label: 'Options',
        items: [
          { label: 'Keep in Dock', checked: true, disabled: true },
          {
            label: 'Open at Login',
            checked: Boolean(login[app.id]),
            onClick: () => setLogin(current => ({ ...current, [app.id]: !current[app.id] }))
          },
          { separator: true },
          { label: 'Show in Finder' }
        ]
      },
      { separator: true },
      { label: 'Show All Windows', disabled: !running },
      { label: 'Hide', disabled: !running },
      running ? { label: 'Quit', onClick: () => quit(app.id) } : { label: 'Open', onClick: () => launch(app.id) }
    ];
  };

  const items = APPS.map(app =>
    app.separator
      ? app
      : {
          icon: glyph(app.icon),
          label: app.label,
          active: open.has(app.id),
          badge: badges[app.id],
          menu: menuFor(app),
          onClick: () => launch(app.id)
        }
  );

  const computedProps = useMemo(
    () => ({
      ...(feel === 'smooth' ? {} : { spring: SPRINGS[feel] }),
      ...(theme === 'light' ? { theme: 'light' } : {})
    }),
    [feel, theme]
  );

  const propData = useMemo(
    () => [
      {
        name: 'items',
        type: 'DockItemData[]',
        default: '[]',
        description:
          'The apps in the dock. Each item takes an icon, label and onClick, plus optional className, active (an open app, shown with a dot), badge (a number, text, or true for a plain dot) and menu. Add { separator: true } to divide groups.'
      },
      {
        name: 'items[].menu',
        type: 'DockMenuItem[]',
        default: '-',
        description:
          'Rows of the context menu that opens on right click, long press or the menu key. Rows take label, onClick, icon, checked, disabled, shortcut and items for a submenu. Add { separator: true } for a divider.'
      },
      {
        name: 'position',
        type: "'bottom' | 'top' | 'left' | 'right'",
        default: "'bottom'",
        description:
          'The edge of the nearest positioned parent the dock sits on. Icons grow away from that edge and the dock stands vertically on the left and right.'
      },
      {
        name: 'theme',
        type: "'dark' | 'light'",
        default: "'dark'",
        description: 'Colors of the panel, tiles, labels and menus, made for dark or light pages.'
      },
      {
        name: 'baseItemSize',
        type: 'number',
        default: '50',
        description:
          'Size of each icon at rest, in px. The dock shrinks everything evenly when its parent is too small to fit it.'
      },
      {
        name: 'magnification',
        type: 'number',
        default: '70',
        description: 'Size of the icon right under the pointer, in px. Set it to baseItemSize to turn magnifying off.'
      },
      {
        name: 'distance',
        type: 'number',
        default: '200',
        description: 'How far from the pointer icons still grow, in px. Larger values spread the swell over more icons.'
      },
      {
        name: 'panelHeight',
        type: 'number',
        default: '68',
        description: 'Thickness of the dock bar, in px. Icons rise out of it as they grow.'
      },
      {
        name: 'gap',
        type: 'number',
        default: '10',
        description: 'Space between icons, in px.'
      },
      {
        name: 'roundness',
        type: 'number',
        default: '0.5',
        description: 'Corner rounding of the tiles and the bar, from square at 0 to circles at 1.'
      },
      {
        name: 'spring',
        type: '{ mass?: number; stiffness?: number; damping?: number }',
        default: '{ mass: 0.1, stiffness: 150, damping: 12 }',
        description:
          'The spring icons grow and shrink with. Higher stiffness is faster, and low damping lets icons overshoot and wobble.'
      },
      {
        name: 'bounce',
        type: 'boolean',
        default: 'true',
        description: 'Icons hop when clicked, like apps launching on macOS.'
      },
      {
        name: 'autoHide',
        type: 'boolean',
        default: 'false',
        description:
          'Slides the dock off its edge until the pointer comes near that edge of the parent. It stays out while hovered, focused or showing a menu.'
      },
      {
        name: 'tiles',
        type: 'boolean',
        default: 'true',
        description:
          'Draws a rounded tile behind each icon. Turn it off for bare glyphs, or when your icons are full app artwork.'
      },
      {
        name: 'showLabels',
        type: 'boolean',
        default: 'true',
        description: 'Shows the label of the hovered or focused icon in a tooltip.'
      },
      {
        name: 'showIndicators',
        type: 'boolean',
        default: 'true',
        description: 'Shows a dot next to items marked active, like open apps on macOS.'
      },
      {
        name: 'showBadges',
        type: 'boolean',
        default: 'true',
        description: 'Shows the notification badges set on items.'
      },
      {
        name: 'badgeColor',
        type: 'string',
        default: "'#ff453a'",
        description: 'Fill color of the notification badges.'
      },
      {
        name: 'accentColor',
        type: 'string',
        default: "'#0a84ff'",
        description: 'Color of the highlighted row in menus and of the keyboard focus ring.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the dock panel.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the dock panel.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['feel']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" minH={460} overflow="hidden">
            <Dock {...dockProps} items={items} spring={SPRINGS[feel] ?? SPRINGS.smooth} theme={theme} />
          </Box>

          <Customize>
            <PreviewColorPickerCustom
              title="Accent Color"
              color={props.accentColor}
              onChange={value => updateProp('accentColor', value)}
            />

            <PreviewColorPickerCustom
              title="Badge Color"
              color={props.badgeColor}
              onChange={value => updateProp('badgeColor', value)}
            />

            <PreviewSelect
              title="Position"
              options={POSITION_OPTIONS}
              value={props.position}
              onChange={value => updateProp('position', value)}
            />

            <PreviewSlider
              title="Item Size"
              min={30}
              max={80}
              step={2}
              value={props.baseItemSize}
              onChange={value => updateProp('baseItemSize', value)}
              valueUnit="px"
            />

            <PreviewSlider
              title="Magnification"
              min={30}
              max={140}
              step={2}
              value={props.magnification}
              onChange={value => updateProp('magnification', value)}
              valueUnit="px"
            />

            <PreviewSlider
              title="Distance"
              min={60}
              max={400}
              step={10}
              value={props.distance}
              onChange={value => updateProp('distance', value)}
              valueUnit="px"
            />

            <PreviewSlider
              title="Bar Height"
              min={30}
              max={120}
              step={2}
              value={props.panelHeight}
              onChange={value => updateProp('panelHeight', value)}
              valueUnit="px"
            />

            <PreviewSlider
              title="Gap"
              min={0}
              max={30}
              step={1}
              value={props.gap}
              onChange={value => updateProp('gap', value)}
              valueUnit="px"
            />

            <PreviewSlider
              title="Roundness"
              min={0}
              max={1}
              step={0.05}
              value={props.roundness}
              onChange={value => updateProp('roundness', value)}
            />

            <PreviewSelect
              title="Spring"
              options={FEEL_OPTIONS}
              value={feel}
              onChange={value => updateProp('feel', value)}
            />

            <PreviewSwitch title="Bounce" isChecked={props.bounce} onChange={value => updateProp('bounce', value)} />

            <PreviewSwitch
              title="Auto Hide"
              isChecked={props.autoHide}
              onChange={value => updateProp('autoHide', value)}
            />

            <PreviewSwitch title="Tiles" isChecked={props.tiles} onChange={value => updateProp('tiles', value)} />

            <PreviewSwitch
              title="Labels"
              isChecked={props.showLabels}
              onChange={value => updateProp('showLabels', value)}
            />

            <PreviewSwitch
              title="Indicators"
              isChecked={props.showIndicators}
              onChange={value => updateProp('showIndicators', value)}
            />

            <PreviewSwitch
              title="Badges"
              isChecked={props.showBadges}
              onChange={value => updateProp('showBadges', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={dock} componentName="Dock" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default DockDemo;
