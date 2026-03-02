import type { Meta, StoryObj } from '@storybook/react'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../../theme'
import InsightCard from './InsightCard'
import { baseInsight } from './InsightCard.mockdata'

const noop = () => {}

const meta: Meta<typeof InsightCard> = {
  title: 'Components/InsightCard',
  component: InsightCard,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <div style={{ maxWidth: 480, padding: 16 }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof InsightCard>

export const Default: Story = {
  args: { insight: baseInsight, onDismiss: noop, onAction: noop },
}
export const HighSeverity: Story = {
  args: { insight: { ...baseInsight, severity: 'high', title: 'Deadline at risk', type: 'deadline_risk' }, onDismiss: noop, onAction: noop },
}
export const Duplicate: Story = {
  args: { insight: { ...baseInsight, type: 'duplicate', title: 'Possible duplicate tasks' }, onDismiss: noop, onAction: noop },
}
