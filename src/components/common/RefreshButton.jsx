import { RepeatIcon } from "@chakra-ui/icons";
import { Button } from '@chakra-ui/react';

const RefreshButton = ({ onClick }) => {
  return (
    <Button
      size="sm"
      position="absolute"
      top={3}
      right={3}
      p={2}
      rounded="xl"
      backgroundColor='#222'
      color="white"
      _hover={{ backgroundColor: '#333' }}
      _active={{ backgroundColor: '#333' }}
      transition="background-color 0.3s ease"
      onClick={onClick}
    >
      <RepeatIcon boxSize={4} />
    </Button>
  );
}

export default RefreshButton;