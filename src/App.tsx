import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { STATUS_CONFIG, Item } from '@/types'
import {
  ModalOverlay, ModalContainer, ModalHeader, ModalClose, ModalBody, ModalHint,
  ModalTextarea, ExtractError, SpinnerRow, Spinner, SpinnerLabel, ModalFooter,
  FileBtnLabel, FileHint, FileSource, PreviewCount, PreviewList, Toast, ToastRetryBtn,
  ColumnDot, SkeletonLineVar, NoMarginSpinner, HiddenFileInput,
  AvatarWrapper, UserAvatar, AvatarMenu, AvatarMenuUser, AvatarMenuDivider, AvatarMenuBtn,
} from '@/App.styles'
import { Button } from '@/components/ui/Button'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { InsightCard } from '@/components/panels/InsightCard'
import { SpotlightCard } from '@/components/panels/SpotlightCard'
import { AssistantPanel } from '@/components/panels/AssistantPanel'
import { TaskPreview } from '@/components/modals/TaskPreview'
import { SummaryView } from '@/components/panels/SummaryView'
import { NarrativeWidget } from '@/components/panels/NarrativeWidget'
import { DeadlineNegotiationModal } from '@/components/modals/DeadlineNegotiationModal'
import { WelcomeModal } from '@/components/modals/WelcomeModal'
import { HelpModal } from '@/components/modals/HelpModal'
import { AddTaskModal } from '@/components/modals/AddTaskModal'
import { OnboardingChecklist } from '@/components/panels/OnboardingChecklist'
import { Confetti } from '@/components/ui/Confetti'
import { NotFound } from '@/pages/NotFound'
import { NavbarLogo } from '@/components/ui/Logo/NavbarLogo'

import { useToasts } from '@/hooks/useToasts'
import { useBoardItems } from '@/hooks/useBoardItems'
import { useImportTasks } from '@/hooks/useImportTasks'
import { useInsights } from '@/hooks/useInsights'
import { useOnboarding } from '@/hooks/useOnboarding'

