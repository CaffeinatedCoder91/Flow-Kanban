import type { Meta, StoryObj } from '@storybook/react'
import { WelcomeModal } from './WelcomeModal'

const meta: Meta<typeof WelcomeModal> = {
  title: 'Components/WelcomeModal',
  component: WelcomeModal,
}
export default meta

type Story = StoryObj<typeof WelcomeModal>

export const Default: Story = {
  args: { onClose: () => {} },
}
