import { useEffect, useRef, useState } from 'react';
import { checkEmailAvailability } from '../services/api';

type UseEmailCheck = {
  available: boolean | null;
  loading: boolean;
  error: string | null;
};

export function useEmailCheck(email: string | undefined, opts?: { debounceMs?: number }) {
  const debounceMs = opts?.debounceMs ?? 500;
  const [state, setState] = useState<UseEmailCheck>({ available: null, loading: false, error: null });
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!email) {
      setState({ available: null, loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      try {
        const available = await checkEmailAvailability(email);
        setState({ available, loading: false, error: null });
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.message === 'canceled') return;
        setState({ available: null, loading: false, error: err?.message || '이메일 확인에 실패했습니다.' });
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      if (abortRef.current) abortRef.current.abort();
    };
  }, [email, debounceMs]);

  return state;
}
