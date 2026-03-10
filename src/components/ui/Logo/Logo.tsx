import React from 'react'
import { useTheme } from '@emotion/react'

export const Logo = ({ size = 40, style }: { size?: number; style?: React.CSSProperties }) => {
  const theme = useTheme()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      aria-label="Flow logo"
      style={style}
    >
      <path
        d="M10 40C10 40 20 20 30 20C40 20 40 40 50 40C60 40 70 20 70 20"
        stroke={theme.colors.primary}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 55C10 55 20 35 30 35C40 35 40 55 50 55C60 55 70 35 70 35"
        stroke={theme.colors.primary}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  )
}
