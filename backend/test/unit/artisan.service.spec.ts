import { ArtisanService } from '../../src/artisan/artisan.service'

describe('ArtisanService', () => {
  const artisanProfile = { groupBy: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() }
  const prisma = { artisanProfile } as any
  const service = new ArtisanService(prisma)

  afterEach(() => jest.clearAllMocks())

  describe('categoryCounts', () => {
    it('returns per-category counts of APPROVED artisans', async () => {
      artisanProfile.groupBy.mockResolvedValue([
        { category: 'Plumbing', _count: { _all: 3 } },
        { category: 'Electrical', _count: { _all: 2 } },
      ])
      await expect(service.categoryCounts()).resolves.toEqual([
        { name: 'Plumbing', count: 3 },
        { name: 'Electrical', count: 2 },
      ])
      expect(artisanProfile.groupBy).toHaveBeenCalledWith({
        by: ['category'],
        where: { approvalStatus: 'APPROVED' },
        _count: { _all: true },
      })
    })

    it('returns an empty list when no artisans are approved', async () => {
      artisanProfile.groupBy.mockResolvedValue([])
      await expect(service.categoryCounts()).resolves.toEqual([])
    })
  })
})
