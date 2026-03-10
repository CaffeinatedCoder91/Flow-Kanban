import '@testing-library/jest-dom'

// jsdom doesn't implement scrollIntoView (guard for Node environment)
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = () => {}
}

// jsdom doesn't implement window.matchMedia (used by ThemeContext)
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
