import { createTheme } from '@mui/material/styles';

type PaletteMode = 'light' | 'dark';

export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#FF7A45', // Primary
        light: '#FE7944', // Primary Container
        dark: '#A33702', // Surface Tint / Primary Dim
        contrastText: '#FFF', // Make it white instead of dark for contrast
      },
      secondary: {
        main: '#6C5CE7', // Deep Purple (Intelligence Tone)
        light: '#D2CCFF', // Secondary Container
        dark: '#4935C3', // Secondary Dim
        contrastText: '#FFFFFF',
      },
      error: {
        main: '#B31B25',
        light: '#FB5151',
        dark: '#9F0519',
        contrastText: '#FFEFEE',
      },
      info: {
        main: '#00CEC9',
        light: '#61FFF9',
        dark: '#006764',
        contrastText: '#004B49',
      },
      success: {
        main: '#006764',
        light: '#61FFF9',
        dark: '#005957',
        contrastText: '#FFFFFF',
      },
      background: {
        default: mode === 'light' ? '#FFF4F0' : '#121212', // Surface
        paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E', // Surface Container Lowest
      },
      text: {
        primary: mode === 'light' ? '#4B240A' : '#FFFFFF', // On Surface
        secondary: mode === 'light' ? '#815032' : 'rgba(255, 255, 255, 0.7)', // On Surface Variant
      },
      divider: mode === 'light' ? '#DD9F7C' : 'rgba(255, 255, 255, 0.12)', // Outline Variant
    },
    typography: {
      fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'].join(','),
      fontSize: 16,
      h1: {
        fontFamily: 'Manrope',
        fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
      },
      h2: {
        fontFamily: 'Manrope',
        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        lineHeight: 1.2,
      },
      h3: {
        fontFamily: 'Manrope',
        fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
        fontWeight: 600,
        lineHeight: 1.25,
      },
      h4: {
        fontFamily: 'Manrope',
        fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h5: {
        fontFamily: 'Manrope',
        fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontFamily: 'Manrope',
        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      button: {
        fontFamily: 'Inter',
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 24, // xl (1.5rem)
    },
    shadows: [
      'none',
      mode === 'light' ? '0px 4px 20px rgba(75, 36, 10, 0.05)' : '0px 2px 4px rgba(0,0,0,0.3)', // Ambient Shadows
      mode === 'light' ? '0px 8px 30px rgba(75, 36, 10, 0.05)' : '0px 4px 8px rgba(0,0,0,0.4)',
      mode === 'light' ? '0px 12px 40px rgba(75, 36, 10, 0.05)' : '0px 8px 16px rgba(0,0,0,0.5)',
      mode === 'light' ? '0px 16px 50px rgba(75, 36, 10, 0.05)' : '0px 12px 24px rgba(0,0,0,0.6)',
      mode === 'light' ? '0px 24px 60px rgba(75, 36, 10, 0.05)' : '0px 16px 32px rgba(0,0,0,0.7)',
      ...Array(19).fill('none'),
    ] as any,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            fontSize: '100%',
          },
          body: {
            fontSize: '1rem',
            backgroundColor: mode === 'light' ? '#FFF4F0' : '#121212',
          },
          '*:focus-visible': {
            outline: `3px solid ${mode === 'light' ? '#FF7A45' : '#FE7944'}`,
            outlineOffset: '2px',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true, // Flat by default for modern look
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 24,
            minHeight: 48,
            padding: '10px 24px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
            },
          },
          containedPrimary: {
            backgroundColor: '#FF7A45',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#A33702',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' ? '0px 8px 30px rgba(75, 36, 10, 0.05)' : '0px 4px 8px rgba(0,0,0,0.4)',
            borderRadius: 24, // xl
            border: 'none', // Strict no-line rule
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: mode === 'light' ? '0px 12px 40px rgba(75, 36, 10, 0.08)' : '0px 8px 16px rgba(0,0,0,0.6)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none', // We'll handle glassmorphism in the component or override
            background: 'transparent',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              borderRadius: 16,
              backgroundColor: mode === 'light' ? '#FFDBC9' : '#333',
              '& fieldset': {
                border: 'none',
              },
              '&:hover fieldset': {
                border: 'none',
              },
              '&.Mui-focused fieldset': {
                border: `2px solid ${mode === 'light' ? '#FF7A45' : '#FE7944'}`, // Ghost border fallback
              },
            },
          },
        },
      },
    },
  });

const theme = getTheme('light');

export default theme;
