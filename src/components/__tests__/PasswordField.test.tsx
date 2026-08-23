import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PasswordField from '../PasswordField';

describe('PasswordField', () => {
  it('renders and toggles visibility', () => {
    const handleChange = jest.fn();
    render(<PasswordField label="비밀번호" name="password" value="Abc123!@" onChange={handleChange} />);
    const toggle = screen.getByRole('button', { name: /비밀번호 보기|비밀번호 숨기기/i });
    expect(toggle).toBeInTheDocument();
    // initial is hidden
    const input = screen.getByLabelText('비밀번호') as HTMLInputElement;
    expect(input.type).toBe('password');
    fireEvent.click(toggle);
    // after toggle visible
    expect(input.type).toBe('text');
  });
});
