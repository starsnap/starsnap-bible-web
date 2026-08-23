import React from 'react';

type Props = {
  provider: 'google' | 'apple' | 'kakao';
  onClick?: () => void;
};

export const SocialSignInButton: React.FC<Props> = ({ provider, onClick }) => {
  const label = provider === 'google' ? '구글로 계속' : provider === 'apple' ? 'Apple로 계속' : '카카오로 계속';
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-full py-2 px-3 border rounded-md flex items-center justify-center gap-2 hover:shadow-sm"
    >
      <span className="text-sm">{label}</span>
    </button>
  );
};

export default SocialSignInButton;
