import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import Board from '../components/Board'

vi.mock('../lib/toast', () => ({ toast: vi.fn() }))

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
import { toast } from '../lib/toast'

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
    await userEvent.click(screen.getAllByTitle('Delete card')[0])
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

  it('shows an error toast when addCard fails', async () => {
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Went well'))

    supabase.from.mockImplementation(() => {
      const chain = { insert: vi.fn() }
      chain.insert.mockResolvedValue({ error: { message: 'Insert failed' } })
      return chain
    })

    await userEvent.click(screen.getAllByRole('button', { name: /add a card/i })[0])
    await userEvent.type(screen.getByPlaceholderText(/what's on your mind/i), 'New card')
    await userEvent.click(screen.getByRole('button', { name: /add card/i }))
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringContaining('Insert failed'), 'error'))
  })

  it('rolls back card delete and shows error toast on failure', async () => {
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Great sprint'))

    const chain = { delete: vi.fn(), eq: vi.fn() }
    chain.delete.mockReturnValue(chain)
    chain.eq.mockResolvedValue({ error: { message: 'Delete failed' } })
    supabase.from.mockReturnValue(chain)

    await userEvent.click(screen.getAllByTitle('Delete card')[0])
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringContaining('Delete failed'), 'error'))
    expect(screen.getByText('Great sprint')).toBeInTheDocument()
  })

  it('shows an error toast when addColumn fails', async () => {
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Went well'))

    supabase.from.mockImplementation(() => {
      const chain = { insert: vi.fn() }
      chain.insert.mockResolvedValue({ error: { message: 'Column insert failed' } })
      return chain
    })

    await userEvent.click(screen.getByRole('button', { name: /add column/i }))
    const modal = screen.getByPlaceholderText('Column name').closest('.modal')
    await userEvent.type(screen.getByPlaceholderText('Column name'), 'New col')
    await userEvent.click(within(modal).getByRole('button', { name: /^add column$/i }))
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringContaining('Column insert failed'), 'error'))
  })

  it('shows error toast and does not insert when column limit is reached', async () => {
    const tenColumns = Array.from({ length: 10 }, (_, i) => ({
      id: `col-${i}`, board_id: 'board-1', title: `Col ${i}`, color: '#1D9E75', position: i,
    }))
    supabase.from.mockImplementation(table => {
      if (table === 'columns') {
        const chain = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() }
        chain.select.mockReturnValue(chain)
        chain.eq.mockReturnValue(chain)
        chain.order.mockResolvedValue({ data: tenColumns })
        chain.insert.mockReturnValue(chain)
        chain.update.mockReturnValue(chain)
        chain.delete.mockReturnValue(chain)
        return chain
      }
      if (table === 'cards') {
        const chain = { select: vi.fn(), eq: vi.fn(), order: vi.fn() }
        chain.select.mockReturnValue(chain)
        chain.eq.mockReturnValue(chain)
        chain.order.mockResolvedValue({ data: [] })
        return chain
      }
    })
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Col 0'))
    await userEvent.click(screen.getByRole('button', { name: /add column/i }))
    const modal = screen.getByPlaceholderText('Column name').closest('.modal')
    await userEvent.type(screen.getByPlaceholderText('Column name'), 'Overflow col')
    await userEvent.click(within(modal).getByRole('button', { name: /^add column$/i }))
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('10 columns'), 'error')
  })

  it('disables add card and shows Column full when card limit is reached', async () => {
    const thirtyCards = Array.from({ length: 30 }, (_, i) => ({
      id: `card-${i}`, board_id: 'board-1', column_id: 'col-1', text: `Card ${i}`, votes: 0, reactions: {},
    }))
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
        const chain = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), insert: vi.fn() }
        chain.select.mockReturnValue(chain)
        chain.eq.mockReturnValue(chain)
        chain.order.mockResolvedValue({ data: thirtyCards })
        chain.insert.mockResolvedValue({ data: null })
        return chain
      }
    })
    render(<Board boardId="board-1" board={board} />)
    await waitFor(() => screen.getByText('Went well'))
    const fullBtn = screen.getAllByText('Column full')[0]
    expect(fullBtn).toBeDisabled()
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
