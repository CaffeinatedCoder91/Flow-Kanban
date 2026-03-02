import type { Meta, StoryObj } from '@storybook/react'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../../theme'
import ImportModal from './ImportModal'

const meta: Meta<typeof ImportModal> = {
  title: 'Components/ImportModal',
  component: ImportModal,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <Story />
      </ThemeProvider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof ImportModal>

export const Default: Story = {
  args: { onClose: () => {}, onImported: () => {} },
}
