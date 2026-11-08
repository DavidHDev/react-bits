import { useMemo, useSyncExternalStore } from 'react';
import { useSessionSave } from '../../session';
import { SESSION_TOOL, getRemembered, subscribeRemembered } from '../utils/remember';

export default function SessionSave({ studio }) {
  const remembered = useSyncExternalStore(subscribeRemembered, getRemembered);
  const value = useMemo(() => ({ ...studio, remembered }), [studio, remembered]);
  useSessionSave(SESSION_TOOL, value);
  return null;
}
