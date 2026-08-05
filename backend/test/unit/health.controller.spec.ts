import { HealthController } from '../../src/health/health.controller'
import { ServiceUnavailableException } from '@nestjs/common'

describe('HealthController', () => {
  it('reports ok when the database responds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) }
    const controller = new HealthController(prisma as any)
    const result = await controller.check()
    expect(result.status).toBe('ok')
    expect(result.db).toBe('up')
    expect(result.timestamp).toBeTruthy()
  })

  it('throws 503 when the database is unreachable', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED')) }
    const controller = new HealthController(prisma as any)
    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException)
  })
})
