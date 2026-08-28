import React, { useMemo, useState, useEffect } from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string | null;
};

function calcStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  // map 0-5 to 0-3
  if (score <= 1) return 0;
  if (score <= 3) return 1;
  return 2;
}

export const PasswordField: React.FC<Props> = ({ label, name, error, className = '', value, onChange, ...rest }) => {
  const [show, setShow] = useState(false);
  const [localValue, setLocalValue] = useState<string>(String(value ?? ''));

  // sync external value if provided
  useEffect(() => {
    if (typeof value === 'string') setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    if (onChange) onChange(e);
  };

  const strength = useMemo(() => calcStrength(String(localValue || '')), [localValue]);
  const strengthLabel = ['약함', '보통', '강함'][Math.max(0, Math.min(2, strength))];

  const id = rest.id ?? name;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          defaultValue={localValue}
          onChange={handleChange}
          className={`w-full bg-panel px-3 py-2 text-ink border rounded-md placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand ${error ? 'border-danger' : 'border-line'}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-sub"
        >
          {show ? '숨기기' : '보기'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-full bg-placeholder h-2 rounded overflow-hidden">
          <div
            className={`h-2 rounded transition-[width] duration-200 ${strength === 0 ? 'w-1/4 bg-danger' : strength === 1 ? 'w-1/2 bg-brand' : 'w-full bg-success'}`}
            style={{ width: strength === 0 ? '33%' : strength === 1 ? '66%' : '100%' }}
            aria-hidden
          />
        </div>
        <span className="text-xs text-sub">{strengthLabel}</span>
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default PasswordField;
