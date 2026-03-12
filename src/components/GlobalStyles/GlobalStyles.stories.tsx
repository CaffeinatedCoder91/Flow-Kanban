import type { Meta, StoryObj } from '@storybook/react-vite'
import { GlobalStyles } from './GlobalStyles'

const meta: Meta<typeof GlobalStyles> = {
  title: 'Components/GlobalStyles',
  component: GlobalStyles,
}
export default meta

type Story = StoryObj<typeof GlobalStyles>

export const Default: Story = {}
