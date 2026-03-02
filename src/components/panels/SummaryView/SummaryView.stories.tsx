import type { Meta, StoryObj } from '@storybook/react'
import SummaryView from './SummaryView'

const meta: Meta<typeof SummaryView> = {
  title: 'Components/SummaryView',
  component: SummaryView,
}
export default meta

type Story = StoryObj<typeof SummaryView>

export const Default: Story = {}
