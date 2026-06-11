import type { User } from '@supabase/supabase-js'
import { logout } from '@/app/actions'
import Link from 'next/link'

interface AdminBarProps {
  user: User
}

export default function AdminBar({ user }: AdminBarProps) {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-pink-500/20 bg-[#040816]/70 backdrop-blur-md px-6 py-2">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            <span>Admin Session Active: <strong className="text-white">{user.email}</strong></span>
          </div>
          <Link href="/admin" className="text-pink-400 hover:text-pink-300 hover:underline">
            Go to Dashboard &rarr;
          </Link>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-xs font-semibold text-pink-300 transition-all hover:bg-pink-500/20 hover:text-white active:scale-95"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
