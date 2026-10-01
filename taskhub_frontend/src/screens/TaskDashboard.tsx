import {
  ArrowDownUp,
  ArrowRight,
  Check,
  CircleHelp,
  ClipboardList,
  LogOut,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, apiErrorMessage } from '../action/request'
import { useAuth } from '../context/useAuth'

type TaskStatus = 'todo' | 'in_progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'

interface TaskRecord {
  id?: number
  _id?: number
  title: string
  status: TaskStatus
  priority: TaskPriority
  tags: string[]
  due_date: string | null
  created_at: string
  updated_at: string
}

const filters: { label: string; value: TaskStatus | 'all' }[] = [
  { label: 'All tasks', value: 'all' },
  { label: 'To do', value: 'todo' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
]

function taskId(task: TaskRecord) {
  return task.id ?? task._id
}

function formattedDate(date: string | null) {
  if (!date) return null
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(date))
}

function isOverdue(task: TaskRecord) {
  if (!task.due_date || task.status === 'done') return false
  const dueDay = new Date(task.due_date)
  const today = new Date()
  dueDay.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return dueDay < today
}

export default function TaskDashboard() {
  const { user, signOut } = useAuth()
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const searchInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target
      const isEditing = target instanceof HTMLElement && (
        target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      )
      if (event.key === '/' && !isEditing) {
        event.preventDefault()
        searchInput.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  useEffect(() => {
    let active = true
    const loadTasks = async () => {
      try {
        const params: Record<string, string | number> = { limit: 100 }
        if (filter !== 'all') params.status = filter
        if (search.trim()) params.q = search.trim()
        const loadedTasks: TaskRecord[] = []
        let cursor: string | null = null
        do {
          if (cursor) params.cursor = cursor
          const response = await api.get<{ data: TaskRecord[]; next_cursor: string | null }>('/tasks', { params })
          loadedTasks.push(...response.data.data)
          cursor = response.data.next_cursor
        } while (cursor && active)
        if (active) {
          setTasks(loadedTasks)
          setError('')
        }
      } catch (loadError) {
        if (active) setError(apiErrorMessage(loadError, 'Tasks could not be loaded.'))
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadTasks()
    return () => {
      active = false
    }
  }, [filter, search])

  const addTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newTitle.trim()) return
    setSaving(true)
    setError('')
    try {
      const response = await api.post<TaskRecord>('/tasks', {
        title: newTitle.trim(),
        status: 'todo',
        priority: 'medium',
        tags: [],
      })
      setTasks((current) => [response.data, ...current])
      setNewTitle('')
      setComposerOpen(false)
    } catch (createError) {
      setError(apiErrorMessage(createError, 'This task could not be created.'))
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (task: TaskRecord, status: TaskStatus) => {
    const id = taskId(task)
    if (id === undefined) return
    try {
      const response = await api.patch<TaskRecord>(`/tasks/${id}`, { status })
      setTasks((current) => current.map((item) => (taskId(item) === id ? response.data : item)))
    } catch (updateError) {
      setError(apiErrorMessage(updateError, 'The task status could not be updated.'))
    }
  }

  const deleteTask = async (task: TaskRecord) => {
    const id = taskId(task)
    if (id === undefined) return
    try {
      await api.delete(`/tasks/${id}`)
      setTasks((current) => current.filter((item) => taskId(item) !== id))
    } catch (deleteError) {
      setError(apiErrorMessage(deleteError, 'This task could not be deleted.'))
    }
  }

  const counts = tasks.reduce<Record<TaskStatus, number>>(
    (total, task) => ({ ...total, [task.status]: total[task.status] + 1 }),
    { todo: 0, in_progress: 0, done: 0 },
  )
  const canDelete = user?.role === 'manager' || user?.role === 'admin'
  const canCreate = user?.role === 'user' || user?.role === 'admin'
  const boardTitle = user?.role === 'manager'
    ? 'Organization tasks'
    : user?.role === 'admin'
      ? 'All tasks'
      : 'My tasks'
  const boardEyebrow = user?.role === 'manager'
    ? 'ORGANIZATION WORKSPACE'
    : user?.role === 'admin'
      ? 'GLOBAL TASK OVERVIEW'
      : 'YOUR PERSONAL BOARD'
  const boardDescription = user?.role === 'manager'
    ? 'A shared view of work across your organization.'
    : user?.role === 'admin'
      ? 'Tasks across every organization, in one view.'
      : 'One clear next step at a time.'

  return (
    <main className="workspace-page">
      <aside className="workspace-rail">
        <a className="brand-lockup rail-brand" href="/" aria-label="TaskHub dashboard">
          <span className="brand-glyph">t</span><span>taskhub</span>
        </a>
        <div className="rail-divider" />
        <div className="rail-section-label">WORKSPACE</div>
        <a className="rail-link rail-link-active" href="/" aria-current="page">
          <ClipboardList size={18} /><span>{boardTitle}</span><span className="rail-link-count">{tasks.length}</span>
        </a>
        <div className="rail-lower">
          <div className="rail-tip">
            <span className="rail-tip-icon"><CircleHelp size={16} /></span>
            <span><strong>Keep it moving</strong><small>Small steps add up.</small></span>
          </div>
          <div className="account-row">
            <span className="avatar-mark">{user?.email.slice(0, 1).toUpperCase()}</span>
            <span className="account-copy"><strong>{user?.email.split('@')[0]}</strong><small>{user?.role}</small></span>
            <button className="icon-button signout-button" type="button" title="Sign out" aria-label="Sign out" onClick={signOut}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-header">
          <div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{boardTitle}</strong></div>
          <div className="header-date">A good day to make progress <span>✳</span></div>
        </header>

        <div className="workspace-content">
          <div className="page-title-row">
            <div>
              <p className="eyebrow">{boardEyebrow}</p>
              <h1>{boardTitle}<span className="title-period">.</span></h1>
              <p className="page-subtitle">{boardDescription}</p>
            </div>
            {canCreate && (
              <button className="primary-button add-task-button" type="button" onClick={() => setComposerOpen((open) => !open)}>
                {composerOpen ? <X size={17} /> : <Plus size={18} />}
                {composerOpen ? 'Close' : 'New task'}
              </button>
            )}
          </div>

          <div className="summary-strip" aria-label="Task totals">
            <div className="summary-total"><span className="summary-number">{tasks.length.toString().padStart(2, '0')}</span><span>visible tasks</span></div>
            <div className="summary-divider" />
            <div className="summary-item"><i className="summary-dot dot-todo" /><span>{counts.todo} to do</span></div>
            <div className="summary-item"><i className="summary-dot dot-progress" /><span>{counts.in_progress} in progress</span></div>
            <div className="summary-item"><i className="summary-dot dot-done" /><span>{counts.done} done</span></div>
            <span className="summary-spark">✳</span>
          </div>

          {composerOpen && canCreate && (
            <form className="task-composer" onSubmit={addTask}>
              <label className="sr-only" htmlFor="new-task-title">Task title</label>
              <input
                id="new-task-title"
                className="composer-input"
                autoFocus
                maxLength={200}
                placeholder="What needs to get done?"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                required
              />
              <span className="composer-hint">New tasks start in To do</span>
              <button className="primary-button composer-submit" type="submit" disabled={saving || !newTitle.trim()}>
                {saving ? 'Adding…' : <>Add task <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {error && <div className="workspace-error" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div>}

          <div className="task-toolbar">
            <div className="filter-tabs" role="tablist" aria-label="Filter tasks by status">
              {filters.map((item) => (
                <button
                  className={`filter-tab${filter === item.value ? ' filter-tab-active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.value}
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="search-control">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search task titles</span>
              <input ref={searchInput} type="search" placeholder="Find a task" value={search} onChange={(event) => setSearch(event.target.value)} />
              <kbd>/</kbd>
            </label>
          </div>

          <div className="task-list-heading">
            <span>TASK</span><span>PRIORITY</span><span>STATUS</span><span>DUE</span><span className="task-heading-actions"><ArrowDownUp size={14} /></span>
          </div>

          {loading ? (
            <div className="task-state"><span className="loading-mark" /><p>Gathering your tasks…</p></div>
          ) : tasks.length === 0 ? (
            <div className="task-empty">
              <span className="empty-mark"><Check size={20} /></span>
              <h2>{search ? 'No matching tasks' : user?.role === 'manager' ? 'No organization tasks yet.' : 'A clear board.'}</h2>
              <p>{search ? 'Try a different search, or clear the filter.' : canCreate ? 'Add the first task and give your focus somewhere to land.' : 'There are no tasks in your organization yet.'}</p>
              {!search && canCreate && <button type="button" className="text-action" onClick={() => setComposerOpen(true)}>Create your first task <ArrowRight size={15} /></button>}
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task, index) => (
                <article className={`task-row task-row-${task.status}${isOverdue(task) ? ' task-row-overdue' : ''}`} key={taskId(task)} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
                  <div className="task-title-cell">
                    <span className={`task-check task-check-${task.status}`} aria-hidden="true">{task.status === 'done' && <Check size={13} />}</span>
                    <div className="task-title-copy">
                      <h2>{task.title}</h2>
                      <div className="task-tags">
                        {(task.tags ?? []).length > 0 ? task.tags.map((tag) => <span key={tag}>{tag}</span>) : <span className="no-tags">No tags</span>}
                      </div>
                    </div>
                  </div>
                  <div className="task-priority-cell"><i className={`priority-marker priority-${task.priority}`} /><span>{task.priority}</span></div>
                  <label className="task-status-cell">
                    <span className="sr-only">Status for {task.title}</span>
                    <select className={`status-select status-${task.status}`} value={task.status} onChange={(event) => void changeStatus(task, event.target.value as TaskStatus)}>
                      {filters.slice(1).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  <div className={`task-updated-cell${isOverdue(task) ? ' task-overdue-label' : ''}`}>
                    {formattedDate(task.due_date)
                      ? <>{isOverdue(task) ? 'Overdue · ' : 'Due '}{formattedDate(task.due_date)}</>
                      : '—'}
                  </div>
                  <div className="task-action-cell">
                    {canDelete && (
                      <button className="icon-button delete-task-button" type="button" title="Delete task" aria-label={`Delete ${task.title}`} onClick={() => void deleteTask(task)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
          <footer className="list-footer"><span>Showing {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span><span>Newest activity first</span></footer>
        </div>
      </section>
    </main>
  )
}