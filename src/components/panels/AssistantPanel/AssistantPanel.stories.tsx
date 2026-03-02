import type { Meta, StoryObj } from '@storybook/react'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../../theme'
import AssistantPanel from './AssistantPanel'
import { defaultProps } from './AssistantPanel.mockdata'

const meta: Meta<typeof AssistantPanel> = {
  title: 'Components/AssistantPanel',
  component: AssistantPanel,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof AssistantPanel>

export const Open: Story = { args: defaultProps }
export const Closed: Story = { args: { ...defaultProps, isOpen: false } }
