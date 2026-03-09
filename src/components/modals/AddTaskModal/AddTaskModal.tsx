import React, { useState, useEffect, useRef } from 'react'
import type { AddTaskModalProps } from './AddTaskModal.types'
import {
  Overlay, Container, Header, CloseBtn, Body,
  Field, FieldLabel, TextInput, Textarea, Select,
  Footer, CancelBtn, SubmitBtn,
} from './AddTaskModal.styles'

export const AddTaskModal = ({ initialTitle = '', onClose, onAdd }: AddTaskModalProps): React.ReactElement => {
  const [title, setTitle]             = useState(initialTitle)
  const [description, setDescription] = useState('')
  const [priority, setPriority]       = useState('medium')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
    titleRef.current?.select()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim(), description.trim() || null, priority)
    onClose()
  }

  return (
    <Overlay role="dialog" aria-modal="true" aria-label="Add task" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <Container>
        <Header>
          <h2>Add your first task</h2>
          <CloseBtn onClick={onClose} aria-label="Close">×</CloseBtn>
        </Header>

        <form onSubmit={handleSubmit}>
          <Body>
            <Field>
              <FieldLabel htmlFor="atm-title">Task title</FieldLabel>
              <TextInput
                ref={titleRef}
                id="atm-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="atm-description">Description <span style={{ fontWeight: 400, color: 'inherit', opacity: 0.5 }}>(optional)</span></FieldLabel>
              <Textarea
                id="atm-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add any relevant details..."
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="atm-priority">Priority</FieldLabel>
              <Select
                id="atm-priority"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </Field>
          </Body>

          <Footer>
            <CancelBtn type="button" onClick={onClose}>Cancel</CancelBtn>
            <SubmitBtn type="submit" disabled={!title.trim()}>Create task</SubmitBtn>
          </Footer>
        </form>
      </Container>
    </Overlay>
  )
}
