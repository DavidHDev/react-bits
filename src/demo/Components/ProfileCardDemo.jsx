import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import ProfileCard from '../../content/Components/ProfileCard/ProfileCard';
import { profileCard } from '../../constants/code/Components/profileCardCode';

const DEFAULT_PROPS = {
  iconPattern: true,
  backdropColor: '',
  holo: 0.8,
  glare: 0.5,
  tiltStrength: 12,
  parallax: 8,
  radius: 16,
  enableTilt: true,
  intro: true,
  showUserInfo: true,
  enableMobileTilt: false
};

const propData = [
  { name: 'avatarUrl', type: 'string', default: "''", description: 'Portrait shown on the card.' },
  {
    name: 'iconUrl',
    type: 'string',
    default: '-',
    description: 'Tileable pattern, like a logo pattern. The holo foil shows only through it.'
  },
  {
    name: 'miniAvatarUrl',
    type: 'string',
    default: '-',
    description: 'Small round image next to the handle. Hidden when not set.'
  },
  { name: 'name', type: 'string', default: "'Javi A. Torres'", description: 'Name shown over the portrait.' },
  { name: 'title', type: 'string', default: "'Software Engineer'", description: 'Role shown under the name.' },
  { name: 'handle', type: 'string', default: "'javicodes'", description: 'Handle shown in the footer, without the @.' },
  { name: 'status', type: 'string', default: "'Online'", description: 'Status text shown under the handle.' },
  { name: 'statusColor', type: 'string', default: "'#22c55e'", description: 'Color of the status dot.' },
  { name: 'contactText', type: 'string', default: "'Contact'", description: 'Label of the contact button.' },
  {
    name: 'showUserInfo',
    type: 'boolean',
    default: 'true',
    description: 'Shows the footer with the handle, status and contact button.'
  },
  {
    name: 'onContactClick',
    type: '() => void',
    default: '-',
    description: 'Called when the contact button is clicked.'
  },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the frame and footer.' },
  {
    name: 'backdropColor',
    type: 'string',
    default: '-',
    description: 'Color behind the portrait. Shows around cut-out photos. Uses the theme color when not set.'
  },
  { name: 'radius', type: 'number', default: '16', description: 'Corner radius of the photo, in px.' },
  {
    name: 'holo',
    type: 'number',
    default: '0.8',
    description: 'Strength of the holographic foil, from 0 to 1. It lights up where the cursor catches it.'
  },
  {
    name: 'glare',
    type: 'number',
    default: '0.5',
    description: 'Strength of the light that follows the cursor, from 0 to 1.'
  },
  { name: 'enableTilt', type: 'boolean', default: 'true', description: 'Tilts the card toward the cursor.' },
  { name: 'tiltStrength', type: 'number', default: '12', description: 'Largest tilt angle, in degrees.' },
  {
    name: 'parallax',
    type: 'number',
    default: '8',
    description: 'How far the portrait shifts as the card tilts, in px.'
  },
  {
    name: 'enableMobileTilt',
    type: 'boolean',
    default: 'false',
    description: 'Tilts the card with the motion of the phone after a tap. Needs HTTPS.'
  },
  {
    name: 'mobileTiltSensitivity',
    type: 'number',
    default: '5',
    description: 'How strongly phone motion tilts the card.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Catches the light once as the card appears, then settles.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the card.' }
];

const ProfileCardDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { iconPattern, backdropColor, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const iconUrl = iconPattern ? '/assets/demo/iconpattern.png' : undefined;

  const computedProps = useMemo(
    () => ({
      ...(iconUrl ? { iconUrl } : {}),
      ...(backdropColor ? { backdropColor } : {}),
      ...(theme === 'light' ? { theme: 'light' } : {})
    }),
    [iconUrl, backdropColor, theme]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['iconPattern', 'backdropColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={640} overflow="hidden">
            <ProfileCard
              key={key}
              name="Javi A. Torres"
              title="Software Engineer"
              handle="javicodes"
              status="Online"
              contactText="Contact"
              avatarUrl="/assets/demo/person.webp"
              iconUrl={iconUrl}
              backdropColor={backdropColor || undefined}
              theme={theme}
              {...settings}
            />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewColorPickerCustom
              title="Backdrop Color"
              color={backdropColor || (theme === 'light' ? '#f6f6f8' : '#302c3a')}
              onChange={value => updateProp('backdropColor', value)}
            />
            <PreviewSlider
              title="Holo"
              min={0}
              max={1}
              step={0.05}
              value={settings.holo}
              onChange={value => updateProp('holo', value)}
            />
            <PreviewSlider
              title="Glare"
              min={0}
              max={1}
              step={0.05}
              value={settings.glare}
              onChange={value => updateProp('glare', value)}
            />
            <PreviewSlider
              title="Tilt Strength"
              min={0}
              max={25}
              step={1}
              value={settings.tiltStrength}
              valueUnit="°"
              onChange={value => updateProp('tiltStrength', value)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={20}
              step={1}
              value={settings.parallax}
              valueUnit="px"
              onChange={value => updateProp('parallax', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={28}
              step={1}
              value={settings.radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSwitch
              title="Icon Pattern"
              isChecked={iconPattern}
              onChange={value => updateProp('iconPattern', value)}
            />
            <PreviewSwitch
              title="Tilt"
              isChecked={settings.enableTilt}
              onChange={value => updateProp('enableTilt', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="User Info"
              isChecked={settings.showUserInfo}
              onChange={value => updateProp('showUserInfo', value)}
            />
            <PreviewSwitch
              title="Mobile Tilt"
              isChecked={settings.enableMobileTilt}
              onChange={value => updateProp('enableMobileTilt', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={profileCard} componentName="ProfileCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ProfileCardDemo;
