import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Card from '../components/Card'

const baseCard = { id: '1', text: 'Test card', votes: 0 }

describe('Card', () => {
  it('renders card text and vote count', () => {
    render(<Card card={baseCard} color="#1D9E75" onDelete={vi.fn()} onVote={vi.fn()} />)
    expect(screen.getByText('Test card')).toBeInTheDocument()
    expect(screen.getByText('▲ 0')).toBeInTheDocument()
  })

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn()
    render(<Card card={baseCard} color="#1D9E75" onDelete={onDelete} onVote={vi.fn()} />)
    await userEvent.click(screen.getByTitle('Delete'))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('calls onVote when vote button clicked', async () => {
    const onVote = vi.fn()
    render(<Card card={baseCard} color="#1D9E75" onDelete={vi.fn()} onVote={onVote} />)
    await userEvent.click(screen.getByTitle('Upvote'))
    expect(onVote).toHaveBeenCalledOnce()
  })

  it('applies vote color style when votes > 0', () => {
    const card = { ...baseCard, votes: 3 }
    render(<Card card={card} color="#1D9E75" onDelete={vi.fn()} onVote={vi.fn()} />)
    const voteBtn = screen.getByTitle('Upvote')
    expect(voteBtn).toHaveClass('has-votes')
    expect(voteBtn.style.getPropertyValue('--vote-color')).toBe('#1D9E75')
  })

  it('does not apply vote color style when votes is 0', () => {
    render(<Card card={baseCard} color="#1D9E75" onDelete={vi.fn()} onVote={vi.fn()} />)
    const voteBtn = screen.getByTitle('Upvote')
    expect(voteBtn).not.toHaveClass('has-votes')
  })
})
