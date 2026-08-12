import { HelpService } from '../../src/support/help.service'
import { ServiceUnavailableException } from '@nestjs/common'

jest.mock('../../src/support/llm', () => ({
  embedTexts: jest.fn(),
  isLlmConfigured: jest.fn(),
}))

import { embedTexts, isLlmConfigured } from '../../src/support/llm'

const mockEmbed = embedTexts as jest.Mock
const mockIsLlmConfigured = isLlmConfigured as jest.Mock

describe('HelpService', () => {
  const helpArticle = { findMany: jest.fn() }
  const prisma = { helpArticle, $queryRaw: jest.fn(), $executeRaw: jest.fn() } as any
  const service = new HelpService(prisma)

  beforeEach(() => {
    jest.clearAllMocks()
    mockIsLlmConfigured.mockReturnValue(true)
    mockEmbed.mockResolvedValue([[0.1, 0.2, 0.3]])
  })

  it('groups articles by category in the canonical category order', async () => {
    helpArticle.findMany.mockResolvedValue([
      { id: 'a1', slug: 'x', category: 'For artisans', title: 'T', content: 'C', order: 1 },
      { id: 'a2', slug: 'y', category: 'Getting started', title: 'T', content: 'C', order: 1 },
      { id: 'a3', slug: 'z', category: 'Trust & safety', title: 'T', content: 'C', order: 1 },
      { id: 'a4', slug: 'w', category: 'Booking & payments', title: 'T', content: 'C', order: 1 },
      { id: 'a5', slug: 'v', category: 'Disputes & guarantee', title: 'T', content: 'C', order: 1 },
    ])
    const result = await service.listArticles()
    expect(result.map((g) => g.category)).toEqual([
      'Getting started',
      'Booking & payments',
      'Trust & safety',
      'Disputes & guarantee',
      'For artisans',
    ])
    expect(result.map((g) => g.items.map((i) => i.slug))).toEqual([['y'], ['w'], ['z'], ['v'], ['x']])
  })

  it('includes unknown categories after the known ones', async () => {
    helpArticle.findMany.mockResolvedValue([
      { id: 'a1', slug: 'x', category: 'Mystery', title: 'T', content: 'C', order: 1 },
    ])
    const result = await service.listArticles()
    expect(result[result.length - 1].category).toBe('Mystery')
  })

  it('refuses to embed without an OpenAI key', async () => {
    mockIsLlmConfigured.mockReturnValue(false)
    await expect(service.embedMissing()).rejects.toThrow(ServiceUnavailableException)
  })

  it('embeds only articles missing an embedding', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { id: 'a1', title: 'How do I book?', content: 'Search for an artisan.' },
      { id: 'a2', title: 'Payments', content: 'Paystack handles checkout.' },
    ])
    const count = await service.embedMissing()
    expect(count).toBe(2)
    expect(mockEmbed).toHaveBeenCalledWith(['How do I book?\nSearch for an artisan.'])
    expect(mockEmbed).toHaveBeenCalledWith(['Payments\nPaystack handles checkout.'])
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(2)
    const [strings, literal, id] = prisma.$executeRaw.mock.calls[0]
    expect(strings.join('_')).toContain('UPDATE "help_articles" SET "embedding"')
    expect(strings.join('_')).toContain('::vector')
    expect(literal).toBe('[0.1,0.2,0.3]')
    expect(id).toBe('a1')
  })

  it('returns 0 when every article is already embedded', async () => {
    prisma.$queryRaw.mockResolvedValue([])
    expect(await service.embedMissing()).toBe(0)
    expect(mockEmbed).not.toHaveBeenCalled()
  })
})
