import { SupportService } from '../../src/support/support.service'

describe('SupportService', () => {
  const supportMessage = { create: jest.fn() }
  const user = { findUnique: jest.fn() }
  const prisma = { supportMessage, user } as any
  const emailService = { sendSupportMessageEmail: jest.fn() } as any
  const service = new SupportService(prisma, emailService)

  const input = {
    name: 'Chisom Eze',
    email: 'chisom@example.com',
    phone: '08012345678',
    subject: 'Refund question',
    message: 'How long do refunds take after a booking is cancelled?',
  }

  afterEach(() => jest.clearAllMocks())

  it('creates a support message without a userId for guests', async () => {
    user.findUnique.mockResolvedValue(null)
    supportMessage.create.mockResolvedValue({ id: 'sm1', ...input, userId: null })
    const result = await service.create(undefined, input)
    expect(supportMessage.create).toHaveBeenCalledWith({
      data: { userId: null, name: input.name, email: input.email, phone: input.phone, subject: input.subject, message: input.message },
    })
    expect(emailService.sendSupportMessageEmail).toHaveBeenCalledWith(input)
    expect(result.id).toBe('sm1')
  })

  it('links the message to an authenticated user', async () => {
    user.findUnique.mockResolvedValue({ id: 'u1' })
    supportMessage.create.mockResolvedValue({ id: 'sm2', userId: 'u1' })
    await service.create('u1', input)
    expect(supportMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'u1' }) }),
    )
  })

  it('stores null phone when omitted', async () => {
    user.findUnique.mockResolvedValue(null)
    supportMessage.create.mockResolvedValue({ id: 'sm3' })
    await service.create(undefined, { ...input, phone: undefined })
    expect(supportMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ phone: null }) }),
    )
    expect(emailService.sendSupportMessageEmail).toHaveBeenCalledWith({
      name: input.name,
      email: input.email,
      phone: null,
      subject: input.subject,
      message: input.message,
    })
  })

  it('does not look up the user when the token is absent', async () => {
    user.findUnique.mockResolvedValue(null)
    await service.create(undefined, input)
    expect(user.findUnique).not.toHaveBeenCalled()
  })
})
