import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Card from '../components/Card'

const baseCard = { id: '1', text: 'Test card', votes: 0, reactions: {} }

function renderCard(overrides = {}) {
  const props = {
    card: baseCard,
    color: '#1D9E75',
    hasVoted: false,
    myReactions: [],
    onDelete: vi.fn(),
    onVote: vi.fn(),
    onReact: vi.fn(),
    ...overrides,
  }
  return render(<Card {...props} />)
}

describe('Card', () => {
  it('renders card text and vote count', () => {
    renderCard()
    expect(screen.getByText('Test card')).toBeInTheDocument()
    expect(screen.getByTitle('Upvote')).toHaveTextContent('0')
  })

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn()
    renderCard({ onDelete })
    await userEvent.click(screen.getByTitle('Delete card'))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('calls onVote when vote button clicked', async () => {
    const onVote = vi.fn()
    renderCard({ onVote })
    await userEvent.click(screen.getByTitle('Upvote'))
    expect(onVote).toHaveBeenCalledOnce()
  })

  it('applies vote color style when votes > 0', () => {
    renderCard({ card: { ...baseCard, votes: 3 } })
    const voteBtn = screen.getByTitle('Upvote')
    expect(voteBtn).toHaveClass('has-votes')
    expect(voteBtn.style.getPropertyValue('--vote-color')).toBe('#1D9E75')
  })

  it('does not apply vote color style when votes is 0', () => {
    renderCard()
    expect(screen.getByTitle('Upvote')).not.toHaveClass('has-votes')
  })

  it('shows my-vote style and Remove vote title when user has voted', () => {
    renderCard({ card: { ...baseCard, votes: 1 }, hasVoted: true })
    expect(screen.getByTitle('Remove vote')).toHaveClass('my-vote')
  })

  it('calls onVote when removing a vote', async () => {
    const onVote = vi.fn()
    renderCard({ card: { ...baseCard, votes: 1 }, hasVoted: true, onVote })
    await userEvent.click(screen.getByTitle('Remove vote'))
    expect(onVote).toHaveBeenCalledOnce()
  })

  it('opens emoji picker when + button clicked', async () => {
    renderCard()
    await userEvent.click(screen.getByTitle('Add reaction'))
    expect(screen.getByText('👍')).toBeInTheDocument()
    expect(screen.getByText('❤️')).toBeInTheDocument()
  })

  it('calls onReact with card and emoji when emoji selected', async () => {
    const onReact = vi.fn()
    renderCard({ onReact })
    await userEvent.click(screen.getByTitle('Add reaction'))
    await userEvent.click(screen.getByText('👍'))
    expect(onReact).toHaveBeenCalledWith(baseCard, '👍')
  })

  it('renders existing reactions as chips', () => {
    renderCard({ card: { ...baseCard, reactions: { '👍': 2, '🎉': 1 } } })
    expect(screen.getByText('👍 2')).toBeInTheDocument()
    expect(screen.getByText('🎉 1')).toBeInTheDocument()
  })

  it('applies my-reaction style to reactions the user has made', () => {
    renderCard({
      card: { ...baseCard, reactions: { '👍': 1 } },
      myReactions: ['👍'],
    })
    expect(screen.getByText('👍 1')).toHaveClass('my-reaction')
  })

  it('calls onReact when clicking an existing reaction chip', async () => {
    const onReact = vi.fn()
    const card = { ...baseCard, reactions: { '👍': 1 } }
    renderCard({ card, myReactions: ['👍'], onReact })
    await userEvent.click(screen.getByText('👍 1'))
    expect(onReact).toHaveBeenCalledWith(card, '👍')
  })
})
