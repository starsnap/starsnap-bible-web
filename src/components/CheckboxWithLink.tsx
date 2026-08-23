import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label?: React.ReactNode;
};

export const CheckboxWithLink: React.FC<Props> = ({ id, label, className = '', ...rest }) => {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <input id={id} type="checkbox" className="mt-1" {...rest} />
      <label htmlFor={id} className="text-sm text-sub">
        {label}
      </label>
    </div>
  );
};

export default CheckboxWithLink;
