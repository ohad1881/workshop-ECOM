import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/auth/useAuth';
import { loginRequest } from '../../api/auth';
import { applyFieldErrors } from '../../utils/apiError';

// Form logic for LoginForm. Co-located with its only consumer.
const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setApiError('');
    setIsLoading(true);
    try {
      const { access, refresh, user } = await loginRequest(data.email, data.password);
      login(user, access, refresh);
      navigate('/');
    } catch (error) {
      // DRF field errors go inline on the inputs; anything else (detail, network) as a banner.
      const hadFieldErrors = applyFieldErrors(error, form.setError, ['email', 'password']);
      if (!hadFieldErrors) {
        setApiError(error.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { ...form, onSubmit, apiError, isLoading };
};
