import { JwtStrategy } from '../../src/auth/jwt.strategy'
import { UnauthorizedException } from '@nestjs/common'

describe('JwtStrategy.validate', () => {
  const findUnique = jest.fn()
  const strategy = new JwtStrategy({ user: { findUnique } } as any)

  afterEach(() => findUnique.mockReset())

  it('returns { id, role, isDemo, name, email } for an active user', async () => {
    findUnique.mockResolvedValue({ id: 'u1', role: 'CUSTOMER', status: 'ACTIVE', isDemo: false, name: 'Chisom', email: 'chisom@example.com' })
    await expect(strategy.validate({ id: 'u1' })).resolves.toEqual({
      id: 'u1',
      role: 'CUSTOMER',
      isDemo: false,
      name: 'Chisom',
      email: 'chisom@example.com',
    })
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: { id: true, role: true, status: true, isDemo: true, name: true, email: true },
    })
  })

  it('rejects a suspended user on every request', async () => {
    findUnique.mockResolvedValue({ id: 'u1', role: 'CUSTOMER', status: 'SUSPENDED' })
    await expect(strategy.validate({ id: 'u1' })).rejects.toThrow(UnauthorizedException)
  })

  it('rejects a token for a deleted user', async () => {
    findUnique.mockResolvedValue(null)
    await expect(strategy.validate({ id: 'ghost' })).rejects.toThrow(UnauthorizedException)
  })
})
