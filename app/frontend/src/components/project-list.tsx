'use client'

import { useProjects } from '@/utils/use-projects'
import ProjectCard from './project-card'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function ProjectList() {
  const { projects, isLoaded } = useProjects()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAdmin(!!user)
    }
    checkUser()
  }, [])

  if (!isLoaded) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="animate-pulse rounded-2xl border border-white/5 bg-[#040816]/20 p-6 h-56 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-6 bg-slate-800 rounded w-2/3" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-800 rounded w-full" />
                <div className="h-4 bg-slate-800 rounded w-5/6" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-5 bg-slate-800 rounded w-12" />
              <div className="h-5 bg-slate-800 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const visibleProjects = isAdmin ? projects : projects.filter(p => p.isVisible !== false)

  if (visibleProjects.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-[#040816]/10">
        <p className="text-slate-400 text-sm">No projects found. Add one from the admin panel!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {visibleProjects.map((project) => (
        <div key={project.id} className="relative group">
          <ProjectCard
            id={project.id}
            title={project.title}
            description={project.description}
            tech={project.tech}
            demoUrl={project.demoUrl}
          />
          {isAdmin && project.isVisible === false && (
            <span className="absolute top-4 right-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-mono px-2 py-0.5 rounded-full select-none">
              Hidden
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
