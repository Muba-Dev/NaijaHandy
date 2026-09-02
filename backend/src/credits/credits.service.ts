import { Injectable, BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

type Tx = Prisma.TransactionClient

export const CREDIT_REWARD_PERCENT = 5
export const CREDIT_REWARD_MIN = 100
export const CREDIT_REWARD_MAX = 5000

@Injectable()
export class CreditsService {
  constructor(private prisma: PrismaService) {}

  // Reward earned on a completed booking — % of the gross amount, clamped.
  static rewardFor(amount: number) {
    return Math.min(
      CREDIT_REWARD_MAX,
      Math.max(CREDIT_REWARD_MIN, Math.round((amount * CREDIT_REWARD_PERCENT) / 100)),
    )
  }

  async balance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    })
    return user?.creditBalance ?? 0
  }

  async wallet(userId: string) {
    const [user, transactions] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { creditBalance: true } }),
      this.prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ])
    return { balance: user?.creditBalance ?? 0, transactions }
  }

  async award(userId: string, amount: number, bookingId?: string, note?: string) {
    return this.awardInTx(this.prisma, userId, amount, bookingId, note)
  }

  // Transaction-aware variant so callers running inside an interactive Prisma
  // transaction can apply credits atomically without nesting transactions.
  async awardInTx(tx: Tx, userId: string, amount: number, bookingId?: string, note?: string) {
    if (amount <= 0) return null
    const user = await tx.user.findUnique({ where: { id: userId }, select: { creditBalance: true } })
    const balance = (user?.creditBalance ?? 0) + amount
    return this.prismaTransactional(tx, [
      tx.user.update({ where: { id: userId }, data: { creditBalance: balance } }),
      tx.creditTransaction.create({
        data: { userId, amount, type: 'EARNED', bookingId, balanceAfter: balance, note: note || null },
      }),
    ])
  }

  // Debits credits. Caller must ensure amount <= balance (returns false otherwise).
  async use(userId: string, amount: number, bookingId?: string, note?: string) {
    return this.useInTx(this.prisma, userId, amount, bookingId, note)
  }

  // Transaction-aware variant of `use` for callers inside an interactive
  // Prisma transaction.
  async useInTx(tx: Tx, userId: string, amount: number, bookingId?: string, note?: string) {
    if (amount <= 0) return null
    const user = await tx.user.findUnique({ where: { id: userId }, select: { creditBalance: true } })
    const current = user?.creditBalance ?? 0
    if (current < amount) throw new BadRequestException('Insufficient credit balance')
    const balance = current - amount
    return this.prismaTransactional(tx, [
      tx.user.update({ where: { id: userId }, data: { creditBalance: balance } }),
      tx.creditTransaction.create({
        data: { userId, amount: -amount, type: 'USED', bookingId, balanceAfter: balance, note: note || null },
      }),
    ])
  }

  // Batch writes against either the top-level client or an interactive tx client
  // without nesting an extra transaction boundary.
  private prismaTransactional(tx: Tx, writes: Prisma.PrismaPromise<unknown>[]) {
    return tx === this.prisma ? this.prisma.$transaction(writes) : Promise.all(writes)
  }
}
