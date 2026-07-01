import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Dark, glassmorphic theme inspired by the GiftGraph pitch deck: near-black
// purple background with purple + gold glow accents and blurred glass panels.
// Extend palette/typography/component overrides here rather than hardcoding
// colors in components.
const baseTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#8B5CF6', light: '#A78BFA', dark: '#6D28D9', contrastText: '#FFFFFF' },
    secondary: { main: '#F5A623', light: '#FBBF24', dark: '#B45309', contrastText: '#1A1424' },
    background: { default: '#0A0714', paper: 'rgba(32, 27, 48, 0.82)' },
    text: { primary: '#F3F1F8', secondary: '#ABA3C2' },
    divider: 'rgba(167, 139, 250, 0.2)',
    // Extra surface tone for the chat widget: bubbles/cards sit on a
    // background.default drawer canvas, so they need something visibly lighter
    // than the ambient background.paper to read as distinct panels.
    chatSurface: 'rgba(54, 46, 78, 0.95)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontFamily: '"Space Grotesk", Inter, sans-serif', fontSize: '2.75rem', fontWeight: 700, letterSpacing: '-0.5px' },
    h2: { fontFamily: '"Space Grotesk", Inter, sans-serif', fontSize: '2rem', fontWeight: 700 },
    h3: { fontFamily: '"Space Grotesk", Inter, sans-serif', fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontFamily: '"Space Grotesk", Inter, sans-serif', fontSize: '1.25rem', fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: '100vh',
          backgroundColor: '#0A0714',
          backgroundImage: [
            'radial-gradient(ellipse 900px 600px at 15% -10%, rgba(139,92,246,0.28), transparent 60%)',
            'radial-gradient(ellipse 800px 600px at 90% 10%, rgba(245,166,35,0.16), transparent 60%)',
            'radial-gradient(ellipse 700px 500px at 50% 100%, rgba(139,92,246,0.14), transparent 60%)',
          ].join(', '),
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(16px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          transition: 'box-shadow 0.25s ease, transform 0.15s ease',
          '&:hover': {
            boxShadow: '0 0 24px rgba(139, 92, 246, 0.55)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          transition: 'box-shadow 0.25s ease, transform 0.15s ease',
          '&:hover': {
            boxShadow: '0 0 18px currentColor',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: 'rgba(255,255,255,0.18)',
          '&.Mui-active': { color: '#8B5CF6', filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.85))' },
          '&.Mui-completed': { color: '#F5A623' },
        },
      },
    },
  },
});

// Auto-scale heading/typography sizes down on smaller breakpoints so text never
// overflows on phones/tablets — applied app-wide via the ThemeProvider.
const theme = responsiveFontSizes(baseTheme);

export default theme;
