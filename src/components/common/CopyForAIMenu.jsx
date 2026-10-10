import { Menu, Portal } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowUpRight01Icon, Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import FluidMenuContent from './FluidMenuContent';

const ItemIcon = ({ icon: Glyph, done }) => {
  if (done) {
    return (
      <span className="docs-menu-icon docs-tool-done">
        <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={1.6} aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="docs-menu-icon">
      {Array.isArray(Glyph) ? (
        <HugeiconsIcon icon={Glyph} size={16} strokeWidth={1.6} aria-hidden="true" />
      ) : (
        <Glyph size={15} aria-hidden="true" />
      )}
    </span>
  );
};

export const AIMenuItem = ({ item, done, external }) => {
  const { key, label, icon, run } = item;
  return (
    <Menu.Item value={key} onSelect={run} className="docs-menu-item">
      <ItemIcon icon={icon} done={done === key} />
      {done === key ? 'Copied' : label}
      {external && (
        <span className="docs-menu-trail">
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={1.8} aria-hidden="true" />
        </span>
      )}
    </Menu.Item>
  );
};

export const MenuGroup = ({ label, children }) => (
  <Menu.ItemGroup className="docs-menu-group">
    <Menu.ItemGroupLabel className="docs-menu-label">{label}</Menu.ItemGroupLabel>
    {children}
  </Menu.ItemGroup>
);

export const AIMenuSections = ({ copyItems, openItems, done }) => (
  <>
    <MenuGroup label="Copy">
      {copyItems.map(item => (
        <AIMenuItem key={item.key} item={item} done={done} />
      ))}
    </MenuGroup>
    <MenuGroup label="Open in">
      {openItems.map(item => (
        <AIMenuItem key={item.key} item={item} done={done} external />
      ))}
    </MenuGroup>
  </>
);

const CopyForAIMenu = ({ copyItems, openItems, done }) => {
  return (
    <Menu.Root positioning={{ placement: 'bottom-end', gutter: 8 }}>
      <Menu.Trigger asChild>
        <button type="button" className="docs-tool" aria-label="Copy for AI">
          {done ? (
            <span className="docs-menu-icon docs-tool-done">
              <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={1.6} aria-hidden="true" />
            </span>
          ) : (
            <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={1.6} aria-hidden="true" />
          )}
          {done ? 'Copied' : 'Copy for AI'}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={14}
            strokeWidth={1.8}
            className="docs-tool-chevron"
            aria-hidden="true"
          />
        </button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <FluidMenuContent minW="236px" zIndex={1500} transformOrigin="top right">
            <AIMenuSections copyItems={copyItems} openItems={openItems} done={done} />
          </FluidMenuContent>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default CopyForAIMenu;
