import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/auth/useAuth';
import { register as registerRequest } from '../../api/auth';
import { applyFieldErrors } from '../../utils/apiError';

// Form logic for RegisterForm. Co-located with its only consumer.
const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one digit'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const useRegisterForm = () => {
  const navigate = useNavigate();
  const { register: setAuth } = useAuth();
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data) => {
    setApiError('');
    setIsLoading(true);
    try {
      const { access, refresh, user } = await registerRequest(
        data.email,
        data.username,
        data.password,
      );
      setAuth(user, access, refresh);
      navigate('/profile');
    } catch (error) {
      // DRF field errors go inline on the inputs; anything else (detail, network) as a banner.
      const hadFieldErrors = applyFieldErrors(error, form.setError, ['email', 'username', 'password']);
      if (!hadFieldErrors) {
        setApiError(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { ...form, onSubmit, apiError, isLoading };
};
