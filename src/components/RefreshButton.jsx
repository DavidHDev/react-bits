import { RepeatIcon } from "@chakra-ui/icons";
import { Button } from '@chakra-ui/react';

const RefreshButton = ({ onClick }) => {
  return (
    <Button
      size="sm"
      position="absolute"
      top={3}
      right={3}
      rounded="xl"
      backgroundColor='#00F0FF'
      color="black"
      _hover={{ backgroundColor: '#00F0FF' }}
      _active={{ backgroundColor: '#00F0FF' }}
      transition="background-color 0.3s ease"
      onClick={onClick}
    >
      <RepeatIcon boxSize={6} />
    </Button>
  );
}

export default RefreshButton;