function App() {
  const { user, signOut } = useAuth()
  const { mode, setMode } = useTheme()
  const toggleTheme = () => setMode(mode === 'dark' ? 'light' : 'dark')

  const userInitials = (() => {
    const name = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ''
    if (name) {
      const parts = name.trim().split(/\s+/)
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase()
    }
    return (user?.email ?? '?').slice(0, 2).toUpperCase()
  })()

  // --- View & UI state ---
  const [view, setView] = useState<'board' | 'summary' | 'help'>('board')
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [prefillMessage, setPrefillMessage] = useState('')
  const [proactiveMessages, setProactiveMessages] = useState<string[]>([])
  const [negotiationItem, setNegotiationItem] = useState<Item | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showAvatarMenu) return
    const onOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setShowAvatarMenu(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [showAvatarMenu])

  // --- Hooks ---
  const toasts = useToasts()

  const board = useBoardItems({ showError: toasts.showError })

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

  // --- Handlers ---
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
      <div className="toolbar">
        <div className="toolbar-left">
          <NavbarLogo onClick={() => setView('board')} />
        </div>
        <form className="toolbar-center" onSubmit={board.addItem}>
          <svg className="toolbar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={board.inputRef}
            type="text"
            value={board.text}
            onChange={e => board.setText(e.target.value)}
            placeholder="Add a new task..."
            data-testid="todo-input"
          />
          <button type="submit">Add</button>
        </form>
        <div className="toolbar-right">
          <button className="ai-btn" onClick={importTasks.openImportModal} aria-label="Import Tasks" data-tooltip="Paste emails or meeting notes" data-tooltip-pos="below">
            <span>📋</span>
            <span className="ai-btn-label">Import Tasks</span>
          </button>
          <button className="ai-btn" onClick={() => { setIsAssistantOpen(!isAssistantOpen); onboarding.markTriedAI() }} aria-label="AI Assistant" data-tooltip="Ask AI to manage your tasks" data-tooltip-pos="below">
            <span className="ai-sparkle">✨</span>
            <span className="ai-btn-label">AI Assistant</span>
          </button>
          <button
            className={`view-btn${view === 'board' ? ' active' : ''}`}
            aria-label="Kanban view"
            onClick={() => setView('board')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="10" rx="1" />
            </svg>
          </button>
          <button
            className={`view-btn${view === 'summary' ? ' active' : ''}`}
            aria-label="Summary view"
            onClick={() => setView('summary')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </button>
          <button
            className={`view-btn help-btn${view === 'help' ? ' active' : ''}`}
            aria-label="Help"
            onClick={() => setView(view === 'help' ? 'board' : 'help')}
            data-tooltip="Help & shortcuts"
            data-tooltip-pos="below"
          >
            ?
          </button>
          <button
            className="view-btn"
            onClick={toggleTheme}
            aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            data-tooltip={mode === 'dark' ? 'Switch to light' : 'Switch to dark'}
            data-tooltip-pos="below"
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>
          <AvatarWrapper ref={avatarRef}>
            <UserAvatar
              onClick={() => setShowAvatarMenu(v => !v)}
              aria-label="Account menu"
              aria-expanded={showAvatarMenu}
            >
              {userInitials}
            </UserAvatar>
            {showAvatarMenu && (
              <AvatarMenu>
                <AvatarMenuUser>
                  <strong>{user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? 'User'}</strong>
                  <span>{user?.email}</span>
                </AvatarMenuUser>
                <AvatarMenuDivider />
                <AvatarMenuBtn
                  onClick={() => { setShowAvatarMenu(false); handleSignOut() }}
                  disabled={isSigningOut}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </AvatarMenuBtn>
              </AvatarMenu>
            )}
          </AvatarWrapper>
        </div>
      </div>
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
        <SummaryView />
      ) : view !== 'board' ? (
        <NotFound onBack={() => setView('board')} />
      ) : (
        <>
          <NarrativeWidget onViewFullReport={() => setView('summary')} hasItems={board.items.length > 0} />
          {((!insights.recommendationDismissed && insights.recommendation) || insights.visibleInsights.length > 0 || toasts.refreshMessage || insights.insightsError || insights.isAllClear) && (
            <div className="insights-bar">
              {insights.isAllClear && (
                <div className="insights-clear">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  All clear — no issues detected
                  <button className="insights-clear-dismiss" onClick={() => insights.setAllClearDismissed(true)} aria-label="Dismiss">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
              {insights.insightsError && (
                <div className="insights-error-card">
                  <span>Couldn't load insights</span>
                  <button onClick={() => insights.fetchInsightsNow(false)}>Try again</button>
                </div>
              )}
              {!insights.recommendationDismissed && insights.recommendation && (
                <SpotlightCard
                  recommendation={insights.recommendation}
                  item={board.items.find(t => t.id === insights.recommendation!.recommendedItemId)}
                  onDismiss={() => insights.setRecommendationDismissed(true)}
                  onStartWorking={insights.handleStartWorking}
                />
              )}
              {insights.visibleInsights.map((insight, i) => (
                <InsightCard key={i} insight={insight} onDismiss={() => insights.dismissInsight(insight)} onAction={insights.handleInsightAction} />
              ))}
              {toasts.refreshMessage && (
                <div className="insights-empty-message">{toasts.refreshMessage}</div>
              )}
              <button className="insights-refresh" onClick={() => insights.fetchInsightsNow(true)} aria-label="Refresh insights" data-tooltip="Proactive suggestions from AI" disabled={insights.isInsightsLoading}>
                {insights.isInsightsLoading
                  ? <NoMarginSpinner className="modal-spinner modal-spinner-inline" />
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                }
                {insights.isInsightsLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          )}
          {!board.hasFetchedBoard && !board.isBoardLoading ? (
            <div className="kanban-board" />
          ) : board.isBoardLoading ? (
            <div className="kanban-board">
              {STATUS_CONFIG.map(col => (
                <div key={col.key} className="kanban-column">
                  <div className="column-header">
                    <ColumnDot className="column-dot" accentColor={col.color} />
                    <span className="column-label">{col.label}</span>
                    <span className="skeleton skeleton-count" />
                  </div>
                  <div className="column-body">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="skeleton-card">
                        <SkeletonLineVar className="skeleton skeleton-line" $width={`${72 - i * 10}%`} />
                        <SkeletonLineVar className="skeleton skeleton-line skeleton-line-sm" $width="48%" />
                        <SkeletonLineVar className="skeleton skeleton-line skeleton-line-xs" $width="60%" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : board.boardLoadError ? (
            <div className="board-error-state">
              <p>Couldn't load your tasks — check your connection.</p>
              <button onClick={board.init}>Try again</button>
            </div>
          ) : board.items.length === 0 ? (
            <div className="empty-board-state">
              <svg className="empty-board-illustration" viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="18" width="54" height="96" rx="7" fill="#f5f3ff" stroke="#e4e0f9" strokeWidth="1.5"/>
                <rect x="16" y="26" width="38" height="7" rx="3.5" fill="#c4b5fd" opacity="0.7"/>
                <rect x="16" y="40" width="38" height="24" rx="5" fill="white" stroke="#ddd6fe" strokeWidth="1.5" strokeDasharray="4 3"/>
                <rect x="16" y="70" width="38" height="24" rx="5" fill="white" stroke="#ddd6fe" strokeWidth="1.5" strokeDasharray="4 3"/>
                <rect x="73" y="18" width="54" height="96" rx="7" fill="#f8f9fc" stroke="#e6e9ef" strokeWidth="1.5"/>
                <rect x="81" y="26" width="38" height="7" rx="3.5" fill="#d1d5e0" opacity="0.7"/>
                <rect x="81" y="40" width="38" height="24" rx="5" fill="white" stroke="#e6e9ef" strokeWidth="1.5" strokeDasharray="4 3"/>
                <rect x="138" y="18" width="54" height="96" rx="7" fill="#f8f9fc" stroke="#e6e9ef" strokeWidth="1.5"/>
                <rect x="146" y="26" width="38" height="7" rx="3.5" fill="#d1d5e0" opacity="0.7"/>
                <rect x="146" y="40" width="38" height="24" rx="5" fill="white" stroke="#e6e9ef" strokeWidth="1.5" strokeDasharray="4 3"/>
                <circle cx="35" cy="52" r="9" fill="#8B5CF6"/>
                <line x1="35" y1="47" x2="35" y2="57" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="30" y1="52" x2="40" y2="52" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <h3>Your board is empty</h3>
              <p>Add your first task above, or import from email, notes, or a doc.</p>
              <div className="empty-board-actions">
                <button className="empty-action-btn empty-action-primary" onClick={() => board.inputRef.current?.focus()}>
                  Add a task
                </button>
                <button className="empty-action-btn empty-action-secondary" onClick={importTasks.openImportModal}>
                  Import tasks
                </button>
              </div>
            </div>
          ) : (
            <KanbanBoard
              items={board.items}
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
            />
          )}
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
      {onboarding.showConfetti && <Confetti onDone={() => onboarding.setShowConfetti(false)} />}
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
        <DeadlineNegotiationModal
          item={negotiationItem}
          onClose={() => setNegotiationItem(null)}
          onDone={handleNegotiationDone}
        />
      )}
      {importTasks.isImportOpen && (
        <ModalOverlay onClick={() => { if (!importTasks.isExtracting && !importTasks.isConfirming) importTasks.closeImportModal() }}>
          <ModalContainer wide={importTasks.extractedTasks.length > 0} onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <h2>📋 Import Tasks</h2>
              <ModalClose onClick={importTasks.closeImportModal} aria-label="Close" disabled={importTasks.isExtracting || importTasks.isConfirming}>&times;</ModalClose>
            </ModalHeader>

            {importTasks.extractedTasks.length === 0 ? (
              <>
                <ModalBody>
                  <ModalHint>Paste your tasks below, or upload a file.</ModalHint>
                  <ModalTextarea
                    placeholder={'e.g.\n- Fix login bug\n- Update homepage banner\n- Write release notes'}
                    value={importTasks.importText}
                    onChange={e => { importTasks.setImportText(e.target.value); importTasks.setExtractError(null) }}
                    autoFocus
                    disabled={importTasks.isExtracting}
                  />
                  {importTasks.extractError && <ExtractError>{importTasks.extractError}</ExtractError>}
                  {importTasks.isExtracting && (
                    <SpinnerRow>
                      <Spinner />
                      <SpinnerLabel>Analysing...</SpinnerLabel>
                    </SpinnerRow>
                  )}
                </ModalBody>
                <ModalFooter>
                  <FileBtnLabel aria-label="Upload file">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload file
                    <HiddenFileInput type="file" accept=".txt,.pdf,.docx" onChange={importTasks.handleFileUpload} disabled={importTasks.isExtracting} />
                  </FileBtnLabel>
                  <FileHint>.txt · .pdf · .docx · max 5MB</FileHint>
                  <Button variant="secondary" onClick={importTasks.closeImportModal} disabled={importTasks.isExtracting}>Cancel</Button>
                  <Button variant="primary" onClick={importTasks.handleExtractTasks} disabled={!importTasks.importText.trim() || importTasks.isExtracting} loading={importTasks.isExtracting}>
                    {importTasks.isExtracting ? 'Analysing...' : 'Process'}
                  </Button>
                </ModalFooter>
              </>
            ) : (
              <>
                <ModalBody preview>
                  {importTasks.importFileName && (
                    <FileSource>📄 Tasks from: <strong>{importTasks.importFileName}</strong></FileSource>
                  )}
                  <PreviewCount>
                    {importTasks.extractedTasks.length} task{importTasks.extractedTasks.length !== 1 ? 's' : ''} found — edit or remove before adding
                  </PreviewCount>
                  <PreviewList>
                    {importTasks.extractedTasks.map((task, i) => (
                      <TaskPreview
                        key={i}
                        task={task}
                        onChange={updated => importTasks.setExtractedTasks(prev => prev.map((t, j) => j === i ? updated : t))}
                        onRemove={() => importTasks.setExtractedTasks(prev => prev.filter((_, j) => j !== i))}
                      />
                    ))}
                  </PreviewList>
                  {importTasks.extractError && <ExtractError>{importTasks.extractError}</ExtractError>}
                </ModalBody>
                <ModalFooter>
                  <Button variant="secondary" onClick={() => { importTasks.setExtractedTasks([]); importTasks.setExtractError(null) }} disabled={importTasks.isConfirming}>Back</Button>
                  <Button variant="primary" onClick={importTasks.handleConfirmAll} disabled={importTasks.isConfirming || importTasks.extractedTasks.length === 0} loading={importTasks.isConfirming}>
                    {importTasks.isConfirming ? 'Adding...' : `Confirm All (${importTasks.extractedTasks.length})`}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContainer>
        </ModalOverlay>
      )}
    </div>
  )
}

export default App
