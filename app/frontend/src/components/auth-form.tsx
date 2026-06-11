'use client'

import { useActionState, startTransition } from 'react'
import { login } from '@/app/actions'

export default function AuthForm() {
  // React 19 useActionState hook for login
  const [loginState, loginAction, isLoginPending] = useActionState(login, null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => {
      loginAction(formData)
    })
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-slate-100 p-4 font-sans">
      {/* Background radial glow effects (Dark Blue Sky & Pink) */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/5 bg-[#040816]/40 backdrop-blur-xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-all duration-300">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 to-sky-500 text-white font-bold text-xl shadow-lg shadow-pink-500/15 mb-4">
            Ω
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sign in to access your portfolio dashboard
          </p>
        </div>

        {/* Alerts */}
        {loginState?.error && (
          <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{loginState.error}</span>
          </div>
        )}

        {loginState?.success && (
          <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{loginState.success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="admin@example.com"
              className="w-full rounded-lg border border-white/10 bg-white/[0.01] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-pink-500/50 focus:bg-white/[0.03] focus:ring-1 focus:ring-pink-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-white/[0.01] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-pink-500/50 focus:bg-white/[0.03] focus:ring-1 focus:ring-pink-500/30"
            />
          </div>

          <button
            type="submit"
            disabled={isLoginPending}
            className="w-full relative overflow-hidden rounded-lg bg-gradient-to-r from-pink-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/10 transition-all duration-200 hover:opacity-95 hover:shadow-pink-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoginPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Logging in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
