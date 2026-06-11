import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import AdminBar from '@/components/admin-bar'
import ProjectList from '@/components/project-list'
import TechStack from '@/components/tech-stack'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile server-side from Go backend (supporting fallback to default profile)
  let profile = {
    name: "F1nn-ach",
    bio: "I build high-performance backend systems with Go and design pixel-perfect, responsive web interfaces using Next.js.",
    skills: ["Go (Golang)", "React / Next.js", "Docker & Compose", "PostgreSQL", "TypeScript", "Tailwind CSS"],
    avatarUrl: "",
    documents: [] as { name: string; url: string }[]
  }

  const apiHost = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  try {
    const res = await fetch(`${apiHost}/profile`, { next: { revalidate: 10 } })
    if (res.ok) {
      const data = await res.json()
      if (data) {
        profile = { ...profile, ...data }
      }
    }
  } catch (err) {
    console.error('Failed to fetch profile server-side:', err)
  }

  // Extract resumes dynamically from new profile documents array
  const resumeTh = profile.documents?.find(doc => doc.name.toLowerCase().includes('thai') || doc.name.toLowerCase().includes('th'))
  const resumeEn = profile.documents?.find(doc => doc.name.toLowerCase().includes('english') || doc.name.toLowerCase().includes('en'))
  const resumeGen = profile.documents?.find(doc => doc.name.toLowerCase().includes('resume'))

  return (
    <div className="relative min-h-screen bg-black text-slate-100 font-sans selection:bg-pink-500/30 selection:text-white">
      {/* Ambient backgrounds (Dark Blue Sky & Pink Accent) */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-sky-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Admin Control Bar (Visible only to logged-in user) */}
      {user && <AdminBar user={user} />}

      {/* Navigation */}
      <header className="w-full px-6 py-6 border-b border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt={profile.name} 
                className="w-8 h-8 rounded-full object-cover border border-pink-500/20 group-hover:border-pink-500/40 transition-colors shadow-md shadow-pink-500/5"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-sky-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                {profile.name[0]}
              </div>
            )}
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-pink-400 to-sky-400 bg-clip-text text-transparent group-hover:opacity-95 transition-opacity">
              Ω {profile.name}
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-400">
            <a href="#projects" className="transition-colors hover:text-pink-400">Projects</a>
            <a href="#skills" className="transition-colors hover:text-pink-400">Skills</a>
            <Link href="/profile" className="transition-colors hover:text-pink-400">Profile</Link>
            {resumeTh && (
              <a href={resumeTh.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-pink-400">Resume (TH)</a>
            )}
            {resumeEn && (
              <a href={resumeEn.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-pink-400">Resume (EN)</a>
            )}
            {!resumeTh && !resumeEn && resumeGen && (
              <a href={resumeGen.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-pink-400">Resume</a>
            )}
            <a href="#contact" className="transition-colors hover:text-pink-400">Contact</a>
          </nav>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24 space-y-32">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/5 px-4 py-1.5 text-xs font-semibold text-pink-300 backdrop-blur-md">
            <span>Open for collaborations</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-sky-100 to-pink-200 bg-clip-text text-transparent">
            Crafting Scalable & Minimal Digital Experiences
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
            Hi, I&apos;m <strong className="text-pink-400">{profile.name}</strong>. {profile.bio}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#projects"
              className="rounded-lg bg-gradient-to-r from-pink-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/10 transition-all hover:shadow-pink-500/25 hover:opacity-95 active:scale-98"
            >
              View My Work
            </a>
            <Link
              href="/profile"
              className="rounded-lg border border-pink-500/20 bg-pink-500/5 px-6 py-3 text-sm font-semibold text-pink-300 transition-all hover:bg-pink-500/10 hover:text-white active:scale-98"
            >
              View Profile & Resume
            </Link>
            <a
              href="#contact"
              className="rounded-lg border border-white/10 bg-white/[0.01] px-6 py-3 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.04] hover:text-white active:scale-98"
            >
              Get in Touch
            </a>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="space-y-10">
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Featured Projects
            </h2>
            <p className="text-sm text-slate-400">
              A curated selection of engineering and UI tasks I&apos;ve completed.
            </p>
          </div>

          <ProjectList />
        </section>

        {/* Skills Section */}
        <section id="skills" className="space-y-10">
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Technical Stack
            </h2>
            <p className="text-sm text-slate-400">
              Languages, frameworks, and tools I use in my development workflow.
            </p>
          </div>

          <TechStack skills={profile.skills || []} />
        </section>

        {/* Contact Section */}
        <section id="contact" className="max-w-3xl mx-auto rounded-2xl border border-pink-500/10 bg-[#040816]/20 backdrop-blur-xl p-8 sm:p-10 shadow-lg text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Let&apos;s Build Something Together
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            I&apos;m currently open to freelance opportunities, full-time positions, or open-source collaborations. Drop me a line and let&apos;s start chatting!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="mailto:contact@example.com"
              className="w-full sm:w-auto rounded-lg bg-pink-500 hover:bg-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors"
            >
              Email Me
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.01] px-6 py-3 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.04] hover:text-white"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub Profile
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-8 border-t border-white/5 mt-20 bg-black/40 text-center space-y-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} F1nn-ach. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/profile" className="transition-colors hover:text-pink-400">Profile</Link>
            {resumeTh && (
              <a href={resumeTh.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-pink-400">Resume (TH)</a>
            )}
            {resumeEn && (
              <a href={resumeEn.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-pink-400">Resume (EN)</a>
            )}
            {!resumeTh && !resumeEn && resumeGen && (
              <a href={resumeGen.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-pink-400">Resume</a>
            )}
            <Link href="/login" className="transition-colors hover:text-pink-400">
              {user ? "Admin Panel" : "Admin Login"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
