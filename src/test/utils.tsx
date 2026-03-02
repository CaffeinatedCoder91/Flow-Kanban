import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../theme'

function render(ui: React.ReactElement, options?: RenderOptions) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  )
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
export { render }
