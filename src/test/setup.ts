import '@testing-library/jest-dom'

// jsdom doesn't implement scrollIntoView (guard for Node environment)
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = () => {}
}
