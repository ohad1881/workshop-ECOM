import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

// Thin wrapper over MUI Select that takes an `options: [{ value, label }]` array.
const CustomSelect = ({ label, value, onChange, options = [], ...props }) => (
  <FormControl fullWidth size="small" {...props}>
    {label && <InputLabel>{label}</InputLabel>}
    <Select label={label} value={value} onChange={onChange}>
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default CustomSelect;
