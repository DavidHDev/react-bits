/* eslint-disable react-refresh/only-export-components */
import { createContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getActiveRoute } from '../../../utils/activeRoute';

export const ActiveRouteContext = createContext();

export const ActiveRouteProvider = ({ children }) => {
  const location = useLocation();
  const value = useMemo(() => getActiveRoute(location.pathname), [location.pathname]);

  return <ActiveRouteContext.Provider value={value}>{children}</ActiveRouteContext.Provider>;
};
