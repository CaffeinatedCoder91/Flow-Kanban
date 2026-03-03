import type { Meta, StoryObj } from '@storybook/react'
import { ThemeProvider } from '@emotion/react'
import { DndContext } from '@dnd-kit/core'
import { theme } from '../../../theme'
import TaskCard from './TaskCard'
import { mockItem } from './TaskCard.mockdata'

const noop = () => {}

const meta: Meta<typeof TaskCard> = {
  title: 'Components/TaskCard',
  component: TaskCard,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <DndContext>
          <div style={{ maxWidth: 320, padding: 16 }}>
            <Story />
          </div>
        </DndContext>
      </ThemeProvider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof TaskCard>

const defaultArgs = {
  item: mockItem,
  onDelete: noop,
  onUpdateStatus: noop,
  onUpdatePriority: noop,
  onUpdateDescription: noop,
  onUpdateDueDate: noop,
  onUpdateAssignee: noop,
  onUpdateColor: noop,
}

export const Default: Story = { args: defaultArgs }
export const Highlighted: Story = { args: { ...defaultArgs, highlighted: true } }
export const Done: Story = { args: { ...defaultArgs, item: { ...mockItem, status: 'done' } } }
export const NoDescription: Story = { args: { ...defaultArgs, item: { ...mockItem, description: null } } }
