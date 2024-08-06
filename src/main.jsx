import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.scss'

import { ChakraProvider, extendTheme } from '@chakra-ui/react'

const customTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false
  },
  styles: {
    global: {
      'html, body': {
        minHeight: '100vh',
        fontFamily: '"DM Sans", sans-serif',
        backgroundColor: '#000'
    }
  }
}
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ChakraProvider theme={customTheme}>
    <App />
  </ChakraProvider>,
)
