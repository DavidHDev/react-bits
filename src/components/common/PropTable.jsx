import { Table, Thead, Tbody, Tr, Th, Td, Box } from '@chakra-ui/react';

const PropTable = ({ data }) => {
  return (
    <Box overflowX="auto">
      <Table variant="simple" colorScheme="whiteAlpha" size="sm" maxW={600}>
        <Thead>
          <Tr>
            <Th borderColor='#333' textTransform={'capitalize'} fontSize={'l'} pl={0} pb={4} color="white">Prop</Th>
            <Th borderColor='#333' textTransform={'capitalize'} fontSize={'l'} pl={0} pb={4} color="white">Type</Th>
            <Th borderColor='#333' textTransform={'capitalize'} fontSize={'l'} pl={0} pb={4} color="white">Default</Th>
            <Th borderColor='#333' textTransform={'capitalize'} fontSize={'l'} pl={0} pb={4} color="white">Description</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((prop, index) => (
            <Tr key={index}>
              <Td borderColor="#333" py={4} pl={0} color="white">{prop.name}</Td>
              <Td borderColor="#333" py={4} pl={0} color="white">{prop.type}</Td>
              <Td borderColor="#333" py={4} pl={0} color="white">{prop.default || '—'}</Td>
              <Td borderColor="#333" py={4} pl={0} color="white">{prop.description}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default PropTable;
