import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export const LoadingButton: React.FC<Props> = ({ loading = false, children, disabled, className = '', ...rest }) => {
  return (
    <button
        className={`px-4 py-2 bg-info text-on-info rounded-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      <span>{children}</span>
    </button>
  );
};

export default LoadingButton;
