import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import FormTextField from '../../general_components/FormTextField';
import { useLoginForm } from './useLoginForm';

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    onSubmit,
    apiError,
    isLoading,
  } = useLoginForm();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', py: 4 }}>
      <Card sx={{ width: '100%', maxWidth: 400, p: 4 }}>
        <Typography variant="h3" sx={{ mb: 3, textAlign: 'center' }}>
          Login
        </Typography>

        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormTextField
            label="Email or Username"
            type="text"
            name="email"
            register={register}
            errors={errors}
            disabled={isLoading}
          />
          <FormTextField
            label="Password"
            type="password"
            name="password"
            register={register}
            errors={errors}
            sx={{ mb: 3 }}
            disabled={isLoading}
          />
          <Button fullWidth variant="contained" type="submit" sx={{ py: 1.5 }} disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link component={RouterLink} to="/register" fontWeight={600}>
              Register here
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginForm;
