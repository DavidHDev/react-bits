import { Table, Box, Text } from '@chakra-ui/react';
import { colors } from '../../../constants/colors';

const HEADER_CELL_STYLE = {
  letterSpacing: '-.5px',
  borderRight: `1px solid ${colors.borderSecondary}`,
  textTransform: 'capitalize',
  fontSize: 'l',
  p: 4,
  color: 'white'
};

const BODY_CELL_STYLE = {
  borderColor: colors.bgHover,
  p: 2,
  color: 'white',
  borderRight: `1px solid ${colors.borderSecondary}`,
  bg: colors.bgBody
};

const CodeCell = ({ content = '' }) => (
  <Box
    fontFamily="monospace"
    fontSize="10px"
    py="0.2em"
    px="0.6em"
    ml={2}
    borderRadius="5px"
    width="fit-content"
    fontWeight={500}
    color="#e9e9e9"
    bg={colors.bgHover}
  >
    {content}
  </Box>
);

const PropTable = ({ data }) => (
  <Box mt={12}>
    <h2 className="demo-title-extra">Props</h2>
    <Box overflowX="auto" mt={6}>
      <Table.Root variant="line" size="sm" className="props-table">
        <Table.Header borderBottom={`1px solid ${colors.borderSecondary}`}>
          <Table.Row bg={colors.bgElevated} borderRadius="20px">
            <Table.ColumnHeader {...HEADER_CELL_STYLE}>Property</Table.ColumnHeader>
            <Table.ColumnHeader {...HEADER_CELL_STYLE}>Type</Table.ColumnHeader>
            <Table.ColumnHeader {...HEADER_CELL_STYLE}>Default</Table.ColumnHeader>
            <Table.ColumnHeader {...HEADER_CELL_STYLE} borderRight="none">
              Description
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map((prop, index) => (
            <Table.Row
              key={index}
              borderBottom={index === data.length - 1 ? 'none' : `1px solid ${colors.borderSecondary}`}
            >
              <Table.Cell {...BODY_CELL_STYLE} width={0}>
                <CodeCell content={prop.name} />
              </Table.Cell>
              <Table.Cell {...BODY_CELL_STYLE} p={4} whiteSpace="nowrap" width="120px" fontSize="12px">
                <Text fontFamily="monospace" fontWeight={500}>
                  {prop.type}
                </Text>
              </Table.Cell>
              <Table.Cell {...BODY_CELL_STYLE} whiteSpace="nowrap">
                <CodeCell content={prop.default?.length ? prop.default : '—'} />
              </Table.Cell>
              <Table.Cell
                borderColor={colors.bgHover}
                p={4}
                color="white"
                bg={colors.bgBody}
                fontSize="12px"
                borderRight="none"
              >
                <Text maxW={300}>{prop.description}</Text>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  </Box>
);

export default PropTable;
