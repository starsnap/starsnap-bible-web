import { useEffect, useRef, useState } from 'react';
import { checkUsernameAvailability } from '../services/api';

type UseUsernameCheckState = {
  available: boolean | null;
  loading: boolean;
  error: string | null;
};

export function useUsernameCheck(username: string | undefined, opts?: { debounceMs?: number }) {
  const debounceMs = opts?.debounceMs ?? 700;
  const [state, setState] = useState<UseUsernameCheckState>({ available: null, loading: false, error: null });
  const timerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!username) {
      setState({ available: null, loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    const requestId = ++requestIdRef.current;
    timerRef.current = window.setTimeout(async () => {
      try {
        const available = await checkUsernameAvailability(username);
        if (requestId !== requestIdRef.current) return;
        setState({ available, loading: false, error: null });
      } catch (err: any) {
        if (requestId !== requestIdRef.current) return;
        const status = err?.response?.status;
        if (status === 400 || status === 409) {
          setState({ available: false, loading: false, error: null });
          return;
        }
        setState({ available: null, loading: false, error: err?.message || '아이디 확인에 실패했습니다.' });
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [username, debounceMs]);

  return state;
}
