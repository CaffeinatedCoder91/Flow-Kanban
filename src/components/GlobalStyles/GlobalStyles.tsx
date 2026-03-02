import { Global, css, useTheme } from '@emotion/react'

export function GlobalStyles() {
  const theme = useTheme()

  return (
    <Global
      styles={css`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap');

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: ${theme.typography.fontFamily};
          background: ${theme.colors.background};
          color: ${theme.colors.text};
          -webkit-font-smoothing: antialiased;
        }
      `}
    />
  )
}
