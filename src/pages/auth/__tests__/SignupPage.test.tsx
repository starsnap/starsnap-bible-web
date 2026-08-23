import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from '../SignupPage';
import * as api from '../../../services/api';

jest.mock('../../../services/api');

describe('SignupPage', () => {
  beforeEach(() => {
    (api.checkEmailAvailability as jest.Mock).mockResolvedValue(true);
    (api.signUp as jest.Mock).mockResolvedValue({ userId: '1', token: 'tok', next: '/welcome' });
  });

  it('allows user to fill and submit form', async () => {
    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText(/이메일/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/비밀번호$/i), { target: { value: 'Abcd1234!' } });
    fireEvent.change(screen.getByLabelText(/비밀번호 확인/i), { target: { value: 'Abcd1234!' } });
    fireEvent.change(screen.getByLabelText(/닉네임/i), { target: { value: 'tester' } });
    // accept terms checkbox is using register span; click the label link won't toggle; simulate register by clicking input name
    const accept = screen.getByLabelText(/서비스 이용약관/i) as HTMLLabelElement;
    // fallback: find checkbox by id
    const checkbox = document.getElementById('acceptTerms') as HTMLInputElement;
    if (checkbox) checkbox.click();

    fireEvent.click(screen.getByRole('button', { name: /가입하기/i }));

    await waitFor(() => expect(api.signUp).toHaveBeenCalled());
  });
});
