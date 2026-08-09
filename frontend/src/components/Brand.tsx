import Image from 'next/image'
import Link from 'next/link'

export default function Brand({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="NaijaHandy home">
      <Image src="/naijahandy-mark.svg" alt="" width={compact ? 32 : 36} height={compact ? 32 : 36} priority />
      <span
        className={`${compact ? 'text-lg' : 'text-xl'} font-display font-bold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}
      >
        Naija<span className={dark ? 'text-emerald-400' : 'text-[#047857]'}>Handy</span>
      </span>
    </Link>
  )
}