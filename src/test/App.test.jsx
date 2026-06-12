import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import App from '../App'

vi.mock('../lib/supabase', () => {
  const makeChannel = () => {
    const ch = { on: vi.fn(), subscribe: vi.fn() }
    ch.on.mockReturnValue(ch)
    ch.subscribe.mockReturnValue(ch)
    return ch
  }
  const supabase = {
    from: vi.fn(),
    channel: vi.fn(() => makeChannel()),
    removeChannel: vi.fn(),
  }
  return { supabase }
})

import { supabase } from '../lib/supabase'

const mockBoard = { id: 'board-uuid', name: 'Sprint 42', slug: 'abc123' }

function stubBoards(board, error = null) {
  const chain = { select: vi.fn(), insert: vi.fn(), eq: vi.fn(), single: vi.fn() }
  chain.select.mockReturnValue(chain)
  chain.insert.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.single.mockResolvedValue({ data: board, error })
  return chain
}

function stubEmptyTable() {
  const chain = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), insert: vi.fn() }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.order.mockResolvedValue({ data: [] })
  chain.insert.mockReturnValue(chain)
  return chain
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.hash = ''
  })

  afterEach(() => {
    window.location.hash = ''
  })

  it('shows HomeScreen when there is no board hash', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByPlaceholderText(/name your board/i)).toBeInTheDocument())
  })

  it('creates a board and uses slug in the URL hash', async () => {
    supabase.from.mockImplementation(table => {
      if (table === 'boards') return stubBoards(mockBoard)
      return stubEmptyTable()
    })

    render(<App />)
    await waitFor(() => screen.getByPlaceholderText(/name your board/i))
    await userEvent.type(screen.getByPlaceholderText(/name your board/i), 'Sprint 42')
    await userEvent.click(screen.getByRole('button', { name: /create board/i }))

    await waitFor(() => expect(screen.getByText('Sprint 42')).toBeInTheDocument())
    expect(window.location.hash).toBe('#abc123')
  })

  it('loads a board by slug from the URL hash', async () => {
    window.location.hash = '#abc123'
    supabase.from.mockImplementation(table => {
      if (table === 'boards') return stubBoards(mockBoard)
      return stubEmptyTable()
    })

    render(<App />)
    await waitFor(() => expect(screen.getByText('Sprint 42')).toBeInTheDocument())
  })

  it('loads a legacy board by UUID from the URL hash', async () => {
    window.location.hash = '#550e8400-e29b-41d4-a716-446655440000'
    supabase.from.mockImplementation(table => {
      if (table === 'boards') return stubBoards(mockBoard)
      return stubEmptyTable()
    })

    render(<App />)
    await waitFor(() => expect(screen.getByText('Sprint 42')).toBeInTheDocument())
  })

  it('blocks board creation when rate limit is exceeded', async () => {
    const now = Date.now()
    localStorage.setItem('retro-create-times', JSON.stringify([now, now, now, now, now]))
    render(<App />)
    await waitFor(() => screen.getByPlaceholderText(/name your board/i))
    await userEvent.type(screen.getByPlaceholderText(/name your board/i), 'Sprint 42')
    await userEvent.click(screen.getByRole('button', { name: /create board/i }))
    expect(await screen.findByText(/too many boards/i)).toBeInTheDocument()
    localStorage.removeItem('retro-create-times')
  })

  it('shows an error toast if board creation fails', async () => {
    supabase.from.mockImplementation(() => stubBoards(null, { message: 'DB error' }))

    render(<App />)
    await waitFor(() => screen.getByPlaceholderText(/name your board/i))
    await userEvent.type(screen.getByPlaceholderText(/name your board/i), 'Sprint 42')
    await userEvent.click(screen.getByRole('button', { name: /create board/i }))

    expect(await screen.findByText(/DB error/)).toBeInTheDocument()
  })

  it('clears the hash and shows HomeScreen if the board is not found', async () => {
    window.location.hash = '#board-missing'
    supabase.from.mockImplementation(() => stubBoards(null, { message: 'Not found' }))

    render(<App />)
    await waitFor(() => expect(screen.getByPlaceholderText(/name your board/i)).toBeInTheDocument())
    expect(window.location.hash).toBe('')
  })
})
