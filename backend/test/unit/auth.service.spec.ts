import { AuthService } from '../../src/auth/auth.service'
import { UnauthorizedException, BadRequestException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { createHash } from 'crypto'

const hashOtp = (code: string) => createHash('sha256').update(code).digest('hex')

describe('AuthService', () => {
  const refreshToken = { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() }
  const emailVerificationToken = { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), deleteMany: jest.fn() }
  const user = { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() }
  const prisma = { user, refreshToken, emailVerificationToken, $transaction: jest.fn((ops: any[]) => Promise.all(ops)) } as any
  const jwtService = { sign: jest.fn(() => 'signed-token'), verify: jest.fn() } as any
  const emailService = {
    sendPasswordResetEmail: jest.fn(),
    sendNewArtisanPendingEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
  } as any
  const service = new AuthService(prisma, jwtService, emailService)

  const future = new Date(Date.now() + 86_400_000)
  const past = new Date(Date.now() - 1_000)

  afterEach(() => jest.clearAllMocks())

  describe('login', () => {
    it('rejects a suspended account before checking the password', async () => {
      user.findUnique.mockResolvedValue({ id: 'u1', role: 'CUSTOMER', password: 'hash', status: 'SUSPENDED' })
      await expect(service.login('x@example.com', 'whatever')).rejects.toThrow('Account suspended')
    })

    it('rejects an unknown email', async () => {
      user.findUnique.mockResolvedValue(null)
      await expect(service.login('nope@example.com', 'password123')).rejects.toThrow(UnauthorizedException)
    })

    it('rejects a wrong password', async () => {
      const hash = await bcrypt.hash('password123', 4)
      user.findUnique.mockResolvedValue({
        id: 'u1', role: 'CUSTOMER', name: 'A', email: 'a@example.com', password: hash, status: 'ACTIVE', emailVerified: true,
      })
      await expect(service.login('a@example.com', 'wrong-password')).rejects.toThrow(UnauthorizedException)
    })

    it('blocks login until the email is verified', async () => {
      const hash = await bcrypt.hash('password123', 4)
      user.findUnique.mockResolvedValue({
        id: 'u1', role: 'CUSTOMER', name: 'A', email: 'a@example.com', password: hash, status: 'ACTIVE', emailVerified: false,
      })
      await expect(service.login('a@example.com', 'password123')).rejects.toThrow('Please verify your email before logging in')
      expect(refreshToken.create).not.toHaveBeenCalled()
    })

    it('issues tokens for a valid active user', async () => {
      const hash = await bcrypt.hash('password123', 4)
      user.findUnique.mockResolvedValue({
        id: 'u1', role: 'CUSTOMER', name: 'A', email: 'a@example.com', password: hash, status: 'ACTIVE', emailVerified: true,
      })
      const result = await service.login('a@example.com', 'password123')
      expect(result).toMatchObject({ accessToken: 'signed-token', refreshToken: 'signed-token' })
      expect(result.user.role).toBe('CUSTOMER')
      expect(refreshToken.create).toHaveBeenCalledTimes(1)
      expect(refreshToken.create.mock.calls[0][0].data.userId).toBe('u1')
    })
  })

  describe('register', () => {
    it('alerts admins when a new artisan registers', async () => {
      user.findUnique.mockResolvedValue(null)
      user.create.mockResolvedValue({ id: 'u1', name: 'New Art', email: 'art@example.com', role: 'ARTISAN' })
      user.findMany.mockResolvedValue([{ email: 'admin@naijahandy.com' }])
      emailVerificationToken.create.mockResolvedValue({ id: 't1' })
      await service.register({
        name: 'New Art',
        email: 'art@example.com',
        password: 'password123',
        role: 'ARTISAN',
        profession: 'Plumber',
      })
      expect(emailService.sendNewArtisanPendingEmail).toHaveBeenCalledWith({
        to: 'admin@naijahandy.com',
        artisanName: 'New Art',
        profession: 'Plumber',
      })
    })

    it('does not alert admins for customer registrations', async () => {
      user.findUnique.mockResolvedValue(null)
      user.create.mockResolvedValue({ id: 'u2', name: 'Cust', email: 'cust@example.com', role: 'CUSTOMER' })
      emailVerificationToken.create.mockResolvedValue({ id: 't2' })
      await service.register({
        name: 'Cust',
        email: 'cust@example.com',
        password: 'password123',
        role: 'CUSTOMER',
      })
      expect(emailService.sendNewArtisanPendingEmail).not.toHaveBeenCalled()
    })

    it('creates an unverified account and issues no tokens', async () => {
      user.findUnique.mockResolvedValue(null)
      user.create.mockResolvedValue({ id: 'u3', name: 'Vera', email: 'vera@example.com', role: 'CUSTOMER', avatar: null })
      const result = await service.register({
        name: 'Vera',
        email: 'vera@example.com',
        password: 'password123',
        role: 'CUSTOMER',
      })
      expect(result.verificationRequired).toBe(true)
      expect(result as any).not.toHaveProperty('accessToken')
      expect(user.create.mock.calls[0][0].data.emailVerified).toBe(false)
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled()
      expect(emailVerificationToken.create).not.toHaveBeenCalled()
      expect(refreshToken.create).not.toHaveBeenCalled()
    })
  })

  describe('requestEmailVerification', () => {
    // Deterministic regardless of the ambient .env: force email sending OFF so
    // the dev-code mock path is always exercised (same pattern as PAYSTACK_MOCK).
    beforeEach(() => {
      process.env.EMAIL_ENABLED = 'false'
    })
    afterEach(() => {
      delete process.env.EMAIL_ENABLED
    })

    it('sends a code and returns devCode when email sending is disabled', async () => {
      user.findUnique.mockResolvedValue({ id: 'u1', email: 'vera@example.com', emailVerified: false })
      emailVerificationToken.findFirst.mockResolvedValue(null)
      emailVerificationToken.create.mockResolvedValue({ id: 't1' })
      const result = await service.requestEmailVerification('vera@example.com')
      expect(result.success).toBe(true)
      expect(result.devCode).toMatch(/^\d{6}$/)
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith('vera@example.com', result.devCode)
      expect(emailVerificationToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1', used: false } })
    })

    it('rejects an unknown email', async () => {
      user.findUnique.mockResolvedValue(null)
      await expect(service.requestEmailVerification('nope@example.com')).rejects.toThrow(BadRequestException)
    })

    it('rejects an already verified email', async () => {
      user.findUnique.mockResolvedValue({ id: 'u1', email: 'vera@example.com', emailVerified: true })
      await expect(service.requestEmailVerification('vera@example.com')).rejects.toThrow('already verified')
    })

    it('throttles resends within the cooldown window', async () => {
      user.findUnique.mockResolvedValue({ id: 'u1', email: 'vera@example.com', emailVerified: false })
      emailVerificationToken.findFirst.mockResolvedValue({ createdAt: new Date() })
      await expect(service.requestEmailVerification('vera@example.com')).rejects.toThrow('Please wait a minute')
      expect(emailVerificationToken.create).not.toHaveBeenCalled()
    })
  })

  describe('confirmEmailVerification', () => {
    const userRow = { id: 'u1', name: 'Vera', email: 'vera@example.com', role: 'CUSTOMER', avatar: null, emailVerified: false }
    const record = { id: 't1', userId: 'u1', codeHash: hashOtp('123456'), attempts: 0, expiresAt: future, used: false }

    it('verifies the email and issues tokens', async () => {
      user.findUnique.mockResolvedValue(userRow)
      emailVerificationToken.findFirst.mockResolvedValue(record)
      refreshToken.create.mockResolvedValue({})
      const result = await service.confirmEmailVerification('vera@example.com', '123456')
      expect(emailVerificationToken.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { used: true } })
      expect(user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { emailVerified: true } })
      expect(result.accessToken).toBe('signed-token')
      expect(result.user.email).toBe('vera@example.com')
    })

    it('rejects an unknown email', async () => {
      user.findUnique.mockResolvedValue(null)
      await expect(service.confirmEmailVerification('nope@example.com', '123456')).rejects.toThrow(BadRequestException)
    })

    it('rejects an already verified email', async () => {
      user.findUnique.mockResolvedValue({ ...userRow, emailVerified: true })
      await expect(service.confirmEmailVerification('vera@example.com', '123456')).rejects.toThrow('already verified')
    })

    it('rejects when no code has been requested', async () => {
      user.findUnique.mockResolvedValue(userRow)
      emailVerificationToken.findFirst.mockResolvedValue(null)
      await expect(service.confirmEmailVerification('vera@example.com', '123456')).rejects.toThrow('No verification code found')
    })

    it('rejects an expired code and invalidates it', async () => {
      user.findUnique.mockResolvedValue(userRow)
      emailVerificationToken.findFirst.mockResolvedValue({ ...record, expiresAt: past })
      await expect(service.confirmEmailVerification('vera@example.com', '123456')).rejects.toThrow('has expired')
      expect(emailVerificationToken.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { used: true } })
    })

    it('increments the attempt counter on a wrong code', async () => {
      user.findUnique.mockResolvedValue(userRow)
      emailVerificationToken.findFirst.mockResolvedValue(record)
      await expect(service.confirmEmailVerification('vera@example.com', '000000')).rejects.toThrow('Incorrect verification code')
      expect(emailVerificationToken.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { attempts: 1 } })
      expect(user.update).not.toHaveBeenCalled()
    })

    it('locks the code after too many wrong attempts', async () => {
      user.findUnique.mockResolvedValue(userRow)
      emailVerificationToken.findFirst.mockResolvedValue({ ...record, attempts: 4 })
      await expect(service.confirmEmailVerification('vera@example.com', '000000')).rejects.toThrow('Too many incorrect attempts')
      expect(emailVerificationToken.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { used: true, attempts: 5 } })
    })
  })

  describe('refresh', () => {
    it('rejects an unknown refresh token', async () => {
      refreshToken.findUnique.mockResolvedValue(null)
      await expect(service.refresh('rt')).rejects.toThrow('Invalid refresh token')
    })

    it('rejects and deletes an expired refresh token', async () => {
      refreshToken.findUnique.mockResolvedValue({ token: 'rt', expiresAt: past })
      await expect(service.refresh('rt')).rejects.toThrow('Refresh token expired')
      expect(refreshToken.delete).toHaveBeenCalledWith({ where: { token: 'rt' } })
    })

    it('rejects and revokes the token when the account is suspended', async () => {
      refreshToken.findUnique.mockResolvedValue({ token: 'rt', expiresAt: future })
      jwtService.verify.mockReturnValue({ id: 'u1', role: 'CUSTOMER' })
      user.findUnique.mockResolvedValue({ id: 'u1', status: 'SUSPENDED' })
      await expect(service.refresh('rt')).rejects.toThrow('Account suspended')
      expect(refreshToken.deleteMany).toHaveBeenCalledWith({ where: { token: 'rt' } })
    })

    it('rotates the token for an active user', async () => {
      refreshToken.findUnique.mockResolvedValue({ token: 'rt', expiresAt: future })
      jwtService.verify.mockReturnValue({ id: 'u1', role: 'CUSTOMER' })
      user.findUnique.mockResolvedValue({ id: 'u1', status: 'ACTIVE' })
      const result = await service.refresh('rt')
      expect(refreshToken.delete).toHaveBeenCalledWith({ where: { token: 'rt' } })
      expect(refreshToken.create).toHaveBeenCalledTimes(1)
      expect(result.refreshToken).toBe('signed-token')
    })
  })

  describe('logout', () => {
    it('deletes any refresh tokens for the given token', async () => {
      await service.logout('rt')
      expect(refreshToken.deleteMany).toHaveBeenCalledWith({ where: { token: 'rt' } })
    })
  })
})
