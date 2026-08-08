import { UserService } from '../../src/user/user.service'
import { BadRequestException } from '@nestjs/common'

describe('UserService', () => {
  const user = { findUnique: jest.fn(), update: jest.fn() }
  const prisma = { user } as any
  const service = new UserService(prisma)

  afterEach(() => jest.clearAllMocks())

  describe('updateMe location', () => {
    it('stores a valid address and coordinates', async () => {
      user.update.mockResolvedValue({ id: 'u1' })
      await service.updateMe('u1', { address: '12 Adeola Odeku, VI', latitude: 6.4281, longitude: 3.4219 })
      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.objectContaining({
            address: '12 Adeola Odeku, VI',
            latitude: 6.4281,
            longitude: 3.4219,
          }),
        }),
      )
    })

    it('coerces string coordinates to numbers', async () => {
      user.update.mockResolvedValue({ id: 'u1' })
      await service.updateMe('u1', { latitude: '6.4281', longitude: '3.4219' })
      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ latitude: 6.4281, longitude: 3.4219 }) }),
      )
    })

    it('rejects a latitude out of range', async () => {
      await expect(service.updateMe('u1', { latitude: 120, longitude: 3.4 })).rejects.toThrow(BadRequestException)
      expect(user.update).not.toHaveBeenCalled()
    })

    it('rejects a longitude out of range', async () => {
      await expect(service.updateMe('u1', { latitude: 6.4, longitude: 200 })).rejects.toThrow(BadRequestException)
      expect(user.update).not.toHaveBeenCalled()
    })

    it('rejects non-numeric coordinates', async () => {
      await expect(service.updateMe('u1', { latitude: 'abc', longitude: 3.4 })).rejects.toThrow(BadRequestException)
    })

    it('updates profile fields without touching coordinates when not provided', async () => {
      user.update.mockResolvedValue({ id: 'u1' })
      await service.updateMe('u1', { name: 'New Name', city: 'Lagos' })
      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'New Name', city: 'Lagos', latitude: undefined, longitude: undefined }) }),
      )
    })
  })
})
