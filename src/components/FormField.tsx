import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string | null;
};

export const FormField: React.FC<Props> = ({ label, name, error, className = '', ...rest }) => {
  const id = rest.id ?? name;
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`bg-panel px-3 py-2 text-ink border rounded-md placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent ${error ? 'border-danger' : 'border-line'}`}
        {...rest}
      />
      {error ? (
        <p id={describedBy} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;
