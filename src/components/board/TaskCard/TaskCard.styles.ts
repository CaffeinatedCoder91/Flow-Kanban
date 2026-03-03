import styled from '@emotion/styled'
import { DueDateUrgency } from './TaskCard.types'

export const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: ${p => p.theme.colors.textTertiary};
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover { color: #dc3545; }
`


export const Card = styled.div<{
  accentColor: string
  isDragging?: boolean
  isDragOverlay?: boolean
  highlighted?: boolean
}>`
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-left: 3px solid ${p => p.accentColor};
  border-radius: ${p => p.theme.borderRadius.lg};
  padding: ${p => p.theme.spacing[3]};
  cursor: ${p => (p.isDragOverlay ? 'grabbing' : 'grab')};
  touch-action: none;
  transition: box-shadow 0.15s, transform 0.15s;
  opacity: ${p => (p.isDragging ? 0.3 : 1)};

  ${p => p.isDragOverlay && `box-shadow: ${p.theme.shadows.lg};`}

  ${p => !p.isDragging && !p.isDragOverlay && `
    &:hover {
      box-shadow: ${p.theme.shadows.md};
      transform: translateY(-1px) scale(1.015);
    }
    &:hover ${DeleteBtn} { opacity: 1; }
  `}

  ${p => p.highlighted && `
    box-shadow: 0 0 0 2px ${p.theme.colors.primary}, 0 4px 12px rgba(139,92,246,0.25);
    animation: highlight-pulse 1.5s ease-in-out 2;

    @keyframes highlight-pulse {
      0%, 100% { box-shadow: 0 0 0 2px ${p.theme.colors.primary}, 0 4px 12px rgba(139,92,246,0.25); }
      50%       { box-shadow: 0 0 0 4px ${p.theme.colors.primary}, 0 4px 20px rgba(139,92,246,0.4); }
    }
  `}
`

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${p => p.theme.spacing[2]};
`

export const CardHeaderLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${p => p.theme.spacing[2]};
  flex: 1;
`

export const ColorTag = styled.div`
  position: relative;
`

export const ColorCircle = styled.button`
  width: 16px;
  height: 16px;
  border-radius: ${p => p.theme.borderRadius.full};
  border: 1px solid rgba(0,0,0,0.1);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  margin-top: 2px;

  &:hover { border-color: rgba(0,0,0,0.2); }
`

export const ColorPicker = styled.div`
  position: absolute;
  top: 24px;
  left: 0;
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.lg};
  padding: ${p => p.theme.spacing[2]};
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 100;
`

export const ColorPickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
  margin-bottom: ${p => p.theme.spacing[2]};
`

export const ColorOption = styled.button`
  width: 28px;
  height: 28px;
  border-radius: ${p => p.theme.borderRadius.full};
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: border-color 0.15s;

  &:hover { border-color: rgba(0,0,0,0.3); }
`

export const ColorClear = styled.button`
  width: 100%;
  padding: 0.3rem 0.5rem;
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.sm};
  background: ${p => p.theme.colors.surface};
  color: ${p => p.theme.colors.textSecondary};
  font-size: ${p => p.theme.typography.fontSize.xs};
  cursor: pointer;
  font-family: inherit;

  &:hover { background: #f3f4f6; }
`

export const DoneCheck = styled.svg`
  @keyframes check-pop {
    0%   { opacity: 0; transform: scale(0.4); }
    60%  { opacity: 1; transform: scale(1.25); }
    100% { opacity: 1; transform: scale(1); }
  }
  animation: check-pop 0.18s ease forwards;
  color: ${p => p.theme.colors.success};
  flex-shrink: 0;
  display: flex;
  align-items: center;
`

export const CardText = styled.span<{ done?: boolean }>`
  flex: 1;
  word-break: break-word;
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => (p.done ? '#9499ab' : p.theme.colors.text)};
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  text-decoration: ${p => (p.done ? 'line-through' : 'none')};
  transition: color 0.15s;
`

