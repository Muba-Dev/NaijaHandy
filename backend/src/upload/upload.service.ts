import { Injectable, BadRequestException, ServiceUnavailableException, Logger } from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name)

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })
    }
  }

  async uploadAvatar(dataUrl: string): Promise<string> {
    return this.uploadImage(dataUrl, 'naijahandy/avatars', [{ width: 400, height: 400, crop: 'fill' }], 'avatar')
  }

  async uploadCover(dataUrl: string): Promise<string> {
    return this.uploadImage(dataUrl, 'naijahandy/covers', [{ width: 1200, height: 400, crop: 'fill' }], 'cover image')
  }

  async uploadPortfolio(dataUrl: string): Promise<string> {
    return this.uploadImage(dataUrl, 'naijahandy/portfolio', [{ width: 1200, height: 900, crop: 'fill' }], 'portfolio image')
  }

  async uploadVerificationDocument(dataUrl: string): Promise<string> {
    return this.uploadImage(dataUrl, 'naijahandy/verification', [], 'verification document')
  }

  private async uploadImage(dataUrl: string, folder: string, transformation: Record<string, unknown>[], label: string): Promise<string> {
    const { mime, buffer } = this.parseDataUrl(dataUrl)

    if (!mime || !ALLOWED_MIMES.includes(mime)) {
      throw new BadRequestException('Only JPG, PNG, WebP and GIF images are supported')
    }
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image is too large. Maximum size is 4MB')
    }

    const configured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    if (!configured) {
      this.logger.warn(`Cloudinary is not configured — storing ${label} as a data URL (dev fallback)`)
      return dataUrl
    }

    try {
      const result = await cloudinary.uploader.upload(dataUrl, {
        folder,
        transformation,
      })
      return result.secure_url
    } catch (err: any) {
      this.logger.error(`Cloudinary upload failed (${label})`, err?.stack)
      throw new ServiceUnavailableException('Image upload failed. Please try again.')
    }
  }

  private parseDataUrl(dataUrl: string): { mime: string | null; buffer: Buffer } {
    const match = typeof dataUrl === 'string' ? dataUrl.match(/^data:([^;]+);base64,(.+)$/) : null
    if (!match) {
      throw new BadRequestException('Invalid image payload')
    }
    return { mime: match[1], buffer: Buffer.from(match[2], 'base64') }
  }
}
