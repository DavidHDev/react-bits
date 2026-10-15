import { SearchProvider } from '../../components/context/SearchContext/SearchContext';
import { OptionsProvider } from '../../components/context/OptionsContext/OptionsContext';
import { TransitionProvider } from '../../components/context/TransitionContext/TransitionContext';
import { InstallationProvider } from '../../components/context/InstallationContext/InstallationContext';

export default function Providers({ children }) {
  return (
    <SearchProvider>
      <OptionsProvider>
        <TransitionProvider>
          <InstallationProvider>{children}</InstallationProvider>
        </TransitionProvider>
      </OptionsProvider>
    </SearchProvider>
  );
}
