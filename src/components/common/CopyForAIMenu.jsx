import { Menu, Portal, Box } from '@chakra-ui/react';
import { Check, ChevronDown } from 'lucide-react';
import { colors } from '../../constants/colors';
import FluidMenuContent from './FluidMenuContent';

const AI_MENU_ITEM_PROPS = {
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  px: 3,
  py: 2,
  fontSize: '14px',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  cursor: 'pointer'
};

export const AIMenuItem = ({ item, done }) => {
  const { key, label, icon: ItemIcon, run } = item;
  return (
    <Menu.Item value={key} onSelect={run} {...AI_MENU_ITEM_PROPS}>
      {done === key ? <Check size={16} color={colors.accent} /> : <ItemIcon size={16} color={colors.textMuted} />}
      {label}
    </Menu.Item>
  );
};

export const AIMenuSeparator = () => (
  <Menu.Separator
    height="1px"
    border="0"
    my={1}
    mx="6px"
    bg="linear-gradient(90deg, transparent, var(--inset-divider) 14%, var(--inset-divider) 86%, transparent)"
  />
);

const CopyForAIMenu = ({ triggerProps, copyItems, openItems, done }) => {
  return (
    <Menu.Root positioning={{ placement: 'bottom-end', gutter: 8 }}>
      <Menu.Trigger asChild>
        <Box
          as="button"
          aria-label="Copy for AI"
          display="flex"
          cursor="pointer"
          alignItems="center"
          {...triggerProps}
          gap={1.5}
          pl={4}
          pr={2.5}
        >
          {done && <Check size={14} color={colors.accent} />}
          {done ? 'Copied!' : 'Copy for AI'}
          <ChevronDown size={14} />
        </Box>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <FluidMenuContent
            bg={colors.bgBody}
            border={`1px solid ${colors.borderPrimary}`}
            borderRadius="10px"
            p={1}
            minW="235px"
            boxShadow="var(--shadow-menu)"
            zIndex={1500}
            transformOrigin="top right"
          >
            {copyItems.map(item => (
              <AIMenuItem key={item.key} item={item} done={done} />
            ))}
            <AIMenuSeparator />
            {openItems.map(item => (
              <AIMenuItem key={item.key} item={item} done={done} />
            ))}
          </FluidMenuContent>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default CopyForAIMenu;
