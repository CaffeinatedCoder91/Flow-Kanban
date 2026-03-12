import type { Meta, StoryObj } from '@storybook/react-vite'
import { SpotlightCard } from './SpotlightCard'
import { recommendation, item } from './SpotlightCard.mockdata'

const meta: Meta<typeof SpotlightCard> = {
  title: 'Components/SpotlightCard',
  component: SpotlightCard,
}
export default meta

type Story = StoryObj<typeof SpotlightCard>

export const Default: Story = {
  args: {
    recommendation,
    item,
    onDismiss: () => {},
    onStartWorking: () => {},
  },
}

export const ItemUndefined: Story = {
  args: {
    recommendation,
    item: undefined,
    onDismiss: () => {},
    onStartWorking: () => {},
  },
}
