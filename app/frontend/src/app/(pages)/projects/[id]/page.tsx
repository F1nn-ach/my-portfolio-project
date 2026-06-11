'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { getStoredProjects, Project } from '@/utils/use-projects'

interface PageProps {
  params: Promise<{ id: string }>
}

function getEmbedUrl(url: string): { embedUrl: string; type: 'youtube' | 'vimeo' | 'raw' | 'none' } {
  if (!url) return { embedUrl: '', type: 'none' }

  // Check YouTube
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const ytMatch = url.match(ytRegex)
  if (ytMatch && ytMatch[1]) {
    return { embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`, type: 'youtube' }
  }

  // Check Vimeo
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/
  const vimeoMatch = url.match(vimeoRegex)
  if (vimeoMatch && vimeoMatch[1]) {
    return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, type: 'vimeo' }
  }

  // Check raw video formats
  if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
    return { embedUrl: url, type: 'raw' }
  }

  // Fallback to iframe if it contains embed
  if (url.includes('/embed')) {
    return { embedUrl: url, type: 'youtube' }
  }

  // If it starts with http and looks like a general link, let's treat it as a raw video URL fallback or raw video tag
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return { embedUrl: url, type: 'raw' }
  }

  return { embedUrl: '', type: 'none' }
}

export default function ProjectDetailsPage({ params }: PageProps) {
  const { id } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function loadProject() {
      // 1. Check if user is logged in (admin)
      let loggedIn = false
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        loggedIn = !!user
        setIsAdmin(loggedIn)
      } catch (err) {
        console.error('Failed to check user auth:', err)
      }

      // 2. Fetch project details
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      let foundProj: Project | null = null
      try {
        const res = await fetch(`${apiHost}/projects/${id}`)
        if (res.ok) {
          foundProj = await res.json()
        }
      } catch (err) {
        console.error("Failed to fetch project details from API, using fallback:", err)
      }

      if (!foundProj) {
        // Fallback
        const list = getStoredProjects()
        const found = list.find(p => p.id === id)
        if (found) {
          foundProj = found
        }
      }

      // 3. Enforce visibility rules
      if (foundProj && foundProj.isVisible === false && !loggedIn) {
        setProject(null)
      } else {
        setProject(foundProj)
      }
      setIsLoaded(true)
    }
    loadProject()
  }, [id])

  if (!isLoaded) {
    return (
      <div className="relative min-h-screen bg-black text-slate-100 font-sans flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="h-12 w-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-medium">Loading project showcase...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="relative min-h-screen bg-black text-slate-100 font-sans flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />
        <h1 className="text-3xl font-bold tracking-tight text-white">Project Not Found</h1>
        <p className="text-slate-400 max-w-md">
          The project showcase you are looking for does not exist or has been deleted from your local workspace.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-gradient-to-r from-pink-500 to-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all"
        >
          Return to Portfolio
        </Link>
      </div>
    )
  }

  const { embedUrl, type } = getEmbedUrl(project.videoUrl)

  return (
    <div className="relative min-h-screen bg-black text-slate-100 font-sans selection:bg-pink-500/30 selection:text-white pb-24">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full px-6 py-6 border-b border-white/5 bg-black/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-pink-400 to-sky-400 bg-clip-text text-transparent flex items-center gap-2">
            <span>&larr;</span>
            <span className="text-slate-300 hover:text-white transition-colors">Back to Portfolio</span>
          </Link>
          <div className="flex items-center gap-2">
            {project.isVisible === false && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-rose-500/10 text-rose-400 border-rose-500/20">
                Hidden
              </span>
            )}
            <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${
              project.status === "Active" ? "bg-pink-500/10 text-pink-400 border-pink-500/10" : "bg-slate-500/10 text-slate-400 border-white/5"
            }`}>
              {project.status || "Active"}
            </span>
          </div>
        </div>
      </header>

      {/* Showcase Container */}
      <main className="mx-auto max-w-4xl px-6 pt-12 sm:pt-16 space-y-10">
        
        {/* Title & Tech stack */}
        <section className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {project.title}
          </h1>
          <div className="flex flex-wrap gap-2 pt-2">
            {project.tech.map((tag, idx) => (
              <span key={idx} className="rounded-lg bg-sky-500/5 px-3 py-1.5 text-xs font-semibold text-sky-300 border border-sky-500/10">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Video Tutorial Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            Video Tutorial & Demo Walkthrough
          </h2>

          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#040816]/40 shadow-2xl backdrop-blur-md">
            {type === 'youtube' || type === 'vimeo' ? (
              <iframe
                src={embedUrl}
                title={`${project.title} Video Showcase`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : type === 'raw' ? (
              <video
                src={embedUrl}
                controls
                className="absolute inset-0 h-full w-full object-cover"
                poster="/placeholder.png"
              />
            ) : (
              /* Premium Mock Tutorial Player when videoUrl is empty/invalid */
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-6 bg-gradient-to-br from-[#060b21] via-black to-[#05060f]">
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
                <div className="relative h-16 w-16 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 group cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg shadow-pink-500/5">
                  <span className="absolute inset-0 rounded-full bg-pink-500/10 animate-ping" />
                  <svg className="w-6 h-6 ml-0.5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="space-y-2 relative max-w-md">
                  <h3 className="text-sm font-bold text-slate-200">Interactive Walkthrough Offline</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    No custom video walkthrough has been registered for <span className="text-pink-400 font-semibold">{project.title}</span>. 
                    You can edit the project details in the Admin Dashboard to add a video URL, or proceed directly to the live demo.
                  </p>
                </div>
                {/* Simulated editor code mockup */}
                <div className="w-64 rounded border border-white/5 bg-black/40 p-2 font-mono text-[9px] text-slate-600 text-left space-y-1 opacity-70">
                  <p><span className="text-pink-500">const</span> project = <span className="text-sky-400">getProject</span>(<span className="text-emerald-500">&apos;{project.id}&apos;</span>)</p>
                  <p><span className="text-slate-500">{"// video_url is empty. showing mockup framework..."}</span></p>
                  <p>console.<span className="text-yellow-500">log</span>(project.<span className="text-sky-400">title</span>) <span className="text-slate-500">{"// \"" + project.title + "\""}</span></p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Project Description & Demo Action */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {/* Description */}
          <div className="md:col-span-2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-200">Project Description</h2>
              <div className="text-slate-400 leading-relaxed text-sm whitespace-pre-wrap">
                {project.description}
              </div>
            </div>

            {/* Project Related Documents */}
            {project.documents && project.documents.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-white/5">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Related Documents
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-pink-500/10 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:bg-pink-500/20 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold text-slate-300 group-hover:text-white truncate block">
                        {doc.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar CTA Panel */}
          <div className="rounded-2xl border border-white/5 bg-[#040816]/30 p-6 space-y-6 flex flex-col justify-between h-fit backdrop-blur-sm">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 font-mono block">Showcase Launchpad</span>
              <h3 className="text-md font-bold text-slate-200">Ready to test?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click below to launch the live deployment of this project in a new tab.
              </p>
            </div>
            
            <a
              href={project.demoUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center rounded-xl bg-gradient-to-r from-pink-500 to-sky-500 hover:opacity-95 active:scale-98 text-sm font-bold text-white py-3 shadow-lg shadow-pink-500/10 hover:shadow-pink-500/20 transition-all block cursor-pointer"
            >
              Launch Live Demo
            </a>
          </div>
        </section>

      </main>
    </div>
  )
}
