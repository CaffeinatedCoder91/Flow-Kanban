import React from 'react'
import { DismissBtn } from '../InsightCard'
import { Card, Icon, Content, Label, TaskLink, Reason, StartBtn } from './SpotlightCard.styles'
import type { SpotlightCardProps } from './SpotlightCard.types'

export const SpotlightCard = ({ recommendation, item, onDismiss, onStartWorking }: SpotlightCardProps): React.ReactElement => {
  const scrollToItem = () => {
    const el = document.querySelector(`[data-item-id="${recommendation.recommendedItemId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <Card>
      <Icon>⭐</Icon>
      <Content>
        <Label>Recommended next task</Label>
        <TaskLink onClick={scrollToItem}>
          {item?.title ?? `Task #${recommendation.recommendedItemId}`}
        </TaskLink>
        <Reason>{recommendation.reason}</Reason>
        <StartBtn onClick={() => onStartWorking(recommendation.recommendedItemId)}>
          Start working
        </StartBtn>
      </Content>
      <DismissBtn onClick={onDismiss} aria-label="Dismiss">&times;</DismissBtn>
    </Card>
  )
}
