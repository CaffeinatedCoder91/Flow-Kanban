import { useRef, useState, useEffect, FormEvent } from 'react'
import {
  AvatarWrapper, UserAvatar, AvatarMenu, AvatarMenuUser,
  AvatarMenuDivider, AvatarMenuBtn,
} from '@/App.styles'
import { NavbarLogo } from '@/components/ui/Logo/NavbarLogo'

interface NavbarUser {
  email?: string
  user_metadata?: { full_name?: string; name?: string }
}

interface NavbarProps {
  view: 'board' | 'summary' | 'help'
  onSetView: (v: 'board' | 'summary' | 'help') => void
  text: string
  onTextChange: (v: string) => void
  inputRef: React.RefObject<HTMLInputElement>
  onAddItem: (e: FormEvent) => void
  onOpenImport: () => void
  isAssistantOpen: boolean
  onToggleAssistant: () => void
  mode: 'dark' | 'light'
  onToggleTheme: () => void
  userInitials: string
  user: NavbarUser | null
  isSigningOut: boolean
  onSignOut: () => void
}

export function Navbar({
  view, onSetView,
  text, onTextChange, inputRef, onAddItem,
  onOpenImport, isAssistantOpen, onToggleAssistant,
  mode, onToggleTheme,
  userInitials, user, isSigningOut, onSignOut,
}: NavbarProps) {
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

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <NavbarLogo onClick={() => onSetView('board')} />
      </div>
      <form className="toolbar-center" onSubmit={onAddItem}>
        <svg className="toolbar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => onTextChange(e.target.value)}
          placeholder="Add a new task..."
          data-testid="todo-input"
        />
        <button type="submit">Add</button>
      </form>
      <div className="toolbar-right">
        <button className="ai-btn" onClick={onOpenImport} aria-label="Import Tasks" data-tooltip="Paste emails or meeting notes" data-tooltip-pos="below">
          <span>📋</span>
          <span className="ai-btn-label">Import Tasks</span>
        </button>
        <button className="ai-btn" onClick={onToggleAssistant} aria-label="AI Assistant" data-tooltip="Ask AI to manage your tasks" data-tooltip-pos="below">
          <span className="ai-sparkle">✨</span>
          <span className="ai-btn-label">AI Assistant</span>
        </button>
        <button
          className={`view-btn${view === 'board' ? ' active' : ''}`}
          aria-label="Kanban view"
          onClick={() => onSetView('board')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="10" rx="1" />
          </svg>
        </button>
        <button
          className={`view-btn${view === 'summary' ? ' active' : ''}`}
          aria-label="Summary view"
          onClick={() => onSetView('summary')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </button>
        <button
          className={`view-btn help-btn${view === 'help' ? ' active' : ''}`}
          aria-label="Help"
          onClick={() => onSetView(view === 'help' ? 'board' : 'help')}
          data-tooltip="Help & shortcuts"
          data-tooltip-pos="below"
        >
          ?
        </button>
        <button
          className="view-btn"
          onClick={onToggleTheme}
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
                onClick={() => { setShowAvatarMenu(false); onSignOut() }}
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
  )
}
