export interface AddTaskModalProps {
  initialTitle?: string
  onClose: () => void
  onAdd: (title: string, description: string | null, priority: string) => void
}
