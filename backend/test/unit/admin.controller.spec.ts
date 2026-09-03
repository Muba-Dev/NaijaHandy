import { AdminController } from '../../src/admin/admin.controller'
import { BadRequestException } from '@nestjs/common'

describe('AdminController', () => {
  const adminService = {
    setArtisanApproval: jest.fn(),
    setArtisanVerification: jest.fn(),
    setUserStatus: jest.fn(),
    setReviewStatus: jest.fn(),
    resolveDispute: jest.fn(),
    setSupportMessageStatus: jest.fn(),
  } as any
  const controller = new AdminController(adminService)

  afterEach(() => jest.clearAllMocks())

  describe('setArtisanApproval', () => {
    it('delegates a valid approvalStatus', async () => {
      adminService.setArtisanApproval.mockResolvedValue({ id: 'a1' })
      await expect(controller.setArtisanApproval('a1', { approvalStatus: 'APPROVED' })).resolves.toEqual({
        data: { id: 'a1' },
      })
      expect(adminService.setArtisanApproval).toHaveBeenCalledWith('a1', 'APPROVED')
    })

    it.each(['PENDING', 'REJECTED'])('accepts %s', async (approvalStatus) => {
      adminService.setArtisanApproval.mockResolvedValue({ id: 'a1' })
      await controller.setArtisanApproval('a1', { approvalStatus })
      expect(adminService.setArtisanApproval).toHaveBeenCalledWith('a1', approvalStatus)
    })

    it('rejects an unknown approvalStatus', async () => {
      await expect(controller.setArtisanApproval('a1', { approvalStatus: 'NOPE' })).rejects.toThrow(
        BadRequestException,
      )
      expect(adminService.setArtisanApproval).not.toHaveBeenCalled()
    })

    it('rejects a missing approvalStatus', async () => {
      await expect(controller.setArtisanApproval('a1', {})).rejects.toThrow(BadRequestException)
    })
  })

  describe('setArtisanVerification', () => {
    it('delegates a valid verificationStatus', async () => {
      adminService.setArtisanVerification.mockResolvedValue({ id: 'a1' })
      await expect(controller.setArtisanVerification('a1', { verificationStatus: 'VERIFIED' })).resolves.toEqual({
        data: { id: 'a1' },
      })
      expect(adminService.setArtisanVerification).toHaveBeenCalledWith('a1', 'VERIFIED')
    })

    it('rejects an unknown verificationStatus', async () => {
      await expect(controller.setArtisanVerification('a1', { verificationStatus: 'MAYBE' })).rejects.toThrow(
        BadRequestException,
      )
      expect(adminService.setArtisanVerification).not.toHaveBeenCalled()
    })
  })

  describe('setUserStatus', () => {
    it('delegates a valid status', async () => {
      adminService.setUserStatus.mockResolvedValue({ id: 'u1' })
      await expect(controller.setUserStatus('u1', { status: 'SUSPENDED' })).resolves.toEqual({ data: { id: 'u1' } })
      expect(adminService.setUserStatus).toHaveBeenCalledWith('u1', 'SUSPENDED')
    })

    it('rejects an unknown status', async () => {
      await expect(controller.setUserStatus('u1', { status: 'BANNED' })).rejects.toThrow(BadRequestException)
    })
  })

  describe('setReviewStatus', () => {
    it('delegates a valid status', async () => {
      adminService.setReviewStatus.mockResolvedValue({ id: 'r1' })
      await expect(controller.setReviewStatus('r1', { status: 'HIDDEN' })).resolves.toEqual({ data: { id: 'r1' } })
      expect(adminService.setReviewStatus).toHaveBeenCalledWith('r1', 'HIDDEN')
    })

    it('rejects an unknown status', async () => {
      await expect(controller.setReviewStatus('r1', { status: 'SPAM' })).rejects.toThrow(BadRequestException)
    })
  })

  describe('resolveDispute', () => {
    it('delegates status and resolution', async () => {
      adminService.resolveDispute.mockResolvedValue({ id: 'd1' })
      await expect(controller.resolveDispute('d1', { status: 'RESOLVED', resolution: 'Refunded' })).resolves.toEqual({
        data: { id: 'd1' },
      })
      expect(adminService.resolveDispute).toHaveBeenCalledWith('d1', 'RESOLVED', 'Refunded')
    })

    it('rejects an unknown dispute status', async () => {
      await expect(controller.resolveDispute('d1', { status: 'OPEN' })).rejects.toThrow(BadRequestException)
    })
  })

  describe('setSupportMessageStatus', () => {
    it('delegates a valid status', async () => {
      adminService.setSupportMessageStatus.mockResolvedValue({ id: 's1' })
      await expect(controller.setSupportMessageStatus('s1', { status: 'CLOSED' })).resolves.toEqual({ data: { id: 's1' } })
      expect(adminService.setSupportMessageStatus).toHaveBeenCalledWith('s1', 'CLOSED')
    })

    it('rejects an unknown status', async () => {
      await expect(controller.setSupportMessageStatus('s1', { status: 'INBOX' })).rejects.toThrow(BadRequestException)
    })
  })
})
