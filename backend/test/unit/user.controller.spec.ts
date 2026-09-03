import { UserController } from '../../src/user/user.controller'
import { BadRequestException } from '@nestjs/common'

describe('UserController', () => {
  const userService = {
    findMe: jest.fn(),
    updateMe: jest.fn(),
  } as any
  const uploadService = { uploadAvatar: jest.fn() } as any
  const controller = new UserController(userService, uploadService)

  afterEach(() => jest.clearAllMocks())

  describe('updateMe', () => {
    it('delegates a valid profile body to the service', async () => {
      userService.updateMe.mockResolvedValue({ id: 'u1' })
      const req = { user: { id: 'u1' } }
      await expect(
        controller.updateMe(req, { name: 'Vera', city: 'Lagos', latitude: 6.45, longitude: 3.4 }),
      ).resolves.toEqual({ data: { id: 'u1' } })
      expect(userService.updateMe).toHaveBeenCalledWith('u1', {
        name: 'Vera',
        city: 'Lagos',
        latitude: 6.45,
        longitude: 3.4,
      })
    })

    it('rejects an out-of-range latitude', async () => {
      await expect(controller.updateMe({ user: { id: 'u1' } }, { latitude: 999 })).rejects.toThrow(BadRequestException)
      expect(userService.updateMe).not.toHaveBeenCalled()
    })

    it('rejects an out-of-range longitude', async () => {
      await expect(controller.updateMe({ user: { id: 'u1' } }, { longitude: 999 })).rejects.toThrow(BadRequestException)
    })

    it('rejects an unknown key (strict schema)', async () => {
      await expect(controller.updateMe({ user: { id: 'u1' } }, { hacks: true })).rejects.toThrow(BadRequestException)
      expect(userService.updateMe).not.toHaveBeenCalled()
    })

    it('rejects a too-long name', async () => {
      await expect(controller.updateMe({ user: { id: 'u1' } }, { name: 'x'.repeat(200) })).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('updateAvatar', () => {
    it('uploads and persists the new avatar', async () => {
      uploadService.uploadAvatar.mockResolvedValue('https://img.example/a.png')
      userService.updateMe.mockResolvedValue({ id: 'u1', avatar: 'https://img.example/a.png' })
      const result = await controller.updateAvatar({ user: { id: 'u1' } }, { image: 'data:image/png;base64,xxx' })
      expect(uploadService.uploadAvatar).toHaveBeenCalledWith('data:image/png;base64,xxx')
      expect(userService.updateMe).toHaveBeenCalledWith('u1', { avatar: 'https://img.example/a.png' })
      expect(result).toEqual({ data: { id: 'u1', avatar: 'https://img.example/a.png' } })
    })
  })
})
