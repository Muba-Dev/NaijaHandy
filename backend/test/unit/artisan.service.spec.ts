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

    it('filters out demo artisans for a logged-in non-demo user', async () => {
      artisanProfile.groupBy.mockResolvedValue([])
      await service.categoryCounts({ id: 'u1', role: 'CUSTOMER', isDemo: false })
      expect(artisanProfile.groupBy).toHaveBeenCalledWith({
        by: ['category'],
        where: { approvalStatus: 'APPROVED', isDemo: false },
        _count: { _all: true },
      })
    })
  })

  describe('findAll demo filtering', () => {
    const baseWhere = {
      approvalStatus: 'APPROVED',
    }

    it('shows demo artisans to anonymous visitors', async () => {
      artisanProfile.findMany.mockResolvedValue([])
      await service.findAll({}, undefined)
      expect(artisanProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: baseWhere }),
      )
    })

    it('hides demo artisans from authenticated non-demo users', async () => {
      artisanProfile.findMany.mockResolvedValue([])
      await service.findAll({}, { id: 'u1', role: 'CUSTOMER', isDemo: false })
      expect(artisanProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ...baseWhere, isDemo: false } }),
      )
    })

    it('shows demo artisans to demo users', async () => {
      artisanProfile.findMany.mockResolvedValue([])
      await service.findAll({}, { id: 'demo', role: 'CUSTOMER', isDemo: true })
      expect(artisanProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: baseWhere }),
      )
    })

    it('shows demo artisans to admins', async () => {
      artisanProfile.findMany.mockResolvedValue([])
      await service.findAll({}, { id: 'admin', role: 'ADMIN', isDemo: false })
      expect(artisanProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: baseWhere }),
      )
    })
  })

  describe('findOne demo filtering', () => {
    it('hides demo artisan details from authenticated non-demo users', async () => {
      artisanProfile.findFirst.mockResolvedValue(null)
      await service.findOne('art-1', { id: 'u1', role: 'CUSTOMER', isDemo: false }).catch(() => null)
      expect(artisanProfile.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'art-1', approvalStatus: 'APPROVED', isDemo: false } }),
      )
    })

    it('shows demo artisan details to anonymous visitors', async () => {
      artisanProfile.findFirst.mockResolvedValue(null)
      await service.findOne('art-1').catch(() => null)
      expect(artisanProfile.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'art-1', approvalStatus: 'APPROVED' } }),
      )
    })
  })
})
