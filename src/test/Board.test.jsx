import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import Board from '../components/Board'

const mockColumns = [
  { id: 'col-1', board_id: 'board-1', title: 'Went well', color: '#1D9E75', position: 0 },
  { id: 'col-2', board_id: 'board-1', title: 'To improve', color: '#D85A30', position: 1 },
]
const mockCards = [
  { id: 'card-1', board_id: 'board-1', column_id: 'col-1', text: 'Great sprint', votes: 1 },
  { id: 'card-2', board_id: 'board-1', column_id: 'col-2', text: 'Slow reviews', votes: 0 },
]

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

const board = { id: 'board-1', name: 'Sprint 42' }

function makeDeleteChain() {
  const chain = { delete: vi.fn(), eq: vi.fn() }
  chain.delete.mockReturnValue(chain)
  chain.eq.mockResolvedValue({ data: null })
  return chain
}

function setupDefaultMocks() {
  supabase.from.mockImplementation(table => {
    if (table === 'columns') {
      const chain = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() }
      chain.select.mockReturnValue(chain)
      chain.eq.mockReturnValue(chain)
      chain.order.mockResolvedValue({ data: mockColumns })
      chain.insert.mockReturnValue(chain)
      chain.update.mockReturnValue(chain)
      chain.delete.mockReturnValue(chain)
      return chain
    }
    if (table === 'cards') {
      const chain = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() }
      chain.select.mockReturnValue(chain)
      chain.eq.mockReturnValue(chain)
      chain.order.mockResolvedValue({ data: mockCards })
      chain.insert.mockResolvedValue({ data: null })
      chain.update.mockReturnValue(chain)
      chain.delete.mockReturnValue(chain)
      return chain
    }
  })
}

describe('Board', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaultMocks()
  })

  it('renders columns and cards after loading', async () => {
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => expect(screen.getByText('Went well')).toBeInTheDocument())
    expect(screen.getByText('To improve')).toBeInTheDocument()
    expect(screen.getByText('Great sprint')).toBeInTheDocument()
    expect(screen.getByText('Slow reviews')).toBeInTheDocument()
  })

  it('shows the board name in the header', async () => {
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Sprint 42'))
    expect(screen.getByText('Sprint 42')).toBeInTheDocument()
  })

  it('shows card and column counts in header', async () => {
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Went well'))
    expect(screen.getByText(/2 cards/)).toBeInTheDocument()
    expect(screen.getByText(/2 columns/)).toBeInTheDocument()
  })

  it('removes a card from UI immediately when deleted (optimistic)', async () => {
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Great sprint'))

    supabase.from.mockReturnValue(makeDeleteChain())
    await userEvent.click(screen.getAllByTitle('Delete')[0])
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.queryByText('Great sprint')).not.toBeInTheDocument())
  })

  it('removes a column and its cards from UI immediately when deleted (optimistic)', async () => {
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Went well'))

    supabase.from.mockReturnValue(makeDeleteChain())
    await userEvent.click(screen.getAllByTitle('Delete column')[0])
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(screen.queryByText('Went well')).not.toBeInTheDocument())
    expect(screen.queryByText('Great sprint')).not.toBeInTheDocument()
  })

  it('shows an alert when addCard fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Went well'))

    supabase.from.mockImplementation(() => {
      const chain = { insert: vi.fn() }
      chain.insert.mockResolvedValue({ error: { message: 'Insert failed' } })
      return chain
    })

    await userEvent.click(screen.getAllByText('+ Add a card')[0])
    await userEvent.type(screen.getByPlaceholderText(/what's on your mind/i), 'New card')
    await userEvent.click(screen.getByRole('button', { name: /add card/i }))
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Insert failed')))
    vi.restoreAllMocks()
  })

  it('rolls back card delete and shows alert on failure', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Great sprint'))

    const chain = { delete: vi.fn(), eq: vi.fn() }
    chain.delete.mockReturnValue(chain)
    chain.eq.mockResolvedValue({ error: { message: 'Delete failed' } })
    supabase.from.mockReturnValue(chain)

    await userEvent.click(screen.getAllByTitle('Delete')[0])
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Delete failed')))
    expect(screen.getByText('Great sprint')).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('shows an alert when addColumn fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Went well'))

    supabase.from.mockImplementation(() => {
      const chain = { insert: vi.fn() }
      chain.insert.mockResolvedValue({ error: { message: 'Column insert failed' } })
      return chain
    })

    await userEvent.click(screen.getByRole('button', { name: /\+ add column/i }))
    await userEvent.type(screen.getByPlaceholderText('Column name'), 'New col')
    await userEvent.click(screen.getByRole('button', { name: /^add column$/i }))
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Column insert failed')))
    vi.restoreAllMocks()
  })

  it('opens AddColumnModal when Add column is clicked', async () => {
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Went well'))
    await userEvent.click(screen.getByRole('button', { name: /add column/i }))
    expect(screen.getByPlaceholderText('Column name')).toBeInTheDocument()
  })

  it('copies the share link when Share link is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Went well'))
    await userEvent.click(screen.getByRole('button', { name: /share link/i }))
    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(screen.getByText(/copied/i)).toBeInTheDocument()
  })
})
