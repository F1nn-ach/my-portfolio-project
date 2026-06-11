'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProfile, GalleryItem } from '@/utils/use-profile'

export default function ProfilePage() {
  const { profile, isLoaded } = useProfile()
  const [selectedTag, setSelectedTag] = useState<string>('All')
  const [expandedImage, setExpandedImage] = useState<GalleryItem | null>(null)

  if (!isLoaded || !profile) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading developer profile...</span>
        </div>
      </div>
    )
  }

  // Get all unique tags from gallery
  const allTags = ['All', ...Array.from(new Set(profile.gallery?.flatMap(item => item.tags || []) || []))]

  // Filtered gallery items
  const filteredGallery = selectedTag === 'All'
    ? profile.gallery || []
    : (profile.gallery || []).filter(item => item.tags?.includes(selectedTag))

  return (
    <div className="relative min-h-screen bg-black text-slate-100 font-sans selection:bg-pink-500/30 selection:text-white pb-24">
      {/* Ambient background blur */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full px-6 py-6 border-b border-white/5 bg-black/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-9 h-9 rounded-full object-cover border border-pink-500/30 group-hover:border-pink-500/60 transition-colors shadow-md shadow-pink-500/5"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {profile.name[0]}
              </div>
            )}
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-pink-400 to-sky-400 bg-clip-text text-transparent group-hover:opacity-95 transition-opacity">
              Ω {profile.name}
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-400">
            <Link href="/" className="transition-colors hover:text-pink-400">
              Home
            </Link>
            <Link href="/#projects" className="transition-colors hover:text-pink-400">
              Projects
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Split Layout */}
      <main className="mx-auto max-w-6xl px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column (1/3): Profile details, picture, bio, skills */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#040816]/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
              {/* Profile Avatar */}
              <div className="relative mb-6">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover border-2 border-pink-500/20 shadow-xl shadow-pink-500/5"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-tr from-pink-500 to-sky-500 flex items-center justify-center text-white font-bold text-4xl shadow-xl">
                    {profile.name[0]}
                  </div>
                )}
              </div>

              {/* Name & Title */}
              <div className="space-y-1 w-full">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white truncate" title={profile.name}>
                  {profile.name}
                </h1>
              </div>

              {/* Bio */}
              <p className="text-slate-400 text-sm leading-relaxed mt-4 text-justify hyphens-auto w-full">
                {profile.bio || "No bio description written yet."}
              </p>

              {/* Skills Tags */}
              <div className="border-t border-white/5 pt-6 mt-6 w-full text-left space-y-2">
                <h3 className="text-xs font-bold text-slate-400 font-mono">CORE TECH STACK</h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {profile.skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-sky-500/5 px-2 py-0.5 text-[10px] font-semibold text-sky-300 border border-sky-500/10"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (2/3): Documents & Categorized Gallery */}
          <div className="lg:col-span-2 space-y-8">

            {/* Section 1: Profile Documents (Right Side) */}
            <section className="rounded-3xl border border-white/5 bg-[#040816]/10 backdrop-blur-xl p-6 shadow-2xl space-y-4">
              <h2 className="text-md font-bold text-slate-200 flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Profile Documents
              </h2>

              {!profile.documents || profile.documents.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">No documents have been uploaded to this profile yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.documents.map((doc) => {
                    const isPdf = doc.url.toLowerCase().endsWith('.pdf')
                    return (
                      <div
                        key={doc.id}
                        className="group flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-pink-500/10 transition-all shadow-md"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-sky-500/10 text-sky-400 border border-sky-500/10'
                            }`}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-200 truncate block group-hover:text-white transition-colors">
                              {doc.name}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono truncate block" title={doc.url.split('/').pop()}>
                              {doc.url.split('/').pop()}
                            </span>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-white/10 bg-white/[0.01] hover:bg-white/[0.06] hover:border-pink-500/20 px-3 py-1.5 text-[10px] font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                        >
                          Download
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Section 2: Categorized Gallery */}
            <section className="rounded-3xl border border-white/5 bg-[#040816]/10 backdrop-blur-xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <h2 className="text-md font-bold text-slate-200 flex items-center gap-2">
                  <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Categorized Gallery
                </h2>

                {/* Tag Pills */}
                {allTags.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-3 py-1 rounded-full text-[10px] font-medium border transition-all cursor-pointer ${selectedTag === tag
                          ? 'bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-500/10'
                          : 'border-white/10 bg-white/[0.01] text-slate-400 hover:text-slate-200 hover:border-white/20'
                          }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {filteredGallery.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-8 text-center">No images found in this category.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredGallery.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setExpandedImage(item)}
                      className="group cursor-pointer rounded-2xl border border-white/5 bg-[#040816]/10 overflow-hidden shadow-lg hover:shadow-2xl hover:border-pink-500/10 transition-all flex flex-col"
                    >
                      <div className="aspect-video relative overflow-hidden bg-black">
                        <img
                          src={item.imageUrl}
                          alt={item.caption || "Gallery item"}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="rounded-full bg-white/10 p-2 backdrop-blur-md text-white border border-white/10">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {item.caption || "No description provided."}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.tags?.map((tag, idx) => (
                            <span
                              key={idx}
                              className="rounded px-1.5 py-0.5 text-[8px] font-medium bg-sky-500/5 text-sky-400 border border-sky-500/10"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

        </div>
      </main>

      {/* Image Modal Preview */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-fadeIn"
          onClick={() => setExpandedImage(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 z-10 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 border border-white/10 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="md:flex-1 bg-black flex items-center justify-center overflow-hidden min-h-0 relative aspect-video md:aspect-auto">
              <img
                src={expandedImage.imageUrl}
                alt={expandedImage.caption || "Preview"}
                className="w-full h-full object-contain max-h-[45vh] md:max-h-[80vh]"
              />
            </div>

            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 bg-[#040816] p-6 flex flex-col justify-between shrink-0 space-y-4">
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-slate-500 block">
                  Uploaded: {new Date(expandedImage.createdAt).toLocaleDateString()}
                </span>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Description</h3>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {expandedImage.caption || "No description provided."}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {expandedImage.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-sky-500/5 px-2 py-0.5 text-[9px] font-medium text-sky-400 border border-sky-500/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
