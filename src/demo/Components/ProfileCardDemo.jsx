import { useState } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Button } from '@chakra-ui/react';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import useForceRerender from '../../hooks/useForceRerender';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';

import { profileCard } from '../../constants/code/Components/profileCardCode';
import ProfileCard from '../../content/Components/ProfileCard/ProfileCard';

const ProfileCardDemo = () => {
  const [showIcon, setShowIcon] = useState(true);
  const [showUserInfo, setShowUserInfo] = useState(true);
  const [showBehindGradient, setShowBehindGradient] = useState(true);
  const [enableMobileTilt, setEnableMobileTilt] = useState(false);
  const [customBehindGradient, setCustomBehindGradient] = useState(
    'radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(266,100%,90%,var(--card-opacity)) 4%,hsla(266,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(266,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(266,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#00ffaac4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#00c1ffff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#c137ffff 0%,#07c6ffff 40%,#07c6ffff 60%,#c137ffff 100%)'
  );
  const [customInnerGradient, setCustomInnerGradient] = useState('linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)');

  const [key, forceRerender] = useForceRerender();

  const generateRandomGradients = () => {
    const randomHue1 = Math.floor(Math.random() * 360);
    const randomHue2 = Math.floor(Math.random() * 360);
    const randomHue3 = Math.floor(Math.random() * 360);
    const randomHue4 = Math.floor(Math.random() * 360);

    const newBehindGradient = `radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(${randomHue1},100%,90%,var(--card-opacity)) 4%,hsla(${randomHue1},50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(${randomHue1},25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(${randomHue1},0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,hsl(${randomHue2}, 100%, 70%) 0%,transparent 100%),radial-gradient(100% 100% at 50% 50%,hsl(${randomHue3}, 100%, 65%) 1%,transparent 76%),conic-gradient(from 124deg at 50% 50%,hsl(${randomHue4}, 100%, 70%) 0%,hsl(${randomHue2}, 100%, 70%) 40%,hsl(${randomHue2}, 100%, 70%) 60%,hsl(${randomHue4}, 100%, 70%) 100%)`;
    const newInnerGradient = `linear-gradient(145deg,hsla(${randomHue1}, 40%, 45%, 0.55) 0%,hsla(${randomHue3}, 60%, 70%, 0.27) 100%)`;

    setCustomBehindGradient(newBehindGradient);
    setCustomInnerGradient(newInnerGradient);
    forceRerender();
  };

  const propData = [
    {
      name: 'avatarUrl',
      type: 'string',
      default: '"<Placeholder for avatar URL>"',
      description: 'URL for the main avatar image displayed on the card'
    },
    {
      name: 'iconUrl',
      type: 'string',
      default: '"<Placeholder for icon URL>"',
      description: 'Optional URL for an icon pattern overlay on the card background'
    },
    {
      name: 'grainUrl',
      type: 'string',
      default: '"<Placeholder for grain URL>"',
      description: 'Optional URL for a grain texture overlay effect'
    },
    {
      name: 'behindGradient',
      type: 'string',
      default: 'undefined',
      description: 'Custom CSS gradient string for the background gradient effect'
    },
    {
      name: 'innerGradient',
      type: 'string',
      default: 'undefined',
      description: 'Custom CSS gradient string for the inner card gradient'
    },
    {
      name: 'showBehindGradient',
      type: 'boolean',
      default: 'true',
      description: 'Whether to display the background gradient effect'
    },
    {
      name: 'className',
      type: 'string',
      default: '""',
      description: 'Additional CSS classes to apply to the card wrapper'
    },
    {
      name: 'enableTilt',
      type: 'boolean',
      default: 'true',
      description: 'Enable or disable the 3D tilt effect on mouse hover'
    },
    {
      name: 'enableMobileTilt',
      type: 'boolean',
      default: 'false',
      description: 'Enable or disable the 3D tilt effect on mobile devices'
    },
    {
      name: 'mobileTiltSensitivity',
      type: 'number',
      default: '5',
      description: 'Sensitivity of the 3D tilt effect on mobile devices'
    },
    {
      name: 'miniAvatarUrl',
      type: 'string',
      default: 'undefined',
      description: 'Optional URL for a smaller avatar in the user info section'
    },
    {
      name: 'name',
      type: 'string',
      default: '"Javi A. Torres"',
      description: "User's display name"
    },
    {
      name: 'title',
      type: 'string',
      default: '"Software Engineer"',
      description: "User's job title or role"
    },
    {
      name: 'handle',
      type: 'string',
      default: '"javicodes"',
      description: "User's handle or username (displayed with @ prefix)"
    },
    {
      name: 'status',
      type: 'string',
      default: '"Online"',
      description: "User's current status"
    },
    {
      name: 'contactText',
      type: 'string',
      default: '"Contact"',
      description: 'Text displayed on the contact button'
    },
    {
      name: 'showUserInfo',
      type: 'boolean',
      default: 'true',
      description: 'Whether to display the user information section'
    },
    {
      name: 'onContactClick',
      type: 'function',
      default: 'undefined',
      description: 'Callback function called when the contact button is clicked'
    }
  ];

  return (
    <TabsLayout>
      <PreviewTab>
        <Box position="relative" className="demo-container" h={700} overflow="hidden">
          <ProfileCard
            key={key}
            name="Javi A. Torres"
            title="Software Engineer"
            handle="javicodes"
            status="Online"
            contactText="Contact Me"
            avatarUrl="/assets/demo/person.webp"
            iconUrl={showIcon ? '/assets/demo/iconpattern.png' : ''}
            showUserInfo={showUserInfo}
            showBehindGradient={showBehindGradient}
            grainUrl="/assets/demo/grain.webp"
            behindGradient={customBehindGradient}
            innerGradient={customInnerGradient}
            enableMobileTilt={enableMobileTilt}
          />
        </Box>{' '}
        <Customize>
          <Button
            onClick={generateRandomGradients}
            fontSize="xs"
            bg="#170D27"
            borderRadius="10px"
            border="1px solid #271E37"
            _hover={{ bg: '#271E37' }}
            color="#fff"
            h={8}
          >
            Randomize Colors
          </Button>

          <PreviewSwitch
            title="Show Icon Pattern"
            isChecked={showIcon}
            onChange={() => {
              setShowIcon(!showIcon);
              forceRerender();
            }}
          />
          <PreviewSwitch
            title="Show User Info"
            isChecked={showUserInfo}
            onChange={() => {
              setShowUserInfo(!showUserInfo);
              forceRerender();
            }}
          />
          <PreviewSwitch
            title="Show BG Gradient"
            isChecked={showBehindGradient}
            onChange={() => {
              setShowBehindGradient(!showBehindGradient);
              forceRerender();
            }}
          />
          <PreviewSwitch
            title="Enable Mobile Tilt"
            isChecked={enableMobileTilt}
            onChange={() => {
              setEnableMobileTilt(!enableMobileTilt);
              forceRerender();
            }}
          />
        </Customize>
        <PropTable data={propData} />
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={profileCard} />
      </CodeTab>
    </TabsLayout>
  );
};

export default ProfileCardDemo;
