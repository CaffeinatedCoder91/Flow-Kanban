import { ProposedTask } from '@/types'

export interface TaskPreviewProps {
  task: ProposedTask
  onChange: (updated: ProposedTask) => void
  onRemove: () => void
}
