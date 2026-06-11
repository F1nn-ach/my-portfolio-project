'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions'
import { useProfile } from '@/utils/use-profile'
import AdminProjectManager from '@/components/admin-project-manager'

interface AdminDashboardClientProps {
  userEmail: string
}

export default function AdminDashboardClient({ userEmail }: AdminDashboardClientProps) {
  const { 
    profile, 
    isLoaded, 
    isSaving, 
    updateProfile, 
    uploadProfilePicture, 
    addProfileDocument, 
    deleteProfileDocument, 
    addGalleryItem, 
    deleteGalleryItem 
  } = useProfile()
  
  // Tab states
  const [rightTab, setRightTab] = useState<'projects' | 'profile'>('projects')

  // Profile fields
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [uploading, setUploading] = useState(false)

  // Cropper states
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropZoom, setCropZoom] = useState(1.0)
  const [cropPan, setCropPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 300, height: 300 })

  useEffect(() => {
    if (!cropSrc) return
    const img = new Image()
    img.src = cropSrc
    img.onload = () => {
      const w = img.width
      const h = img.height
      const displayWidth = w > h ? (w * 300) / h : 300
      const displayHeight = h > w ? (h * 300) / w : 300
      setImageSize({ width: displayWidth, height: displayHeight })
    }
  }, [cropSrc])

  // Document fields
  const [docName, setDocName] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)

  // Gallery fields
  const [galleryFile, setGalleryFile] = useState<File | null>(null)
  const [galleryCaption, setGalleryCaption] = useState('')
  const [galleryTagsInput, setGalleryTagsInput] = useState('')

  // Sync profile data once loaded
  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setBio(profile.bio || '')
      setSkills(profile.skills || [])
    }
  }, [profile])

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    const skill = skillInput.trim()
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill])
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Name is required.')
      return
    }

    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        skills: skills
      })
      alert('Profile details updated successfully!')
    } catch (err) {
      console.error(err)
    }
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCropFile(file)
    setCropZoom(1.0)
    setCropPan({ x: 0, y: 0 })
    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Drag handlers for cropping preview
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cropSrc) return
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setPanStart({ x: cropPan.x, y: cropPan.y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    setCropPan({
      x: panStart.x + dx,
      y: panStart.y + dy
    })
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cropSrc || e.touches.length !== 1) return
    setIsDragging(true)
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    setPanStart({ x: cropPan.x, y: cropPan.y })
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - dragStart.x
    const dy = e.touches[0].clientY - dragStart.y
    setCropPan({
      x: panStart.x + dx,
      y: panStart.y + dy
    })
  }

  const handlePerformCropAndUpload = async () => {
    if (!cropSrc || !cropFile) return
    setUploading(true)
    setCropSrc(null) // close crop modal

    try {
      const img = new Image()
      img.src = cropSrc
      await new Promise((resolve) => {
        img.onload = resolve
      })

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')

      const imgWidth = img.width
      const imgHeight = img.height

      // Calculate the display size fitting a 300x300 container (like object-cover)
      const displayWidth = imgWidth > imgHeight ? (imgWidth * 300) / imgHeight : 300
      const displayHeight = imgHeight > imgWidth ? (imgHeight * 300) / imgWidth : 300

      canvas.width = 300
      canvas.height = 300

      ctx.clearRect(0, 0, 300, 300)
      
      // Apply the zoom and pan translation mirroring the CSS styling
      ctx.translate(150 + cropPan.x, 150 + cropPan.y)
      ctx.scale(cropZoom, cropZoom)
      ctx.drawImage(img, -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight)

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      })

      if (!blob) throw new Error('Failed to generate cropped image')

      const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      await uploadProfilePicture(croppedFile)
      alert('Profile picture cropped and updated successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to crop and upload profile picture')
    } finally {
      setUploading(false)
      setCropFile(null)
    }
  }

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docName.trim() || !docFile) {
      alert('Please provide a label and select a file.')
      return
    }

    setUploading(true)
    try {
      await addProfileDocument(docName.trim(), docFile)
      alert('Profile document uploaded successfully!')
      setDocName('')
      setDocFile(null)
      const input = document.getElementById('profile-doc-file') as HTMLInputElement
      if (input) input.value = ''
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (id: string, url: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setUploading(true)
      try {
        await deleteProfileDocument(id, url)
        alert('Document deleted successfully.')
      } catch (err) {
        console.error(err)
        alert('Failed to delete document')
      } finally {
        setUploading(false)
      }
    }
  }

  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!galleryFile) {
      alert('Please select an image file.')
      return
    }

    const tags = galleryTagsInput.split(',').map(t => t.trim()).filter(Boolean)
    setUploading(true)
    try {
      await addGalleryItem(galleryFile, galleryCaption.trim(), tags)
      alert('Gallery item uploaded successfully!')
      setGalleryFile(null)
      setGalleryCaption('')
      setGalleryTagsInput('')
      const input = document.getElementById('gallery-file') as HTMLInputElement
      if (input) input.value = ''
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteGalleryItem = async (id: string, url: string) => {
    if (confirm('Are you sure you want to delete this image from your gallery?')) {
      setUploading(true)
      try {
        await deleteGalleryItem(id, url)
        alert('Gallery item deleted successfully.')
      } catch (err) {
        console.error(err)
        alert('Failed to delete gallery item')
      } finally {
        setUploading(false)
      }
    }
  }

  if (!isLoaded || !profile) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Dashboard Context...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden bg-black text-slate-100 font-sans selection:bg-pink-500/30 selection:text-white relative flex flex-col">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Grid Layout */}
      <div className="flex flex-1 h-full relative z-10 overflow-hidden">
        
        {/* Sidebar (Left Side) */}
        <aside className="w-64 border-r border-white/5 bg-[#040816]/30 backdrop-blur-md p-6 hidden md:flex flex-col justify-between shrink-0">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-gradient-to-tr from-pink-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm">Ω</span>
              <span className="font-bold tracking-wider text-slate-200 text-sm">ADMIN CONTROL</span>
            </div>

            <nav className="space-y-1">
              <button 
                onClick={() => setRightTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-sm transition-colors text-left cursor-pointer ${
                  rightTab === 'profile' ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:bg-white/[0.02]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Settings
              </button>
              
              <button 
                onClick={() => setRightTab('projects')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-sm transition-colors text-left cursor-pointer ${
                  rightTab === 'projects' ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:bg-white/[0.02]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Projects Monitor
              </button>

              <a href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 font-semibold text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Profile Page
              </a>

              <a href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 font-semibold text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                View Portfolio
              </a>
            </nav>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-pink-500/10 bg-[#040816]/60 p-4 text-xs">
              <span className="text-slate-500 font-medium block">Active User:</span>
              <span className="text-slate-300 font-mono truncate block mt-0.5" title={userEmail}>{userEmail}</span>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="w-full rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-400 transition-colors cursor-pointer text-center"
              >
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Dashboard Content (Right Side Content Container) */}
        <main className="flex-1 flex flex-col overflow-hidden p-6 sm:p-10 space-y-6 h-full">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-6 gap-4 shrink-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Dashboard Manager
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Editing panel for your developer profile page, categorized gallery, and projects showcase.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="rounded-lg border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 px-4 py-2 text-sm font-semibold text-pink-300 transition-colors"
              >
                Visit Profile
              </Link>
              <form action={logout} className="md:hidden">
                <button
                  type="submit"
                  className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-2 text-sm font-semibold text-rose-400 cursor-pointer"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>

          {/* Sub-navigation tabs (Projects vs Profile Settings) */}
          <div className="flex border-b border-white/5 pb-px gap-6 shrink-0">
            <button
              onClick={() => setRightTab('projects')}
              className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                rightTab === 'projects' 
                  ? 'border-pink-500 text-pink-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Projects Monitor
            </button>
            <button
              onClick={() => setRightTab('profile')}
              className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                rightTab === 'profile' 
                  ? 'border-pink-500 text-pink-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Profile & Page Settings
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {rightTab === 'projects' ? (
              <div className="h-full">
                <AdminProjectManager />
              </div>
            ) : (
              <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto no-scrollbar pb-6">
                
                {/* Column 1: Profile Details & Profile Picture */}
                <div className="lg:col-span-1 space-y-6">
                  {/* General Profile Info */}
                  <div className="rounded-2xl border border-white/5 bg-[#040816]/10 p-6 space-y-6">
                    <div className="border-b border-white/5 pb-4">
                      <h2 className="text-md font-bold text-slate-200">General Information</h2>
                      <span className="text-[11px] text-slate-500">Update name, bio, and skills list.</span>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Display Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500/50 transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Bio / Headline</label>
                        <textarea
                          rows={4}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500/50 transition-colors resize-none leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">Skills Tags</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add skill tag"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddSkill(e)
                              }
                            }}
                            className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-pink-500/50 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={handleAddSkill}
                            className="rounded-lg bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-400 border border-sky-500/10 transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {skills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1 rounded bg-sky-500/5 px-2 py-0.5 text-xs font-medium text-sky-300 border border-sky-500/10"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill)}
                                className="text-slate-500 hover:text-slate-300 text-[10px] focus:outline-none"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors cursor-pointer text-center"
                      >
                        {isSaving ? 'Saving...' : 'Save Details'}
                      </button>
                    </form>
                  </div>

                  {/* Profile Picture (Avatar) Card */}
                  <div className="rounded-2xl border border-white/5 bg-[#040816]/10 p-6 space-y-4">
                    <div className="border-b border-white/5 pb-4">
                      <h2 className="text-md font-bold text-slate-200">Profile Picture</h2>
                      <span className="text-[11px] text-slate-500">Avatar image displayed in headers and Profile page.</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {profile.avatarUrl ? (
                        <img 
                          src={profile.avatarUrl} 
                          alt="Avatar Preview" 
                          className="w-16 h-16 rounded-full object-cover border border-pink-500/20"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 font-bold text-lg">
                          No Pic
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="inline-block rounded-lg border border-white/10 bg-white/[0.01] hover:bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 transition-colors cursor-pointer">
                          Upload & Crop Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileChange}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Documents Manager */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="rounded-2xl border border-white/5 bg-[#040816]/10 p-6 space-y-6">
                    <div className="border-b border-white/5 pb-4">
                      <h2 className="text-md font-bold text-slate-200">Profile Documents</h2>
                      <span className="text-[11px] text-slate-500">Manage multiple documents (e.g. Resumes, transcripts, certificates).</span>
                    </div>

                    {/* Upload new document form */}
                    <form onSubmit={handleAddDocument} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Document Label</label>
                        <input
                          type="text"
                          placeholder="e.g. Resume (Thai) or Transcript"
                          required
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 block">Select File (PDF / Image)</label>
                        <label className="flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-pink-500/30 rounded-xl bg-white/[0.01] p-3 text-center cursor-pointer transition-all">
                          <span className="text-xs font-semibold text-slate-300">
                            {docFile ? docFile.name : "Choose File"}
                          </span>
                          <input
                            id="profile-doc-file"
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={uploading}
                        className="w-full rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors cursor-pointer text-center"
                      >
                        Upload Document
                      </button>
                    </form>

                    {/* List of uploaded documents */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <h3 className="text-xs font-bold text-slate-400">Uploaded Documents</h3>
                      {!profile.documents || profile.documents.length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic">No documents uploaded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {profile.documents.map((doc) => (
                            <div 
                              key={doc.id} 
                              className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.01]"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="text-xs font-bold text-slate-200 block truncate" title={doc.name}>{doc.name}</span>
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[9px] text-sky-400 hover:underline font-mono truncate block"
                                >
                                  Open Link
                                </a>
                              </div>
                              <button
                                onClick={() => handleDeleteDocument(doc.id, doc.url)}
                                disabled={uploading}
                                className="rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 text-[9px] font-bold border border-rose-500/10 transition-colors cursor-pointer shrink-0"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Column 3: Gallery Manager */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="rounded-2xl border border-white/5 bg-[#040816]/10 p-6 space-y-6">
                    <div className="border-b border-white/5 pb-4">
                      <h2 className="text-md font-bold text-slate-200">Categorized Gallery</h2>
                      <span className="text-[11px] text-slate-500">Upload showcase screenshots/images with category tags.</span>
                    </div>

                    {/* Upload gallery item form */}
                    <form onSubmit={handleAddGalleryItem} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 block">Select Image</label>
                        <label className="flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-pink-500/30 rounded-xl bg-white/[0.01] p-3 text-center cursor-pointer transition-all">
                          <span className="text-xs font-semibold text-slate-300">
                            {galleryFile ? galleryFile.name : "Choose Image"}
                          </span>
                          <input
                            id="gallery-file"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setGalleryFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Caption / Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Database schema layout diagram"
                          value={galleryCaption}
                          onChange={(e) => setGalleryCaption(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Category Tags (comma separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Design, Database, UI"
                          value={galleryTagsInput}
                          onChange={(e) => setGalleryTagsInput(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={uploading}
                        className="w-full rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors cursor-pointer text-center"
                      >
                        Upload to Gallery
                      </button>
                    </form>

                    {/* List of uploaded gallery items */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <h3 className="text-xs font-bold text-slate-400">Gallery Items</h3>
                      {!profile.gallery || profile.gallery.length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic">No gallery items uploaded yet.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {profile.gallery.map((item) => (
                            <div 
                              key={item.id} 
                              className="group relative rounded-lg border border-white/5 bg-[#040816]/30 overflow-hidden flex flex-col aspect-square"
                            >
                              <img 
                                src={item.imageUrl} 
                                alt={item.caption} 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                                <div className="space-y-1 min-h-0 overflow-y-auto no-scrollbar">
                                  <p className="text-[9px] text-slate-200 leading-tight">{item.caption || "No caption"}</p>
                                  <div className="flex flex-wrap gap-0.5">
                                    {item.tags?.map((t) => (
                                      <span key={t} className="bg-sky-500/10 text-sky-400 text-[7px] px-1 rounded">{t}</span>
                                    ))}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGalleryItem(item.id, item.imageUrl)}
                                  disabled={uploading}
                                  className="w-full rounded bg-rose-500 text-white py-1 text-[8px] font-bold transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            )}
          </div>

        </main>
      </div>

      {/* Image Crop Modal Overlay */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#040816] p-6 shadow-2xl flex flex-col my-auto space-y-4 max-h-[95vh] sm:max-h-[90vh]">
            <h3 className="text-md font-bold text-slate-100">Crop Profile Picture</h3>
            <p className="text-xs text-slate-400">Drag to reposition. Use the slider below to zoom.</p>
            
            {/* Cropping Preview Mask Box */}
            <div 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUpOrLeave}
              className="w-[300px] h-[300px] mx-auto relative overflow-hidden rounded-xl border border-white/10 bg-black flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
            >
              <img 
                src={cropSrc} 
                alt="Crop preview" 
                style={{
                  width: `${imageSize.width}px`,
                  height: `${imageSize.height}px`,
                  transform: `translate(${cropPan.x}px, ${cropPan.y}px) scale(${cropZoom})`,
                  transformOrigin: 'center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  maxHeight: 'none',
                  maxWidth: 'none',
                }}
                className="pointer-events-none"
              />
              {/* Circular highlight crop overlay mask */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[300px] h-[300px] rounded-full border border-pink-500/50 box-border bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="space-y-1 w-full max-w-[300px] mx-auto">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Zoom: {Math.round(cropZoom * 100)}%</span>
                <span>Drag image to pan</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.05" 
                value={cropZoom} 
                onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCropSrc(null)
                  setCropFile(null)
                }}
                disabled={uploading}
                className="rounded-lg border border-white/10 bg-white/[0.01] hover:bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePerformCropAndUpload}
                disabled={uploading}
                className="rounded-lg bg-pink-500 hover:bg-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors cursor-pointer"
              >
                Crop & Upload
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
