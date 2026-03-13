import React, { useState, useMemo, Suspense } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Item } from '@/types'
import { Toast, ToastRetryBtn } from '@/App.styles'
import { Navbar } from '@/components/layout/Navbar'
import { InsightsBar } from '@/components/panels/InsightsBar'
import { BoardView } from '@/components/board/BoardView'
import { AssistantPanel } from '@/components/panels/AssistantPanel'
import { ImportModal } from '@/components/modals/ImportModal'
const SummaryView = React.lazy(() =>
  import('@/components/panels/SummaryView').then(m => ({ default: m.SummaryView }))
)
import { NarrativeWidget } from '@/components/panels/NarrativeWidget'
const DeadlineNegotiationModal = React.lazy(() =>
  import('@/components/modals/DeadlineNegotiationModal').then(m => ({ default: m.DeadlineNegotiationModal }))
)
import { WelcomeModal } from '@/components/modals/WelcomeModal'
import { HelpModal } from '@/components/modals/HelpModal'
import { AddTaskModal } from '@/components/modals/AddTaskModal'
import { OnboardingChecklist } from '@/components/panels/OnboardingChecklist'
const Confetti = React.lazy(() =>
  import('@/components/ui/Confetti').then(m => ({ default: m.Confetti }))
)
import { NotFound } from '@/pages/NotFound'

import { useToasts } from '@/hooks/useToasts'
import { useBoardItems } from '@/hooks/useBoardItems'
import { useImportTasks } from '@/hooks/useImportTasks'
import { useInsights } from '@/hooks/useInsights'
import { useOnboarding } from '@/hooks/useOnboarding'