export const Description = styled.div<{ empty?: boolean }>`
  font-size: 0.8rem;
  color: ${p => (p.empty ? p.theme.colors.textTertiary : p.theme.colors.text)};
  font-style: ${p => (p.empty ? 'italic' : 'normal')};
  line-height: 1.4;
  margin-top: 0.25rem;
  cursor: pointer;
  word-break: break-word;
`

export const DescriptionEdit = styled.textarea`
  font-size: 0.8rem;
  color: ${p => p.theme.colors.text};
  line-height: 1.4;
  margin-top: 0.25rem;
  width: 100%;
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.sm};
  padding: 0.35rem 0.5rem;
  font-family: inherit;
  resize: vertical;
  outline: none;
  box-sizing: border-box;

  &:focus { border-color: ${p => p.theme.colors.secondary}; }
`

export const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${p => p.theme.spacing[2]};
  gap: ${p => p.theme.spacing[2]};
`

export const DueDateWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
`

export const DueDateLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: ${p => p.theme.typography.fontSize.xs};
  color: ${p => p.theme.colors.textSecondary};
  cursor: pointer;
  position: relative;

  svg { flex-shrink: 0; color: ${p => p.theme.colors.textSecondary}; z-index: 1; }
`

export const DueDateText = styled.span<{ urgency?: DueDateUrgency | 'empty' }>`
  z-index: 1;
  pointer-events: none;
  color: ${p => {
    if (!p.urgency || p.urgency === 'empty') return p.theme.colors.textTertiary
    return p.theme.dueDateUrgency[p.urgency] ?? p.theme.colors.textSecondary
  }};
  font-style: ${p => p.urgency === 'empty' ? 'italic' : 'normal'};
  font-weight: ${p =>
    p.urgency === 'overdue' || p.urgency === 'today' ? p.theme.typography.fontWeight.semibold :
    p.urgency === 'tomorrow' ? p.theme.typography.fontWeight.medium : 'inherit'
  };
`

export const DueDateInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  cursor: pointer;

  &::-webkit-calendar-picker-indicator {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    cursor: pointer;
  }
`

export const NegotiateBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  color: #c4b5fd;
  line-height: 1;
  border-radius: 3px;
  position: relative;
  flex-shrink: 0;
  transition: color 0.15s;

  &:hover { color: ${p => p.theme.colors.primary}; }

  &::after {
    content: 'Click to negotiate';
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    color: #f8fafc;
    font-size: 0.68rem;
    white-space: nowrap;
    padding: 4px 8px;
    border-radius: ${p => p.theme.borderRadius.sm};
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 50;
  }
  &:hover::after { opacity: 1; }
`

export const AssigneeDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: ${p => p.theme.typography.fontSize.xs};
  color: ${p => p.theme.colors.textSecondary};
  cursor: pointer;

  svg { flex-shrink: 0; color: ${p => p.theme.colors.textSecondary}; }
`

export const AssigneeText = styled.span<{ empty?: boolean }>`
  color: ${p => (p.empty ? p.theme.colors.textTertiary : 'inherit')};
  font-style: ${p => (p.empty ? 'italic' : 'normal')};
`

export const AssigneeInput = styled.input`
  font-size: ${p => p.theme.typography.fontSize.xs};
  color: ${p => p.theme.colors.textSecondary};
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.sm};
  padding: 0.2rem 0.4rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  min-width: 100px;

  &:focus { border-color: ${p => p.theme.colors.secondary}; }
`

export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${p => p.theme.spacing[2]};
  gap: ${p => p.theme.spacing[2]};
`

export const PrioritySelect = styled.select<{ priority: string }>`
  font-size: 0.75rem;
  padding: 0.28rem 0.55rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  font-family: inherit;
  outline: none;
  background: ${p => p.theme.priority[p.priority]?.bg ?? '#e5e7eb'};
  color: ${p => p.theme.priority[p.priority]?.text ?? p.theme.colors.textSecondary};
`

export const StatusSelect = styled.select`
  font-size: 0.75rem;
  padding: 0.28rem 0.55rem;
  border: none;
  border-radius: 12px;
  background: ${p => p.theme.colors.primaryLight};
  color: ${p => p.theme.colors.primary};
  cursor: pointer;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  font-family: inherit;
  outline: none;

  &:hover { background: #e4deff; }
`
