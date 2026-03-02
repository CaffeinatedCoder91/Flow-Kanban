import type { Preview } from '@storybook/react-vite'
import { ThemeProvider, Global, css } from '@emotion/react'
import { theme } from '../src/theme'
import '../src/index.css'

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <Global
          styles={css`
            *, *::before, *::after {
              box-sizing: border-box;
            }
            body {
              font-family: ${theme.typography.fontFamily};
              margin: 0;
              padding: 0;
              background: ${theme.colors.background};
              color: ${theme.colors.text};
            }
          `}
        />
        <Story />
      </ThemeProvider>
    ),
  ],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: 'todo',
    },
  },
}

export default preview
