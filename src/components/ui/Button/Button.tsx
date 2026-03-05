import type { ButtonProps } from './Button.types'
import { ButtonRoot, ButtonSpinner } from './Button.styles'

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps): React.ReactElement => (
  <ButtonRoot variant={variant} size={size} disabled={disabled || loading} {...props}>
    {loading && <ButtonSpinner />}
    {children}
  </ButtonRoot>
)
