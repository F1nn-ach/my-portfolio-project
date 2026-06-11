'use client'

import { useState, useEffect, useRef } from 'react'
import { useProjects, Project, Deployment } from '@/utils/use-projects'

export default function AdminProjectManager() {
  const { 
    projects, 
    isLoaded, 
    addProject, 
    updateProject, 
    deleteProject,
    addProjectDocument,
    deleteProjectDocument,
    getDeployments,
    triggerDeployment,
    deleteDeployment
  } = useProjects()

  // Form & UI state
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [techTags, setTechTags] = useState<string[]>([])
  const [techInput, setTechInput] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [gitUrl, setGitUrl] = useState('')
  const [isVisible, setIsVisible] = useState(true)

  // Project document upload states
  const [projDocName, setProjDocName] = useState('')
  const [projDocFile, setProjDocFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Deployments UI state
  const [isDeployOpen, setIsDeployOpen] = useState(false)
  const [activeDeployProject, setActiveDeployProject] = useState<Project | null>(null)
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)
  const [triggeringDeploy, setTriggeringDeploy] = useState(false)

  // Fetch deployments polling effect
  useEffect(() => {
    if (!isDeployOpen || !activeDeployProject) return

    const fetchDeps = async () => {
      try {
        const data = await getDeployments(activeDeployProject.id)
        setDeployments(data)
        if (selectedDeployment) {
          const updated = data.find(d => d.id === selectedDeployment.id)
          if (updated) {
            setSelectedDeployment(updated)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchDeps()
    const interval = setInterval(fetchDeps, 3000)
    return () => clearInterval(interval)
  }, [isDeployOpen, activeDeployProject, selectedDeployment?.id])

  const handleTriggerDeploy = async () => {
    if (!activeDeployProject) return
    setTriggeringDeploy(true)
    try {
      const d = await triggerDeployment(activeDeployProject.id)
      setSelectedDeployment(d)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to trigger deployment')
    } finally {
      setTriggeringDeploy(false)
    }
  }

  const handleDeleteDeploy = async (depId: string) => {
    if (confirm('Are you sure you want to delete this deployment record?')) {
      try {
        await deleteDeployment(depId)
        setDeployments(prev => prev.filter(d => d.id !== depId))
        if (selectedDeployment?.id === depId) {
          setSelectedDeployment(null)
        }
      } catch (err) {
        console.error(err)
        alert('Failed to delete deployment record')
      }
    }
  }

  // Find currently editing project
  const editingProject = projects.find(p => p.id === editingId)

  const openAddModal = () => {
    setTitle('')
    setDescription('')
    setTechTags([])
    setTechInput('')
    setVideoUrl('')
    setDemoUrl('')
    setGitUrl('')
    setEditingId(null)
    setProjDocName('')
    setProjDocFile(null)
    setIsVisible(true)
    setIsOpen(true)
  }

  const openEditModal = (project: Project) => {
    setTitle(project.title)
    setDescription(project.description)
    setTechTags([...project.tech])
    setTechInput('')
    setVideoUrl(project.videoUrl)
    setDemoUrl(project.demoUrl)
    setGitUrl(project.gitUrl || '')
    setEditingId(project.id)
    setProjDocName('')
    setProjDocFile(null)
    setIsVisible(project.isVisible !== false)
    setIsOpen(true)
  }

  const handleAddProjDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    if (!projDocName.trim() || !projDocFile) {
      alert('Please enter a document name and select a file.')
      return
    }
    setUploading(true)
    try {
      await addProjectDocument(editingId, projDocName.trim(), projDocFile)
      alert('Document attached successfully!')
      setProjDocName('')
      setProjDocFile(null)
      const input = document.getElementById('project-doc-file') as HTMLInputElement
      if (input) input.value = ''
    } catch (err) {
      console.error(err)
      alert('Failed to attach document')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteProjDoc = async (docId: string, url: string) => {
    if (!editingId) return
    if (confirm('Are you sure you want to delete this project document?')) {
      setUploading(true)
      try {
        await deleteProjectDocument(editingId, docId, url)
        alert('Document deleted successfully.')
      } catch (err) {
        console.error(err)
        alert('Failed to delete document')
      } finally {
        setUploading(false)
      }
    }
  }

  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault()
    const tag = techInput.trim()
    if (tag && !techTags.includes(tag)) {
      setTechTags([...techTags, tag])
      setTechInput('')
    }
  }

  const handleRemoveTech = (tagToRemove: string) => {
    setTechTags(techTags.filter(t => t !== tagToRemove))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      alert('Please provide at least a title and description.')
      return
    }

    const projectData = {
      title: title.trim(),
      description: description.trim(),
      tech: techTags,
      videoUrl: videoUrl.trim(),
      demoUrl: demoUrl.trim(),
      gitUrl: gitUrl.trim(),
      isVisible: isVisible
    }

    if (editingId) {
      updateProject(editingId, projectData)
    } else {
      addProject(projectData)
    }

    setIsOpen(false)
  }

  if (!isLoaded) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#040816]/10 p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3" />
        <div className="space-y-3 pt-4">
          <div className="h-12 bg-slate-800 rounded" />
          <div className="h-12 bg-slate-800 rounded" />
          <div className="h-12 bg-slate-800 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[#040816]/10 p-6 space-y-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-200">Projects Monitor</h2>
          <span className="text-xs text-slate-500 font-mono">{projects.length} Registered</span>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-lg bg-pink-500 hover:bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-colors flex items-center gap-1 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-white/5 rounded-xl text-sm text-slate-500">
          No projects registered. Click &quot;Add Project&quot; to get started.
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto pr-1 no-scrollbar">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-200 truncate block">{proj.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    proj.status === "Active" ? "bg-pink-500/10 text-pink-400" : "bg-slate-500/10 text-slate-400"
                  }`}>
                    {proj.status || "Active"}
                  </span>
                  {proj.isVisible === false && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/10">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {proj.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.tech.map((tag, idx) => (
                    <span key={idx} className="rounded bg-sky-500/5 px-1.5 py-0.5 text-[10px] font-medium text-sky-300 border border-sky-500/10">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[10px] text-slate-500 font-mono">
                  {proj.videoUrl && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Has Video
                    </span>
                  )}
                  {proj.demoUrl && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Has Demo
                    </span>
                  )}
                  {proj.documents && proj.documents.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {proj.documents.length} Docs
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 md:self-center">
                <button
                  onClick={() => {
                    setActiveDeployProject(proj)
                    setIsDeployOpen(true)
                    setSelectedDeployment(null)
                  }}
                  className="rounded-lg border border-sky-500/20 hover:bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-400 transition-all cursor-pointer flex items-center gap-1 animate-pulse"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Deployments
                </button>
                <button
                  onClick={() => openEditModal(proj)}
                  className="rounded-lg border border-white/10 hover:border-pink-500/20 bg-white/[0.02] hover:bg-pink-500/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-pink-400 transition-all cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${proj.title}"?`)) {
                      deleteProject(proj.id)
                    }
                  }}
                  className="rounded-lg border border-rose-500/20 hover:bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#040816] p-6 shadow-2xl flex flex-col my-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
              <h3 className="text-md font-bold text-slate-100">
                {editingId ? 'Edit Project Details' : 'Add New Project'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form (Scrollable body) */}
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 py-4 flex-1 min-h-0">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Cache Store"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Project Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide a detailed description of the project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-pink-500/50 transition-colors resize-none"
                />
              </div>

              {/* Tech Stack Tags Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Tech Stack Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. React (Press Enter to add)"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const tag = techInput.trim()
                        if (tag && !techTags.includes(tag)) {
                          setTechTags([...techTags, tag])
                          setTechInput('')
                        }
                      }
                    }}
                    className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddTech}
                    className="rounded-lg bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-400 border border-sky-500/10 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {/* Tech tag list */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {techTags.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic">No tags added yet.</span>
                  ) : (
                    techTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded bg-sky-500/5 px-2 py-0.5 text-xs font-medium text-sky-300 border border-sky-500/10"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTech(tag)}
                          className="text-slate-500 hover:text-slate-300 text-[10px] focus:outline-none"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Video Tutorial URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Video Tutorial URL</span>
                  <span className="text-[10px] text-slate-500 font-mono italic">YouTube / MP4 / Vimeo</span>
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/embed/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>

              {/* Demo URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Demo URL</label>
                <input
                  type="url"
                  placeholder="https://my-demo.com"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>

              {/* Git URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Git Repository URL</span>
                  <span className="text-[10px] text-slate-500 font-mono italic">github.com/user/repo</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.01]">
                <div className="space-y-0.5">
                  <label className="text-xs font-semibold text-slate-300">Project Visibility</label>
                  <p className="text-[10px] text-slate-500">Determine if this project is visible to public visitors.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVisible(!isVisible)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isVisible ? 'bg-pink-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isVisible ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Related Project Documents */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="text-xs font-semibold text-slate-400 block">Project Documents</label>
                
                {editingId ? (
                  <div className="space-y-4">
                    {/* Add Document inputs */}
                    <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.01] p-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. System Architecture"
                          value={projDocName}
                          onChange={(e) => setProjDocName(e.target.value)}
                          className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-pink-500/50 transition-colors"
                        />
                        <label className="rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors cursor-pointer shrink-0">
                          {projDocFile ? "Selected" : "Browse..."}
                          <input
                            id="project-doc-file"
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => setProjDocFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleAddProjDoc}
                          disabled={uploading}
                          className="rounded-lg bg-pink-500 hover:bg-pink-600 px-3 py-1 text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
                        >
                          Attach
                        </button>
                      </div>
                    </div>

                    {/* Document List */}
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {editingProject?.documents && editingProject.documents.length > 0 ? (
                        editingProject.documents.map((doc) => (
                          <div 
                            key={doc.id}
                            className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-black/40"
                          >
                            <span className="text-xs font-medium text-slate-300 truncate pr-2" title={doc.name}>
                              {doc.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteProjDoc(doc.id, doc.url)}
                              disabled={uploading}
                              className="text-rose-400 hover:text-rose-300 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-600 italic">No documents attached to this project.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">
                    Related documents can be uploaded and attached after you create/save this project.
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/[0.01] hover:bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-pink-500 hover:bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deployments Modal */}
      {isDeployOpen && activeDeployProject && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#040816] p-6 shadow-2xl flex flex-col my-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
              <div>
                <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                  <svg className="w-5 h-5 text-sky-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Deployments for {activeDeployProject.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Repo: {activeDeployProject.gitUrl || activeDeployProject.demoUrl || 'None configured'}
                </p>
              </div>
              <button
                onClick={() => setIsDeployOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 overflow-y-auto flex-1 min-h-0">
              {/* Left Column: Actions & Deployment History */}
              <div className="space-y-4 flex flex-col min-h-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-300">Deployment History</h4>
                  <button
                    onClick={handleTriggerDeploy}
                    disabled={triggeringDeploy || (!activeDeployProject.gitUrl && !activeDeployProject.demoUrl)}
                    className="rounded-lg bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {triggeringDeploy ? (
                      <span className="inline-block w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin mr-1" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    Deploy Now
                  </button>
                </div>

                {(!activeDeployProject.gitUrl && !activeDeployProject.demoUrl) && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 leading-relaxed">
                    ⚠️ <strong>Warning:</strong> No Git Repository URL or Demo URL is configured. Please edit this project to add a git URL before triggering a deployment.
                  </div>
                )}

                {/* History List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                  {deployments.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/5 rounded-xl text-xs text-slate-500">
                      No deployments recorded for this project.
                    </div>
                  ) : (
                    deployments.map((dep) => {
                      const isActive = selectedDeployment?.id === dep.id;
                      return (
                        <div
                          key={dep.id}
                          onClick={() => setSelectedDeployment(dep)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            isActive
                              ? 'border-sky-500 bg-sky-500/5'
                              : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="space-y-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block w-2 h-2 rounded-full ${
                                dep.status === 'Success' ? 'bg-emerald-500' :
                                dep.status === 'Failed' ? 'bg-rose-500' :
                                'bg-amber-500 animate-pulse'
                              }`} />
                              <span className="text-xs font-bold text-slate-200">{dep.status}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {new Date(dep.createdAt).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedDeployment(dep)}
                              className="rounded bg-white/5 hover:bg-white/10 px-2 py-1 text-[10px] font-semibold text-slate-300 transition-colors"
                            >
                              Logs
                            </button>
                            <button
                              onClick={() => handleDeleteDeploy(dep.id)}
                              className="text-rose-400 hover:text-rose-300 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Terminal Logs */}
              <div className="flex flex-col min-h-0 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-300">Build & Run Logs</h4>
                  {selectedDeployment && (
                    <span className="text-[10px] font-mono text-slate-500">
                      ID: {selectedDeployment.id.slice(0, 8)}
                    </span>
                  )}
                </div>

                {selectedDeployment ? (
                  <TerminalLogs logs={selectedDeployment.logs} />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl p-6 text-center">
                    <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-slate-500">Select a deployment from the history list to view build logs.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-white/5 shrink-0">
              <button
                onClick={() => setIsDeployOpen(false)}
                className="rounded-lg border border-white/10 bg-white/[0.01] hover:bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Terminal component with auto-scrolling
const TerminalLogs = ({ logs }: { logs: string }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div 
      ref={containerRef}
      className="bg-black/90 font-mono text-[10px] md:text-xs text-green-400 p-4 rounded-xl border border-white/10 h-96 overflow-y-auto whitespace-pre-wrap scrollbar-thin scrollbar-thumb-slate-700"
    >
      {logs || "Waiting for logs..."}
    </div>
  )
}
