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
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    if (!email) {
      setState({ available: null, loading: false, error: null });
      return;
    }

    setState({ available: null, loading: true, error: null });

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(async () => {
      try {
        const available = await checkEmailAvailability(email);
        if (requestId !== requestIdRef.current) return;
        setState({ available, loading: false, error: null });
      } catch (err: any) {
        if (requestId !== requestIdRef.current) return;

        const status = err?.response?.status;
        if (status === 409) {
          setState({ available: false, loading: false, error: null });
          return;
        }
        if (status === 400) {
          setState({ available: null, loading: false, error: '유효한 이메일을 입력하세요.' });
          return;
        }

        setState({
          available: null,
          loading: false,
          error: status === 429
            ? '확인 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
            : '이메일 확인에 실패했습니다. 잠시 후 다시 시도해주세요.',
        });
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [email, debounceMs]);

  return state;
}
