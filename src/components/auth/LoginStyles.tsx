import { styled } from '@mui/material/styles';
import { TextField, Button, Paper, Box } from '@mui/material';

export const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: '#2ecc71',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2ecc71',
    },
  },
});

export const StyledButton = styled(Button)({
  backgroundColor: '#2ecc71',
  '&:hover': {
    backgroundColor: '#27ae60',
  },
  '&.Mui-disabled': {
    backgroundColor: '#95a5a6',
  },
});

export const LoginContainer = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f5f5f5',
  padding: '1rem',
});

export const LoginPaper = styled(Paper)({
  padding: '2rem',
  width: '100%',
  maxWidth: '400px',
  borderRadius: '12px',
});

export const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  marginBottom: '2rem',
}); 