import { AuthService } from '../../src/auth/auth.service'
import { UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

describe('AuthService', () => {
  const refreshToken = { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() }
  const user = { findUnique: jest.fn() }
  const prisma = { user, refreshToken } as any
  const jwtService = { sign: jest.fn(() => 'signed-token'), verify: jest.fn() } as any
  const service = new AuthService(prisma, jwtService)

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
        id: 'u1', role: 'CUSTOMER', name: 'A', email: 'a@example.com', password: hash, status: 'ACTIVE',
      })
      await expect(service.login('a@example.com', 'wrong-password')).rejects.toThrow(UnauthorizedException)
    })

    it('issues tokens for a valid active user', async () => {
      const hash = await bcrypt.hash('password123', 4)
      user.findUnique.mockResolvedValue({
        id: 'u1', role: 'CUSTOMER', name: 'A', email: 'a@example.com', password: hash, status: 'ACTIVE',
      })
      const result = await service.login('a@example.com', 'password123')
      expect(result).toMatchObject({ accessToken: 'signed-token', refreshToken: 'signed-token' })
      expect(result.user.role).toBe('CUSTOMER')
      expect(refreshToken.create).toHaveBeenCalledTimes(1)
      expect(refreshToken.create.mock.calls[0][0].data.userId).toBe('u1')
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
