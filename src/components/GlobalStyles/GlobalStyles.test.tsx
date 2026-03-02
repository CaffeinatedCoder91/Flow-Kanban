import { render } from '../../test/utils'
import { describe, it, expect } from 'vitest'
import { GlobalStyles } from './GlobalStyles'

describe('GlobalStyles', () => {
  it('renders without crashing', () => {
    const { container } = render(<GlobalStyles />)
    // Global injects styles into <head>, not into the container
    expect(container).toBeInTheDocument()
  })
})
