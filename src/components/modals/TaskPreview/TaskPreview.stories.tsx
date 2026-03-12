import type { Meta, StoryObj } from '@storybook/react-vite'
import { TaskPreview } from './TaskPreview'
import { baseTask } from './TaskPreview.mockdata'

const meta: Meta<typeof TaskPreview> = {
  title: 'Components/TaskPreview',
  component: TaskPreview,
}
export default meta

type Story = StoryObj<typeof TaskPreview>

export const Default: Story = {
  args: { task: baseTask, onChange: () => {}, onRemove: () => {} },
}

export const WithLowConfidence: Story = {
  args: {
    task: {
      ...baseTask,
      confidence: { title: 55, priority: 60, due_date: 100, assignee: 100, description: 45 },
    },
    onChange: () => {},
    onRemove: () => {},
  },
}

export const WithColor: Story = {
  args: {
    task: { ...baseTask, color: '#8B5CF6', assignee: 'Alice', due_date: '2026-04-01' },
    onChange: () => {},
    onRemove: () => {},
  },
}
