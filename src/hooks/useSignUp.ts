import { useCallback, useState } from 'react';
import { signUp, SignUpRequest, SignUpSuccess } from '../services/api';

type UseSignUpResult = {
  loading: boolean;
  error: string | null;
  submit: (payload: SignUpRequest) => Promise<SignUpSuccess | null>;
};

export function useSignUp(): UseSignUpResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: SignUpRequest) => {
    setLoading(true);
    setError(null);
    try {
      const data = await signUp(payload);
      setLoading(false);
      return data;
    } catch (err: any) {
      setLoading(false);
      const msg = err?.response?.data?.message || err?.response?.data?.errors || err?.message || '서버 에러가 발생했습니다.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      return null;
    }
  }, []);

  return { loading, error, submit };
}
