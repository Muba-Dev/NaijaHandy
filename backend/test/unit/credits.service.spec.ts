import { CreditsService } from '../../src/credits/credits.service'
import { BadRequestException } from '@nestjs/common'

describe('CreditsService', () => {
  const userUpdate = jest.fn()
  const userFindUnique = jest.fn()
  const transactionCreate = jest.fn()
  const transactionFindMany = jest.fn()
  const prisma = {
    user: { findUnique: userFindUnique, update: userUpdate },
    creditTransaction: { create: transactionCreate, findMany: transactionFindMany },
  } as any
  prisma.$transaction = jest.fn(async (txns: any[]) => Promise.all(txns))
  const service = new CreditsService(prisma)

  afterEach(() => jest.clearAllMocks())

  describe('rewardFor', () => {
    it('returns 5% rounded to the nearest naira', () => {
      expect(CreditsService.rewardFor(10000)).toBe(500)
      expect(CreditsService.rewardFor(17000)).toBe(850)
    })

    it('clamps to the minimum', () => {
      expect(CreditsService.rewardFor(1000)).toBe(100)
    })

    it('clamps to the maximum', () => {
      expect(CreditsService.rewardFor(200000)).toBe(5000)
    })
  })

  describe('award', () => {
    it('adds credits and records a ledger row with the running balance', async () => {
      userFindUnique.mockResolvedValue({ creditBalance: 500 })
      userUpdate.mockResolvedValue({ creditBalance: 1500 })
      transactionCreate.mockResolvedValue({ id: 't1' })

      await service.award('c1', 1000, 'b1', '5% back')

      expect(userUpdate).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { creditBalance: 1500 },
      })
      expect(transactionCreate).toHaveBeenCalledWith({
        data: { userId: 'c1', amount: 1000, type: 'EARNED', bookingId: 'b1', balanceAfter: 1500, note: '5% back' },
      })
    })

    it('is a no-op for non-positive amounts', async () => {
      await expect(service.award('c1', 0, 'b1')).resolves.toBeNull()
      expect(userUpdate).not.toHaveBeenCalled()
    })
  })

  describe('use', () => {
    it('deducts credits and records the debit', async () => {
      userFindUnique.mockResolvedValue({ creditBalance: 1500 })
      userUpdate.mockResolvedValue({ creditBalance: 1000 })
      transactionCreate.mockResolvedValue({ id: 't2' })

      await service.use('c1', 500, 'b1', 'Applied to booking')

      expect(userUpdate).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { creditBalance: 1000 },
      })
      expect(transactionCreate).toHaveBeenCalledWith({
        data: { userId: 'c1', amount: -500, type: 'USED', bookingId: 'b1', balanceAfter: 1000, note: 'Applied to booking' },
      })
    })

    it('throws when the balance is insufficient', async () => {
      userFindUnique.mockResolvedValue({ creditBalance: 100 })
      await expect(service.use('c1', 500, 'b1')).rejects.toThrow(BadRequestException)
      expect(userUpdate).not.toHaveBeenCalled()
    })
  })

  describe('wallet', () => {
    it('returns the balance and recent transactions', async () => {
      userFindUnique.mockResolvedValue({ creditBalance: 800 })
      transactionFindMany.mockResolvedValue([{ id: 't1', amount: 500 }])

      const wallet = await service.wallet('c1')

      expect(wallet).toEqual({ balance: 800, transactions: [{ id: 't1', amount: 500 }] })
      expect(transactionFindMany).toHaveBeenCalledWith({
        where: { userId: 'c1' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    })
  })
})
