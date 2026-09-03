import Image from 'next/image'
import { ImagePlus, Trash2, Loader2 } from 'lucide-react'
import Alert from '@/components/ui/Alert'
import type { PortfolioItem } from '@/types'

interface PortfolioSectionProps {
  portfolio: PortfolioItem[]
  portfolioCaption: string
  portfolioStatus: 'idle' | 'uploading' | 'saved' | 'error'
  portfolioError: string
  portfolioInputRef: React.RefObject<HTMLInputElement | null>
  deletingId: string | null
  onCaptionChange: (value: string) => void
  onPortfolioFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDeletePortfolio: (item: PortfolioItem) => void
}

export default function PortfolioSection({ portfolio, portfolioCaption, portfolioStatus, portfolioError, portfolioInputRef, deletingId, onCaptionChange, onPortfolioFile, onDeletePortfolio }: PortfolioSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <h2 className="font-semibold text-gray-900">Portfolio</h2>
        <p className="text-xs text-gray-500">Showcase your best work</p>
      </div>

      {portfolio.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {portfolio.map((item) => (
            <div key={item.id} className="group relative rounded-xl overflow-hidden bg-gray-100">
              <Image src={item.imageUrl} alt={item.caption || 'Portfolio photo'} width={400} height={300} className="w-full h-32 md:h-36 object-cover" />
              {item.caption && (
                <p className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs px-3 py-1.5">{item.caption}</p>
              )}
              <button
                type="button"
                onClick={() => onDeletePortfolio(item)}
                disabled={deletingId === item.id}
                aria-label={`Delete portfolio photo${item.caption ? `: ${item.caption}` : ''}`}
                className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deletingId === item.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm mt-2">No portfolio photos yet. Add your first photo below.</p>
      )}

      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Add a photo</p>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label htmlFor="portfolio-caption" className="block text-xs font-medium text-gray-500 mb-1">Caption (optional)</label>
            <input
              id="portfolio-caption"
              value={portfolioCaption}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="e.g. Kitchen repaint in Ikeja"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#047857] transition-colors"
            />
          </div>
          <input
            ref={portfolioInputRef}
            id="portfolio-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={onPortfolioFile}
          />
          <label
            htmlFor="portfolio-upload"
            aria-disabled={portfolioStatus === 'uploading'}
            className="inline-flex items-center gap-2 shrink-0 cursor-pointer text-sm font-medium px-4 py-2.5 rounded-xl bg-[#047857] text-white hover:opacity-90 transition-opacity aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
          >
            {portfolioStatus === 'uploading' ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={15} aria-hidden="true" />}
            {portfolioStatus === 'uploading' ? 'Uploading…' : 'Upload Photo'}
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">JPG, PNG, WebP or GIF. Maximum 4MB.</p>
        {portfolioStatus === 'saved' && (
          <Alert className="mt-3">Photo added to your portfolio.</Alert>
        )}
        {portfolioStatus === 'error' && portfolioError && (
          <Alert variant="error" className="mt-3">{portfolioError}</Alert>
        )}
      </div>
    </div>
  )
}
