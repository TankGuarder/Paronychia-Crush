import { useEffect, useState } from 'react';
import type { LiffInitState } from '../types/game';
import { initializeLiff } from '../services/liffService';

const initialState: LiffInitState = {
  isLoading: true,
  isConfigured: false,
  profile: {
    mode: 'mock',
    isLoggedIn: false,
    isMock: true,
  },
};

export function useLiffProfile() {
  const [state, setState] = useState<LiffInitState>(initialState);

  useEffect(() => {
    let isMounted = true;

    initializeLiff().then((result) => {
      if (isMounted) {
        setState(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
