import type { Meta, StoryObj } from '@storybook/react'
import { ThemeProvider } from '@emotion/react'
import { DndContext } from '@dnd-kit/core'
import { theme } from '../../../theme'
import Column from './Column'
import { mockItems } from './Column.mockdata'

const noop = () => {}

const meta: Meta<typeof Column> = {
  title: 'Components/Column',
  component: Column,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <DndContext>
          <div style={{ width: 280 }}>
            <Story />
          </div>
        </DndContext>
      </ThemeProvider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof Column>

const defaultArgs = {
  statusKey: 'not_started',
  label: 'Not Started',
  color: '#8B5CF6',
  items: mockItems,
  highlightedItems: new Set<string>(),
  onAdd: () => Promise.resolve(),
  onDelete: noop,
  onUpdateStatus: noop,
  onUpdatePriority: noop,
  onUpdateDescription: noop,
  onUpdateDueDate: noop,
  onUpdateAssignee: noop,
  onUpdateColor: noop,
}

export const Default: Story = { args: defaultArgs }
export const Empty: Story = { args: { ...defaultArgs, items: [] } }
