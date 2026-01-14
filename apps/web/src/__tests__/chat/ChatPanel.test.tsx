import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatPanel, type ChatMessage } from '@/components/chat'

describe('ChatPanel', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'What are the zoning rules for downtown?',
      timestamp: new Date('2024-01-15T10:30:00'),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Downtown Milwaukee has several zoning districts including...',
      timestamp: new Date('2024-01-15T10:30:15'),
    },
  ]

  describe('Empty State', () => {
    it('renders empty state when there are no messages', () => {
      render(<ChatPanel messages={[]} />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('Hey MKE, what can I build?')).toBeInTheDocument()
      expect(
        screen.getByText(/Ask about zoning rules, financial incentives/)
      ).toBeInTheDocument()
    })

    it('does not render empty state when messages exist', () => {
      render(<ChatPanel messages={mockMessages} />)

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    })
  })

  describe('Message Display', () => {
    it('renders user messages with correct styling', () => {
      render(<ChatPanel messages={mockMessages} />)

      const userMessage = screen.getByTestId('message-user')
      expect(userMessage).toBeInTheDocument()
      expect(userMessage).toHaveTextContent('What are the zoning rules')

      // User messages should have sky-500 background (right side)
      const messageContainer = userMessage.querySelector('div')
      expect(messageContainer).toHaveClass('bg-sky-500')
    })

    it('renders assistant messages with correct styling', () => {
      render(<ChatPanel messages={mockMessages} />)

      const assistantMessage = screen.getByTestId('message-assistant')
      expect(assistantMessage).toBeInTheDocument()
      expect(assistantMessage).toHaveTextContent('Downtown Milwaukee has several')

      // Assistant messages should have white/stone-800 background (left side)
      const messageContainer = assistantMessage.querySelector('div')
      expect(messageContainer).toHaveClass('bg-white')
    })

    it('displays timestamps for messages', () => {
      render(<ChatPanel messages={mockMessages} />)

      // Multiple timestamps displayed - one for each message
      const timestamps = screen.getAllByText(/10:30/)
      expect(timestamps.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Input Submission', () => {
    it('calls onSendMessage when form is submitted', async () => {
      const user = userEvent.setup()
      const onSendMessage = vi.fn()

      render(<ChatPanel messages={[]} onSendMessage={onSendMessage} />)

      const input = screen.getByTestId('chat-input')
      await user.type(input, 'Test message')

      const sendButton = screen.getByTestId('send-button')
      await user.click(sendButton)

      expect(onSendMessage).toHaveBeenCalledWith('Test message')
    })

    it('clears input after submission', async () => {
      const user = userEvent.setup()
      const onSendMessage = vi.fn()

      render(<ChatPanel messages={[]} onSendMessage={onSendMessage} />)

      const input = screen.getByTestId('chat-input') as HTMLInputElement
      await user.type(input, 'Test message')
      expect(input.value).toBe('Test message')

      const sendButton = screen.getByTestId('send-button')
      await user.click(sendButton)

      expect(input.value).toBe('')
    })

    it('does not submit empty messages', async () => {
      const user = userEvent.setup()
      const onSendMessage = vi.fn()

      render(<ChatPanel messages={[]} onSendMessage={onSendMessage} />)

      const sendButton = screen.getByTestId('send-button')
      expect(sendButton).toBeDisabled()

      await user.click(sendButton)
      expect(onSendMessage).not.toHaveBeenCalled()
    })

    it('submits on Enter key press', async () => {
      const user = userEvent.setup()
      const onSendMessage = vi.fn()

      render(<ChatPanel messages={[]} onSendMessage={onSendMessage} />)

      const input = screen.getByTestId('chat-input')
      await user.type(input, 'Test message{enter}')

      expect(onSendMessage).toHaveBeenCalledWith('Test message')
    })
  })

  describe('Loading State', () => {
    it('shows loading indicator when isLoading is true', () => {
      render(<ChatPanel messages={mockMessages} isLoading={true} />)

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('hides loading indicator when isLoading is false', () => {
      render(<ChatPanel messages={mockMessages} isLoading={false} />)

      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
    })

    it('disables input while loading', () => {
      render(<ChatPanel messages={[]} isLoading={true} />)

      const input = screen.getByTestId('chat-input')
      expect(input).toBeDisabled()
    })
  })

  describe('Voice Input', () => {
    it('calls onVoiceInput when voice button is clicked', async () => {
      const user = userEvent.setup()
      const onVoiceInput = vi.fn()

      render(<ChatPanel messages={[]} onVoiceInput={onVoiceInput} />)

      const voiceButton = screen.getByTestId('voice-input-button')
      await user.click(voiceButton)

      expect(onVoiceInput).toHaveBeenCalledTimes(1)
    })
  })

  describe('Generative Cards', () => {
    it('renders card placeholder for messages with cards', () => {
      const messageWithCard: ChatMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Here is the zoning information:',
          timestamp: new Date(),
          cards: [{ type: 'zone-info', data: { code: 'RS6' } }],
        },
      ]

      render(<ChatPanel messages={messageWithCard} />)

      expect(screen.getByTestId('card-zone-info')).toBeInTheDocument()
      expect(screen.getByTestId('card-placeholder')).toBeInTheDocument()
    })

    it('uses custom renderCard function when provided', () => {
      const messageWithCard: ChatMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Here is the zoning information:',
          timestamp: new Date(),
          cards: [{ type: 'zone-info', data: { code: 'RS6' } }],
        },
      ]

      const customRenderCard = vi.fn(() => (
        <div data-testid="custom-card">Custom Card</div>
      ))

      render(<ChatPanel messages={messageWithCard} renderCard={customRenderCard} />)

      expect(customRenderCard).toHaveBeenCalled()
      expect(screen.getByTestId('custom-card')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible message log region', () => {
      render(<ChatPanel messages={mockMessages} />)

      expect(screen.getByRole('log')).toHaveAttribute(
        'aria-label',
        'Chat messages'
      )
    })

    it('has accessible loading announcement', () => {
      render(<ChatPanel messages={[]} isLoading={true} />)

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Assistant is typing'
      )
    })

    it('input has accessible label', () => {
      render(<ChatPanel messages={[]} />)

      expect(screen.getByLabelText('Message input')).toBeInTheDocument()
    })

    it('buttons have accessible labels', () => {
      render(<ChatPanel messages={[]} />)

      expect(screen.getByLabelText('Voice input')).toBeInTheDocument()
      expect(screen.getByLabelText('Send message')).toBeInTheDocument()
    })
  })
})
