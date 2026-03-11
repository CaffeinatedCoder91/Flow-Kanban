import React from 'react'
import { Insight } from '@/types'
import { InsightCardProps } from './InsightCard.types'
import { Card, Icon, Content, Title, Description, ActionBtn, DismissBtn } from './InsightCard.styles'

const TYPE_ICONS: Record<Insight['type'], string> = {
  stale:              '⚠️',
  bottleneck:         '🚧',
  duplicate:          '🔄',
  priority_inflation: '⚡',
  deadline_cluster:   '📅',
  deadline_risk:      '⏰',
}

export const InsightCard = ({ insight, onDismiss, onAction }: InsightCardProps): React.ReactElement => {
  const actionLabel =
    insight.type === 'duplicate'     ? 'Ask AI'   :
    insight.type === 'deadline_risk' ? 'Resolve'   :
    'View tasks'

  return (
    <Card severity={insight.severity} data-severity={insight.severity}>
      <Icon>{TYPE_ICONS[insight.type]}</Icon>
      <Content>
        <Title>{insight.title}</Title>
        <Description>{insight.description}</Description>
        <ActionBtn onClick={() => onAction(insight)}>{actionLabel}</ActionBtn>
      </Content>
      <DismissBtn onClick={onDismiss} aria-label="Dismiss insight">&times;</DismissBtn>
    </Card>
  )
}
