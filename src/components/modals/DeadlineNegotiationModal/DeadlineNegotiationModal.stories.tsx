import type { Meta, StoryObj } from '@storybook/react'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../../../theme'
import DeadlineNegotiationModal from './DeadlineNegotiationModal'
import { makeItem, TOMORROW } from './DeadlineNegotiationModal.mockdata'

const meta: Meta<typeof DeadlineNegotiationModal> = {
  title: 'Components/DeadlineNegotiationModal',
  component: DeadlineNegotiationModal,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <Story />
      </ThemeProvider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof DeadlineNegotiationModal>

export const Default: Story = {
  args: {
    item: makeItem({ due_date: TOMORROW }),
    onClose: () => {},
    onDone: () => {},
  },
}

export const Overdue: Story = {
  args: {
    item: makeItem({ due_date: '2025-01-01' }),
    onClose: () => {},
    onDone: () => {},
  },
}
