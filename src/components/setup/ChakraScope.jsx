import { ChakraProvider } from '@chakra-ui/react';
import { Toaster } from 'sonner';
import { customTheme } from '../../utils/customTheme';
import { toastStyles } from '../../utils/toastStyles';

export default function ChakraScope({ children }) {
  return (
    <ChakraProvider value={customTheme}>
      {children}
      <Toaster toastOptions={toastStyles} position="bottom-right" visibleToasts={2} />
    </ChakraProvider>
  );
}
