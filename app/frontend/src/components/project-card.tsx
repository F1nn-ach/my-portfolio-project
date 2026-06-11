import Link from 'next/link'

interface ProjectCardProps {
  id: string
  title: string
  description: string
  tech: string[]
  demoUrl?: string
}

export default function ProjectCard({ id, title, description, tech, demoUrl = "#" }: ProjectCardProps) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-[#040816]/20 hover:bg-[#040816]/40 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/projects/${id}`} className="focus:outline-none flex-1 block">
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-pink-400 transition-colors">
              {title}
            </h3>
          </Link>
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="focus:outline-none shrink-0"
            title="Open Live Demo"
          >
            <svg className="w-5 h-5 text-slate-500 hover:text-pink-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        <Link href={`/projects/${id}`} className="block focus:outline-none">
          <p className="text-sm text-slate-400 leading-relaxed hover:text-slate-300 transition-colors line-clamp-3">
            {description}
          </p>
        </Link>
      </div>
      <div className="flex flex-wrap gap-2 pt-6">
        {tech.map((t, idx) => (
          <span key={idx} className="rounded-md bg-sky-500/5 px-2 py-1 text-xs font-medium text-sky-300 border border-sky-500/10">
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

