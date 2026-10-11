import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

import { Provider } from './components/setup/provider';
import { initInputModeTracking } from './utils/inputMode';
import BootReady from './components/common/BootReady';

initInputModeTracking();

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider>
    <App />
    <BootReady />
  </Provider>
);
