import type { Meta, StoryObj } from '@storybook/react-vite'
import { ThemeProvider } from '@emotion/react-vite'
import { theme } from '@/theme'
import { KanbanBoard } from './KanbanBoard'
import { defaultBoardProps, mockItems } from './KanbanBoard.mockdata'

const meta: Meta<typeof KanbanBoard> = {
  title: 'Components/KanbanBoard',
  component: KanbanBoard,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <Story />
      </ThemeProvider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof KanbanBoard>

export const Default: Story = { args: defaultBoardProps }
export const Empty: Story = { args: { ...defaultBoardProps, items: [] } }
export const WithHighlight: Story = { args: { ...defaultBoardProps, highlightedItems: new Set([mockItems[0].id]) } }
