import type { Meta, StoryObj } from '@storybook/react'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../../theme'
import ClearBoardModal from './ClearBoardModal'
import { defaultProps } from './ClearBoardModal.mockdata'

const meta: Meta<typeof ClearBoardModal> = {
  title: 'Components/ClearBoardModal',
  component: ClearBoardModal,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <Story />
      </ThemeProvider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof ClearBoardModal>

export const Default: Story = {
  args: defaultProps,
}

export const SingleTask: Story = {
  args: { ...defaultProps, itemCount: 1 },
}

export const ManyTasks: Story = {
  args: { ...defaultProps, itemCount: 42 },
}
