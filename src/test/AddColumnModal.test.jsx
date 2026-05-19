import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddColumnModal from '../components/AddColumnModal'

describe('AddColumnModal', () => {
  it('renders the modal with input and color swatches', () => {
    render(<AddColumnModal onAdd={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText('Column name')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /select color/i })).toHaveLength(8)
  })

  it('disables Add button when input is empty', () => {
    render(<AddColumnModal onAdd={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /add column/i })).toBeDisabled()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<AddColumnModal onAdd={vi.fn()} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when clicking the overlay backdrop', async () => {
    const onClose = vi.fn()
    const { container } = render(<AddColumnModal onAdd={vi.fn()} onClose={onClose} />)
    await userEvent.click(container.querySelector('.modal-overlay'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onAdd with title and selected color, then closes', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<AddColumnModal onAdd={onAdd} onClose={onClose} />)
    await userEvent.type(screen.getByPlaceholderText('Column name'), 'My Column')
    await userEvent.click(screen.getByRole('button', { name: /add column/i }))
    expect(onAdd).toHaveBeenCalledWith('My Column', '#1D9E75')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onAdd with a different color when one is selected', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    render(<AddColumnModal onAdd={onAdd} onClose={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('Column name'), 'My Column')
    await userEvent.click(screen.getByRole('button', { name: /select color #185FA5/i }))
    await userEvent.click(screen.getByRole('button', { name: /add column/i }))
    expect(onAdd).toHaveBeenCalledWith('My Column', '#185FA5')
  })

  it('submits on Enter key', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    render(<AddColumnModal onAdd={onAdd} onClose={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('Column name'), 'My Column{Enter}')
    expect(onAdd).toHaveBeenCalledWith('My Column', '#1D9E75')
  })

  it('closes on Escape key', async () => {
    const onClose = vi.fn()
    render(<AddColumnModal onAdd={vi.fn()} onClose={onClose} />)
    await userEvent.type(screen.getByPlaceholderText('Column name'), '{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not call onAdd if title is only whitespace', async () => {
    const onAdd = vi.fn()
    render(<AddColumnModal onAdd={onAdd} onClose={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('Column name'), '   {Enter}')
    expect(onAdd).not.toHaveBeenCalled()
  })
})
