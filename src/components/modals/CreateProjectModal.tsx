import React, { useState } from 'react'
import { Modal } from './Modal'
import { TextInput } from '../ui/TextInput'
import { ColorPicker } from '../ui/ColorPicker'
import { Button } from '../ui/Button'
import { useApp } from '../../context/AppContext'
import { PROJECT_COLORS } from '../../constants'

interface CreateProjectModalProps {
  onClose: () => void
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const { createProject } = useApp()
  const [name, setName] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createProject(name.trim(), color)
    onClose()
  }

  return (
    <Modal title="New Project" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextInput
          id="project-name"
          label="Project name"
          placeholder="e.g. Website Redesign"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={50}
          required
          autoFocus
        />
        <ColorPicker label="Color" value={color} onChange={setColor} />
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()}>Create Project</Button>
        </div>
      </form>
    </Modal>
  )
}