function App() {
  const { user, signOut } = useAuth()
  const { mode, setMode } = useTheme()
  const toggleTheme = () => setMode(mode === 'dark' ? 'light' : 'dark')

  const [view, setView] = useState<'board' | 'summary' | 'help'>('board')
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [prefillMessage, setPrefillMessage] = useState('')
  const [proactiveMessages, setProactiveMessages] = useState<string[]>([])
  const [negotiationItem, setNegotiationItem] = useState<Item | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const toasts = useToasts()
  const isDemo = typeof window !== 'undefined' && localStorage.getItem('flow-demo-session') === '1'
  const userInitials = useMemo(() => {
    const name = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ''
    if (name) {
      const parts = name.trim().split(/\s+/)
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase()
    }
    const emailInitials = (user?.email ?? '').slice(0, 2).toUpperCase()
    if (emailInitials) return emailInitials
    return isDemo ? 'DE' : 'ME'
  }, [user, isDemo])
  const board = useBoardItems({ showError: toasts.showError, isDemo })
  const onboarding = useOnboarding({ items: board.items })
  const importTasks = useImportTasks({
    setItems: board.setItems,
    showImportSuccess: toasts.showImportSuccess,
    onImported: onboarding.markImportedTasks,
  })
  const insights = useInsights({
    items: board.items,
    showRefreshMessage: toasts.showRefreshMessage,
    clearRefreshMessage: toasts.clearRefreshMessage,
    refreshMessage: toasts.refreshMessage,
    setIsAssistantOpen,
    setPrefillMessage,
    setProactiveMessages,
    setNegotiationItem,
    updateItemStatus: board.updateItemStatus,
  })

  const handleSignOut = async () => {
    if (isSigningOut) return
    setIsSigningOut(true)
    await signOut()
  }

  const handleNegotiationDone = (message: string) => {
    board.fetchItems()
    if (negotiationItem) {
      insights.setInsights(prev => prev.filter(ins => !ins.items.includes(negotiationItem.id)))
    }
    toasts.showToast(message)
  }

  return (
    <div className="app">
      <Navbar
        view={view}
        onSetView={setView}
        text={board.text}
        onTextChange={board.setText}
        inputRef={board.inputRef}
        onAddItem={board.addItem}
        onOpenImport={importTasks.openImportModal}
        isAssistantOpen={isAssistantOpen}
        onToggleAssistant={() => { setIsAssistantOpen(!isAssistantOpen); onboarding.markTriedAI() }}
        mode={mode}
        onToggleTheme={toggleTheme}
        userInitials={userInitials}
        user={user}
        isSigningOut={isSigningOut}
        onSignOut={handleSignOut}
      />

      {board.sampleIds.length > 0 && (
        <div className="sample-banner">
          <span>This is sample data to help you explore.</span>
          <button onClick={board.handleClearSample} disabled={board.isClearingSample}>
            {board.isClearingSample ? 'Clearing…' : 'Clear and start fresh →'}
          </button>
        </div>
      )}

      {view === 'help' ? (
        <HelpModal onClose={() => setView('board')} />
      ) : view === 'summary' ? (
        <Suspense fallback={null}><SummaryView /></Suspense>
      ) : view !== 'board' ? (
        <NotFound onBack={() => setView('board')} />
      ) : (
        <>
          <NarrativeWidget onViewFullReport={() => setView('summary')} hasItems={board.items.length > 0} />
          <InsightsBar
            isAllClear={insights.isAllClear}
            onDismissAllClear={() => insights.setAllClearDismissed(true)}
            insightsError={insights.insightsError}
            onRetryInsights={() => insights.fetchInsightsNow(false)}
            recommendation={insights.recommendation}
            recommendationDismissed={insights.recommendationDismissed}
            onDismissRecommendation={() => insights.setRecommendationDismissed(true)}
            onStartWorking={insights.handleStartWorking}
            visibleInsights={insights.visibleInsights}
            onDismissInsight={insights.dismissInsight}
            onInsightAction={insights.handleInsightAction}
            isInsightsLoading={insights.isInsightsLoading}
            onRefresh={() => insights.fetchInsightsNow(true)}
            refreshMessage={toasts.refreshMessage}
            items={board.items}
          />
          <BoardView
            hasFetchedBoard={board.hasFetchedBoard}
            isBoardLoading={board.isBoardLoading}
            boardLoadError={board.boardLoadError}
            items={board.items}
            onRetry={board.init}
            highlightedItems={insights.highlightedItems}
            onAdd={board.addItemWithStatus}
            onDelete={board.removeItem}
            onUpdateStatus={board.updateItemStatus}
            onUpdatePriority={board.updateItemPriority}
            onUpdateDescription={board.updateItemDescription}
            onUpdateDueDate={board.updateItemDueDate}
            onUpdateAssignee={board.updateItemAssignee}
            onUpdateColor={board.updateItemColor}
            onNegotiate={setNegotiationItem}
            onOpenImport={importTasks.openImportModal}
            inputRef={board.inputRef}
          />
        </>
      )}

      <AssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onRefresh={board.fetchItems}
        prefillMessage={prefillMessage}
        onPrefillConsumed={() => setPrefillMessage('')}
        proactiveMessages={proactiveMessages}
        onProactiveConsumed={() => setProactiveMessages([])}
      />
      {board.isAddTaskOpen && (
        <AddTaskModal
          initialTitle={board.addTaskInitialTitle}
          onClose={() => board.setIsAddTaskOpen(false)}
          onAdd={board.handleAddTaskModalSubmit}
        />
      )}
      {onboarding.showConfetti && <Suspense fallback={null}><Confetti onDone={() => onboarding.setShowConfetti(false)} /></Suspense>}
      <OnboardingChecklist
        hasAddedTask={board.items.length > 0}
        hasTriedAI={onboarding.hasTriedAI}
        hasImportedTasks={onboarding.hasImportedTasks}
      />
      {onboarding.showWelcome && <WelcomeModal onClose={() => onboarding.setShowWelcome(false)} />}
      {toasts.importSuccessMessage && <Toast>{toasts.importSuccessMessage}</Toast>}
      {toasts.toastMessage && <Toast>{toasts.toastMessage}</Toast>}
      {toasts.errorToast && (
        <Toast error>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{toasts.errorToast.message}</span>
          {toasts.errorToast.onRetry && (
            <ToastRetryBtn onClick={() => { toasts.clearErrorToast(); toasts.errorToast!.onRetry!() }}>
              Try again
            </ToastRetryBtn>
          )}
        </Toast>
      )}
      {negotiationItem && (
        <Suspense fallback={null}>
          <DeadlineNegotiationModal
            item={negotiationItem}
            onClose={() => setNegotiationItem(null)}
            onDone={handleNegotiationDone}
          />
        </Suspense>
      )}
      {importTasks.isImportOpen && <ImportModal {...importTasks} />}
    </div>
  )
}

export default App
