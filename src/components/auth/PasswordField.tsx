import React from 'react';
import { StyledTextField } from './LoginStyles';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';

export interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  error?: boolean;
  helperText?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  value,
  onChange,
  disabled,
  showPassword = false,
  onTogglePassword,
  error,
  helperText,
}) => {
  return (
    <StyledTextField
      label="Password"
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      fullWidth
      disabled={disabled}
      error={error}
      helperText={helperText}
      autoComplete="current-password"
      InputProps={{
        endAdornment: onTogglePassword && (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={onTogglePassword}
              edge="end"
              disabled={disabled}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}; 