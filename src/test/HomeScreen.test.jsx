import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeScreen from '../components/HomeScreen'

const recentBoards = [
  { slug: 'abc123', name: 'Sprint 42', visitedAt: Date.now() - 60000 },
  { slug: 'xyz789', name: 'Sprint 41', visitedAt: Date.now() - 86400000 },
]

describe('HomeScreen', () => {
  it('renders the form', () => {
    render(<HomeScreen onCreate={vi.fn()} />)
    expect(screen.getByPlaceholderText(/name your board/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create board/i })).toBeInTheDocument()
  })

  it('disables the button when input is empty', () => {
    render(<HomeScreen onCreate={vi.fn()} />)
    expect(screen.getByRole('button', { name: /create board/i })).toBeDisabled()
  })

  it('enables the button when input has text', async () => {
    render(<HomeScreen onCreate={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText(/name your board/i), 'Sprint 42')
    expect(screen.getByRole('button', { name: /create board/i })).toBeEnabled()
  })

  it('calls onCreate with trimmed name on submit', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    render(<HomeScreen onCreate={onCreate} />)
    await userEvent.type(screen.getByPlaceholderText(/name your board/i), '  Sprint 42  ')
    await userEvent.click(screen.getByRole('button', { name: /create board/i }))
    expect(onCreate).toHaveBeenCalledWith('Sprint 42')
  })

  it('does not call onCreate when input is only whitespace', async () => {
    const onCreate = vi.fn()
    render(<HomeScreen onCreate={onCreate} />)
    await userEvent.type(screen.getByPlaceholderText(/name your board/i), '   ')
    await userEvent.click(screen.getByRole('button', { name: /create board/i }))
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('shows loading state while creating', async () => {
    let resolve
    const onCreate = vi.fn(() => new Promise(r => { resolve = r }))
    render(<HomeScreen onCreate={onCreate} />)
    await userEvent.type(screen.getByPlaceholderText(/name your board/i), 'Sprint 42')
    await userEvent.click(screen.getByRole('button', { name: /create board/i }))
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
    await act(async () => resolve())
  })

  it('does not show recent boards section when list is empty', () => {
    render(<HomeScreen onCreate={vi.fn()} recentBoards={[]} />)
    expect(screen.queryByText(/recent boards/i)).not.toBeInTheDocument()
  })

  it('shows recent boards when provided', () => {
    render(<HomeScreen onCreate={vi.fn()} recentBoards={recentBoards} onOpenBoard={vi.fn()} />)
    expect(screen.getByText('Recent boards')).toBeInTheDocument()
    expect(screen.getByText('Sprint 42')).toBeInTheDocument()
    expect(screen.getByText('Sprint 41')).toBeInTheDocument()
  })

  it('calls onOpenBoard with the slug when a recent board is clicked', async () => {
    const onOpenBoard = vi.fn()
    render(<HomeScreen onCreate={vi.fn()} recentBoards={recentBoards} onOpenBoard={onOpenBoard} />)
    await userEvent.click(screen.getByText('Sprint 42'))
    expect(onOpenBoard).toHaveBeenCalledWith('abc123')
  })

  it('shows relative time for recent boards', () => {
    render(<HomeScreen onCreate={vi.fn()} recentBoards={recentBoards} onOpenBoard={vi.fn()} />)
    expect(screen.getByText('1m ago')).toBeInTheDocument()
    expect(screen.getByText('1d ago')).toBeInTheDocument()
  })
})
