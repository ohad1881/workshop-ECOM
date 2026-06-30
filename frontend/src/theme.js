import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Lightweight light-only theme: neutral greys + a single blue accent.
// Keep this minimal — extend palette/typography here rather than hardcoding
// colors in components.
const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1D4ED8', contrastText: '#FFFFFF' },
    secondary: { main: '#6B7280', light: '#9CA3AF', dark: '#374151' },
    background: { default: '#FFFFFF', paper: '#FFFFFF' },
    text: { primary: '#111827', secondary: '#6B7280' },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.5px' },
    h2: { fontSize: '2rem', fontWeight: 700 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 8 },
});

// Auto-scale heading/typography sizes down on smaller breakpoints so text never
// overflows on phones/tablets — applied app-wide via the ThemeProvider.
const theme = responsiveFontSizes(baseTheme);

export default theme;
