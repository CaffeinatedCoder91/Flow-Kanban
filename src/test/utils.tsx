import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { ThemeContextProvider } from '../context/ThemeContext'

function render(ui: React.ReactElement, options?: RenderOptions) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeContextProvider>{children}</ThemeContextProvider>
  )
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
export { render }
