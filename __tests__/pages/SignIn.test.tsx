import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignIn from '../../pages/SignIn';
import { AuthProvider } from '../../context/AuthContext';
import { vi } from 'vitest';
import * as supabaseService from '../../services/supabaseService';

vi.mock('../../services/supabaseService', () => ({
  loginWithEmail: vi.fn(),
  getUserProfile: vi.fn().mockResolvedValue({ id: '1', role: 'Customer', name: 'Test' }),
  subscribeToAuth: vi.fn().mockReturnValue(() => {})
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('SignIn Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithRouter(<SignIn />);
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('displays error on failed login', async () => {
    (supabaseService.loginWithEmail as any).mockRejectedValue(new Error('Invalid credentials'));
    
    renderWithRouter(<SignIn />);
    
    // We also need to fix missing 'act' wrapping for form click. 
    // And actually, since there are animations or loading states, it's better to wrap the click in act if it doesn't await a waitFor immediately?
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('calls loginWithEmail on successful form submission', async () => {
    (supabaseService.loginWithEmail as any).mockResolvedValue({ id: '1' });
    
    renderWithRouter(<SignIn />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'correct' } });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    });

    await waitFor(() => {
      expect(supabaseService.loginWithEmail).toHaveBeenCalledWith('test@example.com', 'correct', 'Tenant');
    });
  });
});
