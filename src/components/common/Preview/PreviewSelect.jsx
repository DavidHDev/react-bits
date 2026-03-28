import { useMemo } from 'react';
import { Flex, Text, Select, Field, Portal, createListCollection } from '@chakra-ui/react';
import { colors } from '../../../constants/colors';

const PreviewSelect = ({
  title = '',
  options = [],
  value = '',
  width = 100,
  isDisabled = false,
  name = '',
  onChange
}) => {
  const values = useMemo(() => options.map(opt => opt.value), [options]);
  const labelMap = useMemo(
    () =>
      options.reduce((map, opt) => {
        map[opt.value] = opt.label;
        return map;
      }, {}),
    [options]
  );

  const collection = useMemo(() => createListCollection({ items: values }), [values]);

  const handleChange = ({ value: next }) => onChange?.(next[0]);

  return (
    <Flex gap="4" align="center" mt="4">
      <Text fontSize="sm">{title}</Text>

      <Field.Root width="auto">
        <Select.Root
          collection={collection}
          value={[value]}
          onValueChange={handleChange}
          size="sm"
          disabled={isDisabled}
        >
          <Select.HiddenSelect name={name} />

          <Select.Control>
            <Select.Trigger
              fontSize="14px"
              h={8}
              w={`${width}px`}
              bg={colors.bgBody}
              border={`1px solid ${colors.borderSecondary}`}
              borderRadius="10px"
            >
              <Select.ValueText fontSize="14px">{labelMap[value]}</Select.ValueText>
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator fontSize="14px" />
            </Select.IndicatorGroup>
          </Select.Control>

          <Portal>
            <Select.Positioner>
              <Select.Content bg={colors.bgBody} border={`1px solid ${colors.borderSecondary}`} borderRadius="10px">
                {collection.items.map(val => (
                  <Select.Item
                    key={val}
                    item={val}
                    fontSize="14px"
                    borderRadius="10px"
                    cursor="pointer"
                    _highlighted={{ bg: colors.bgHover }}
                  >
                    <Select.ItemText>{labelMap[val]}</Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Field.Root>
    </Flex>
  );
};

export default PreviewSelect;
