import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Column from '../components/Column'

const column = { id: 'col-1', title: 'Went well', color: '#1D9E75', position: 0 }
const cards = [
  { id: 'c1', text: 'Great teamwork', votes: 2, column_id: 'col-1' },
  { id: 'c2', text: 'Good demos', votes: 0, column_id: 'col-1' },
]

function renderColumn(overrides = {}) {
  const props = {
    column,
    cards,
    onAddCard: vi.fn(),
    onDeleteCard: vi.fn(),
    onVoteCard: vi.fn(),
    onReactToCard: vi.fn(),
    onUpdateColumn: vi.fn(),
    onDeleteColumn: vi.fn(),
    votedCards: new Set(),
    myReactions: {},
    ...overrides,
  }
  return { ...render(<Column {...props} />), props }
}

describe('Column', () => {
  it('renders the column title and card count', () => {
    renderColumn()
    expect(screen.getByText('Went well')).toBeInTheDocument()
    expect(screen.getByText('2', { selector: '.col-count' })).toBeInTheDocument()
  })

  it('renders all cards', () => {
    renderColumn()
    expect(screen.getByText('Great teamwork')).toBeInTheDocument()
    expect(screen.getByText('Good demos')).toBeInTheDocument()
  })

  it('renders cards in insertion order', () => {
    renderColumn()
    const all = screen.getAllByText(/Great teamwork|Good demos/)
    expect(all[0]).toHaveTextContent('Great teamwork')
    expect(all[1]).toHaveTextContent('Good demos')
  })

  it('shows empty hint when no cards', () => {
    renderColumn({ cards: [] })
    expect(screen.getByText(/no cards yet/i)).toBeInTheDocument()
  })

  it('opens card input when Add a card is clicked', async () => {
    renderColumn()
    await userEvent.click(screen.getByRole('button', { name: /add a card/i }))
    expect(screen.getByPlaceholderText(/what's on your mind/i)).toBeInTheDocument()
  })

  it('calls onAddCard with trimmed text and closes input', async () => {
    const onAddCard = vi.fn().mockResolvedValue(undefined)
    renderColumn({ onAddCard })
    await userEvent.click(screen.getByRole('button', { name: /add a card/i }))
    await userEvent.type(screen.getByPlaceholderText(/what's on your mind/i), 'New card')
    await userEvent.click(screen.getByRole('button', { name: /add card/i }))
    expect(onAddCard).toHaveBeenCalledWith('col-1', 'New card')
    expect(screen.queryByPlaceholderText(/what's on your mind/i)).not.toBeInTheDocument()
  })

  it('submits card on Enter (without shift)', async () => {
    const onAddCard = vi.fn().mockResolvedValue(undefined)
    renderColumn({ onAddCard })
    await userEvent.click(screen.getByRole('button', { name: /add a card/i }))
    await userEvent.type(screen.getByPlaceholderText(/what's on your mind/i), 'New card{Enter}')
    expect(onAddCard).toHaveBeenCalledWith('col-1', 'New card')
  })

  it('cancels card input on Escape', async () => {
    renderColumn()
    await userEvent.click(screen.getByRole('button', { name: /add a card/i }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByPlaceholderText(/what's on your mind/i)).not.toBeInTheDocument()
  })



  it('calls onVoteCard when vote button is clicked', async () => {
    const onVoteCard = vi.fn()
    renderColumn({ onVoteCard })
    const voteButtons = screen.getAllByTitle('Upvote')
    await userEvent.click(voteButtons[0])
    expect(onVoteCard).toHaveBeenCalled()
  })

  it('enters edit mode when title is clicked', async () => {
    renderColumn()
    await userEvent.click(screen.getByText('Went well'))
    expect(screen.getByDisplayValue('Went well')).toBeInTheDocument()
  })

  it('calls onUpdateColumn with new title on blur', async () => {
    const onUpdateColumn = vi.fn().mockResolvedValue(undefined)
    renderColumn({ onUpdateColumn })
    await userEvent.click(screen.getByText('Went well'))
    const input = screen.getByDisplayValue('Went well')
    await userEvent.clear(input)
    await userEvent.type(input, 'Updated title')
    await userEvent.tab()
    expect(onUpdateColumn).toHaveBeenCalledWith('col-1', { title: 'Updated title' })
  })

  it('reverts title on Escape during edit', async () => {
    renderColumn()
    await userEvent.click(screen.getByText('Went well'))
    const input = screen.getByDisplayValue('Went well')
    await userEvent.clear(input)
    await userEvent.type(input, 'Something else{Escape}')
    expect(screen.getByText('Went well')).toBeInTheDocument()
  })

  it('reverts to original title if edit is cleared and blurred', async () => {
    const onUpdateColumn = vi.fn()
    renderColumn({ onUpdateColumn })
    await userEvent.click(screen.getByText('Went well'))
    const input = screen.getByDisplayValue('Went well')
    await userEvent.clear(input)
    await userEvent.tab()
    expect(onUpdateColumn).not.toHaveBeenCalled()
    expect(screen.getByText('Went well')).toBeInTheDocument()
  })

  it('shows confirm modal when delete column is clicked', async () => {
    renderColumn()
    await userEvent.click(screen.getByTitle('Delete column'))
    expect(screen.getByText('Are you sure you want to delete this column?')).toBeInTheDocument()
  })

  it('calls onDeleteColumn when confirmed', async () => {
    const onDeleteColumn = vi.fn()
    renderColumn({ onDeleteColumn })
    await userEvent.click(screen.getByTitle('Delete column'))
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(onDeleteColumn).toHaveBeenCalledWith('col-1')
  })

  it('does not call onDeleteColumn when cancelled', async () => {
    const onDeleteColumn = vi.fn()
    renderColumn({ onDeleteColumn })
    await userEvent.click(screen.getByTitle('Delete column'))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onDeleteColumn).not.toHaveBeenCalled()
  })

  it('shows confirm modal when delete card is clicked', async () => {
    renderColumn()
    await userEvent.click(screen.getAllByTitle('Delete card')[0])
    expect(screen.getByText('Are you sure you want to delete this card?')).toBeInTheDocument()
  })

  it('calls onDeleteCard when confirmed', async () => {
    const onDeleteCard = vi.fn()
    renderColumn({ onDeleteCard })
    await userEvent.click(screen.getAllByTitle('Delete card')[0])
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(onDeleteCard).toHaveBeenCalled()
  })

  it('does not call onDeleteCard when cancelled', async () => {
    const onDeleteCard = vi.fn()
    renderColumn({ onDeleteCard })
    await userEvent.click(screen.getAllByTitle('Delete card')[0])
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onDeleteCard).not.toHaveBeenCalled()
  })
})
