import { useMemo } from 'react';
import { Select, Flex, Text, Box, Portal, createListCollection } from '@chakra-ui/react';
import { colors } from '../../constants/colors';

const TRIGGER_STYLE = {
  cursor: 'pointer',
  fontSize: '14px',
  h: 10,
  bg: 'var(--action-control-bg)',
  border: '1px solid var(--action-control-border)',
  rounded: '10px',
  px: 3,
  transition: 'background-color var(--transition-base), transform var(--dur-press) var(--ease-out)',
  _hover: { bg: 'var(--action-control-hover)' },
  _active: { transform: 'scale(0.98)' },
  '&[data-state="open"]': {
    bg: 'var(--action-control-selected)',
    borderColor: 'var(--action-control-selected-border)',
    boxShadow: 'var(--action-control-shadow)'
  }
};

const CONTENT_STYLE = {
  bg: 'var(--shell-panel-solid)',
  border: `1px solid ${colors.borderSecondary}`,
  borderRadius: '10px',
  boxSizing: 'border-box',
  overflowX: 'hidden',
  p: 1,
  zIndex: 1600
};

const ITEM_STYLE = {
  fontSize: '14px',
  borderRadius: '5px',
  cursor: 'pointer',
  px: 2,
  py: 1,
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  width: '100%',
  gap: 2,
  _highlighted: { bg: colors.bgHover }
};

const IconSelect = ({
  collection: collectionItems,
  value,
  onChange,
  iconMap,
  labelMap,
  colorMap,
  iconClassName = '',
  width = '150px',
  contentWidth = width,
  closeOnSelect = false,
  placement = 'bottom-start',
  triggerHeight = 10,
  triggerRadius = '10px',
  triggerClassName = ''
}) => {
  const collection = useMemo(() => createListCollection({ items: collectionItems }), [collectionItems]);

  return (
    <Select.Root
      collection={collection}
      value={[value]}
      onValueChange={({ value: v }) => onChange(v[0])}
      size="sm"
      width={width}
      closeOnSelect={closeOnSelect}
      positioning={{ placement }}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger
          {...TRIGGER_STYLE}
          className={triggerClassName}
          h={triggerHeight}
          minH={triggerHeight}
          rounded={triggerRadius}
        >
          <Select.ValueText fontSize="13px" display="flex" alignItems="center" gap={2} whiteSpace="nowrap">
            {value && (
              <>
                <img
                  className={`icon-select-icon ${iconClassName}`.trim()}
                  src={iconMap[value]}
                  alt=""
                  aria-hidden="true"
                  style={{ width: '16px', height: '16px' }}
                />
                <span
                  style={{
                    overflow: 'hidden',
                    fontSize: '14px',
                    fontWeight: 450,
                    color: 'var(--text-primary)',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {labelMap[value]}
                </span>
              </>
            )}
          </Select.ValueText>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Trigger>
      </Select.Control>

      <Portal>
        <Select.Positioner>
          <Select.Content {...CONTENT_STYLE} w={contentWidth}>
            {collection.items.map(item => (
              <Select.Item key={item} item={item} {...ITEM_STYLE}>
                <Flex align="center" gap={2} minW={0}>
                  <img
                    className={`icon-select-icon ${iconClassName}`.trim()}
                    src={iconMap[item]}
                    alt=""
                    aria-hidden="true"
                    style={{ width: '20px', height: '20px' }}
                  />
                  <Text
                    flexShrink={0}
                    fontSize="14px"
                    fontWeight={450}
                    color="var(--text-primary)"
                    minW={0}
                    whiteSpace="nowrap"
                  >
                    {labelMap[item]}
                  </Text>
                </Flex>
                <Select.ItemIndicator
                  display="flex"
                  alignItems="center"
                  flexShrink={0}
                  ml={1}
                  color="var(--text-dimmed)"
                  opacity={0.65}
                >
                  {colorMap && <Box boxSize={2} bg={colorMap[item]} borderRadius="full" />}
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
};

export default IconSelect;
