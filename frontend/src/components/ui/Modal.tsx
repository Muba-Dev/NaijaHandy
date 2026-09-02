import { X } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/utils'

export default function Modal({
  title,
  onClose,
  hideClose = false,
  icon,
  children,
  shadow = false,
}: {
  title: string
  onClose?: () => void
  hideClose?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
  shadow?: boolean
}) {
  const titleId = useId()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn('absolute inset-0', hideClose ? 'bg-gray-900/50 backdrop-blur-sm' : 'bg-black/40')}
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn('relative bg-white rounded-2xl max-w-md w-full p-6', shadow && 'shadow-2xl')}
        onClick={(e) => e.stopPropagation()}
      >
        {icon ? <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center text-red-600 mb-4">{icon}</div> : null}
        <div className="flex items-start justify-between mb-4">
          <h2 id={titleId} className="font-display text-lg font-bold text-gray-900">
            {title}
          </h2>
          {!hideClose ? (
            <button onClick={onClose} aria-label="Close dialog" className="p-2 -m-1 text-gray-500 hover:text-gray-700">
              <X size={18} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
}