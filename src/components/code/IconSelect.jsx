import { useMemo } from 'react';
import { Select, Flex, Text, Box, Portal, createListCollection } from '@chakra-ui/react';
import { colors } from '../../constants/colors';

const TRIGGER_STYLE = {
  cursor: 'pointer',
  fontSize: '14px',
  h: 10,
  bg: colors.bgBody,
  border: `1px solid ${colors.borderSecondary}`,
  rounded: '15px',
  px: 3
};

const CONTENT_STYLE = {
  bg: colors.bgBody,
  border: `1px solid ${colors.borderSecondary}`,
  borderRadius: '15px',
  px: 2,
  py: 2
};

const ITEM_STYLE = {
  fontSize: '14px',
  borderRadius: '8px',
  cursor: 'pointer',
  py: 1.5,
  display: 'flex',
  alignItems: 'center',
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
  width = '150px',
  closeOnSelect = false
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
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger {...TRIGGER_STYLE}>
          <Select.ValueText fontSize="13px" display="flex" alignItems="center" gap={2}>
            {value && (
              <>
                <img src={iconMap[value]} alt={value} style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#c9c9c9' }}>{labelMap[value]}</span>
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
          <Select.Content {...CONTENT_STYLE} w={width}>
            {collection.items.map(item => (
              <Select.Item key={item} item={item} {...ITEM_STYLE}>
                <Flex align="center" gap={2}>
                  <img src={iconMap[item]} alt={item} style={{ width: '20px', height: '20px' }} />
                  <Text fontSize="14px" fontWeight={600} color="#c9c9c9">
                    {labelMap[item]}
                  </Text>
                </Flex>
                <Select.ItemIndicator display="flex" alignItems="center" ml="auto" mr={1}>
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
