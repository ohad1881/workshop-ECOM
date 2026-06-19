import { TextField } from '@mui/material';

/**
 * React-Hook-Form-bound MUI TextField. Owns the register/error/helperText
 * wiring so forms don't repeat (and can't desync) it per field. Any other
 * TextField prop (label, type, ...) passes straight through.
 */
const FormTextField = ({ name, register, errors, sx = { mb: 2 }, ...props }) => (
  <TextField
    fullWidth
    {...register(name)}
    error={!!errors[name]}
    helperText={errors[name]?.message}
    sx={sx}
    {...props}
  />
);

export default FormTextField;
