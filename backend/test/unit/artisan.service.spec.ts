import { ArtisanService } from '../../src/artisan/artisan.service'
import { NotFoundException } from '@nestjs/common'

describe('ArtisanService', () => {
  const artisanProfile = { groupBy: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() }
  const portfolioItem = { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() }
  const prisma = { artisanProfile, portfolioItem } as any
  const uploadService = { uploadCover: jest.fn(), uploadPortfolio: jest.fn() } as any
  const service = new ArtisanService(prisma, uploadService)

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

  describe('updateCover', () => {
    it('uploads the cover and updates the profile', async () => {
      artisanProfile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'u1' })
      uploadService.uploadCover.mockResolvedValue('https://cloudinary.com/cover.jpg')
      artisanProfile.update.mockResolvedValue({ id: 'profile-1', coverImage: 'https://cloudinary.com/cover.jpg' })

      await service.updateCover('u1', 'data:image/jpeg;base64,xxx')

      expect(uploadService.uploadCover).toHaveBeenCalledWith('data:image/jpeg;base64,xxx')
      expect(artisanProfile.update).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
        data: { coverImage: 'https://cloudinary.com/cover.jpg' },
      })
    })

    it('throws when the artisan profile does not exist', async () => {
      artisanProfile.findUnique.mockResolvedValue(null)
      await expect(service.updateCover('u1', 'data:image/jpeg;base64,xxx')).rejects.toThrow(NotFoundException)
      expect(uploadService.uploadCover).not.toHaveBeenCalled()
    })
  })

  describe('addPortfolio', () => {
    it('uploads the image and creates a portfolio item', async () => {
      artisanProfile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'u1' })
      uploadService.uploadPortfolio.mockResolvedValue('https://cloudinary.com/portfolio.jpg')
      portfolioItem.create.mockResolvedValue({ id: 'p1', imageUrl: 'https://cloudinary.com/portfolio.jpg', caption: 'Kitchen repaint' })

      await service.addPortfolio('u1', 'data:image/png;base64,xxx', 'Kitchen repaint')

      expect(uploadService.uploadPortfolio).toHaveBeenCalledWith('data:image/png;base64,xxx')
      expect(portfolioItem.create).toHaveBeenCalledWith({
        data: { artisanId: 'profile-1', imageUrl: 'https://cloudinary.com/portfolio.jpg', caption: 'Kitchen repaint' },
      })
    })

    it('creates the item with a null caption when none is provided', async () => {
      artisanProfile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'u1' })
      uploadService.uploadPortfolio.mockResolvedValue('https://cloudinary.com/p.jpg')
      await service.addPortfolio('u1', 'data:image/jpeg;base64,xxx')
      expect(portfolioItem.create).toHaveBeenCalledWith({
        data: { artisanId: 'profile-1', imageUrl: 'https://cloudinary.com/p.jpg', caption: null },
      })
    })

    it('throws when the artisan profile does not exist', async () => {
      artisanProfile.findUnique.mockResolvedValue(null)
      await expect(service.addPortfolio('u1', 'data:image/jpeg;base64,xxx')).rejects.toThrow(NotFoundException)
    })
  })

  describe('removePortfolio', () => {
    it('deletes a portfolio item owned by the artisan', async () => {
      artisanProfile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'u1' })
      portfolioItem.findFirst.mockResolvedValue({ id: 'p1', artisanId: 'profile-1' })

      await expect(service.removePortfolio('u1', 'p1')).resolves.toEqual({ success: true })

      expect(portfolioItem.findFirst).toHaveBeenCalledWith({
        where: { id: 'p1', artisanId: 'profile-1' },
      })
      expect(portfolioItem.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
    })

    it('throws when the item does not belong to the artisan', async () => {
      artisanProfile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'u1' })
      portfolioItem.findFirst.mockResolvedValue(null)

      await expect(service.removePortfolio('u1', 'p1')).rejects.toThrow(NotFoundException)
      expect(portfolioItem.delete).not.toHaveBeenCalled()
    })

    it('throws when the artisan profile does not exist', async () => {
      artisanProfile.findUnique.mockResolvedValue(null)
      await expect(service.removePortfolio('u1', 'p1')).rejects.toThrow(NotFoundException)
    })
  })
})
