import type { Meta, StoryObj } from '@storybook/react'
import { NarrativeWidget } from './NarrativeWidget'

const meta: Meta<typeof NarrativeWidget> = {
  title: 'Components/NarrativeWidget',
  component: NarrativeWidget,
}
export default meta

type Story = StoryObj<typeof NarrativeWidget>

export const Default: Story = {
  args: { onViewFullReport: () => {} },
}
