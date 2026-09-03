import { ArtisanController } from '../../src/artisan/artisan.controller'
import { BadRequestException } from '@nestjs/common'

describe('ArtisanController', () => {
  const artisanService = { updateMe: jest.fn() } as any
  const controller = new ArtisanController(artisanService)

  afterEach(() => jest.clearAllMocks())

  describe('updateMe', () => {
    it('delegates a valid profile body to the service', async () => {
      artisanService.updateMe.mockResolvedValue({ id: 'p1' })
      await expect(
        controller.updateMe({ user: { id: 'u1' } }, { profession: 'Electrician', hourlyRate: 5000, available: true }),
      ).resolves.toEqual({ data: { id: 'p1' } })
      expect(artisanService.updateMe).toHaveBeenCalledWith('u1', {
        profession: 'Electrician',
        hourlyRate: 5000,
        available: true,
      })
    })

    it('rejects a negative hourlyRate', async () => {
      await expect(controller.updateMe({ user: { id: 'u1' } }, { hourlyRate: -5 })).rejects.toThrow(BadRequestException)
      expect(artisanService.updateMe).not.toHaveBeenCalled()
    })

    it('rejects a fractional hourlyRate', async () => {
      await expect(controller.updateMe({ user: { id: 'u1' } }, { hourlyRate: 50.5 })).rejects.toThrow(
        BadRequestException,
      )
    })

    it('rejects a too-short profession', async () => {
      await expect(controller.updateMe({ user: { id: 'u1' } }, { profession: 'X' })).rejects.toThrow(BadRequestException)
    })

    it('rejects an unknown key (strict schema)', async () => {
      await expect(controller.updateMe({ user: { id: 'u1' } }, { promoCode: 'SAVE' })).rejects.toThrow(
        BadRequestException,
      )
      expect(artisanService.updateMe).not.toHaveBeenCalled()
    })

    it('accepts an empty object (partial update)', async () => {
      artisanService.updateMe.mockResolvedValue({ id: 'p1' })
      await expect(controller.updateMe({ user: { id: 'u1' } }, {})).resolves.toEqual({ data: { id: 'p1' } })
      expect(artisanService.updateMe).toHaveBeenCalledWith('u1', {})
    })
  })
})
