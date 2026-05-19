import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeScreen from '../components/HomeScreen'

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
})
