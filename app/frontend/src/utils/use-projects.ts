'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface ProjectDocument {
  id: string
  projectId: string
  name: string
  url: string
  createdAt: string
}

export interface Deployment {
  id: string
  projectId: string
  status: string
  logs: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  title: string
  description: string
  tech: string[]
  videoUrl: string
  demoUrl: string
  gitUrl?: string
  status?: string
  deploys?: string
  lastUpdated?: string
  isVisible?: boolean
  documents?: ProjectDocument[]
}

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: "portfolio-hub",
    title: "Portfolio Hub",
    description: "My personal workspace. A containerized portfolio website backed by a Go REST API, PostgreSQL database, and Supabase Auth.",
    tech: ["Next.js", "Go", "PostgreSQL", "Docker"],
    videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk",
    demoUrl: "https://github.com/F1nn-ach/my-portfolio-project",
    status: "Active",
    deploys: "18",
    lastUpdated: "2 hours ago",
    documents: []
  },
  {
    id: "distributed-cache-store",
    title: "Distributed Cache Store",
    description: "A high-performance in-memory cache engine featuring master-replica replication, custom eviction policies, and gRPC endpoints.",
    tech: ["Go", "Redis", "gRPC", "Protobuf"],
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    demoUrl: "https://github.com/F1nn-ach/my-portfolio-project",
    status: "Active",
    deploys: "4",
    lastUpdated: "May 28",
    documents: []
  },
  {
    id: "glassmorphic-ui-framework",
    title: "Glassmorphic UI Framework",
    description: "A sleek, reusable React UI component library designed with modern glassmorphism principles, HSL-tailored colors, and rich micro-interactions.",
    tech: ["React", "TypeScript", "Tailwind CSS"],
    videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk",
    demoUrl: "https://github.com/F1nn-ach/my-portfolio-project",
    status: "Archived",
    deploys: "12",
    lastUpdated: "May 12",
    documents: []
  }
]

const STORAGE_KEY = 'portfolio_projects'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export function getStoredProjects(): Project[] {
  if (typeof window === 'undefined') return DEFAULT_PROJECTS
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROJECTS))
      return DEFAULT_PROJECTS
    }
    return JSON.parse(data)
  } catch (e) {
    console.error('Failed to parse projects from localStorage', e)
    return DEFAULT_PROJECTS
  }
}

export function setStoredProjects(projects: Project[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch (e) {
    console.error('Failed to set projects in localStorage', e)
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchProjects = async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2-second timeout

    try {
      const res = await fetch(`${API_URL}/projects`, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error('Failed to fetch projects')
      const data = await res.json()
      setProjects(data)
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('Backend API offline or failed, falling back to localStorage:', err)
      setProjects(getStoredProjects())
    } finally {
      setIsLoaded(true)
    }
  }

  // Fetch projects from Go Backend API
  useEffect(() => {
    fetchProjects()
  }, [])

  // Helper to get authorization headers with JWT from Supabase session
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    return headers
  }

  const uploadFileOnly = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const headers = await getAuthHeaders()
    delete headers['Content-Type']

    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || 'Failed to upload file')
    }

    const { url } = await res.json()
    return url
  }

  const deleteFileOnly = async (url: string) => {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/upload?url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
      headers
    })
    if (!res.ok) {
      const errData = await res.json()
      console.error('Failed to delete storage file:', errData.error)
    }
  }

  // Create Project API Integration
  const addProject = async (projectData: Omit<Project, 'id' | 'status' | 'deploys' | 'lastUpdated'>) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify(projectData)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to add project')
      }

      const newProject = await res.json()
      setProjects((prev) => [newProject, ...prev])
      return newProject
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to add project')
      throw err
    }
  }

  // Update Project API Integration
  const updateProject = async (id: string, updatedFields: Partial<Project>) => {
    try {
      const existing = projects.find(p => p.id === id)
      if (!existing) throw new Error('Project not found')

      const { documents, ...cleanFields } = updatedFields
      const merged = { ...existing, ...cleanFields }
      
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(merged)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to update project')
      }

      const updatedProject = await res.json()
      setProjects((prev) => prev.map(p => p.id === id ? { ...updatedProject, documents: p.documents || [] } : p))
      return updatedProject
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to update project')
      throw err
    }
  }

  // Delete Project API Integration
  const deleteProject = async (id: string) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
        headers
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to delete project')
      }

      setProjects((prev) => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to delete project')
      throw err
    }
  }

  const addProjectDocument = async (projectId: string, name: string, file: File) => {
    const url = await uploadFileOnly(file)
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/projects/${projectId}/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, url })
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || 'Failed to add project document')
    }

    await fetchProjects()
  }

  const deleteProjectDocument = async (projectId: string, docId: string, url: string) => {
    await deleteFileOnly(url).catch(err => console.error(err))

    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/projects/documents/${docId}`, {
      method: 'DELETE',
      headers
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || 'Failed to delete project document')
    }

    await fetchProjects()
  }

  const getDeployments = async (projectId: string): Promise<Deployment[]> => {
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/deployments`)
      if (!res.ok) throw new Error('Failed to fetch deployments')
      return await res.json()
    } catch (err) {
      console.error(err)
      return []
    }
  }

  const triggerDeployment = async (projectId: string): Promise<Deployment> => {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/projects/${projectId}/deployments`, {
      method: 'POST',
      headers
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || 'Failed to trigger deployment')
    }

    // Refresh projects to get the updated deploysCount
    await fetchProjects()

    return await res.json()
  }

  const deleteDeployment = async (depId: string): Promise<void> => {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/deployments/${depId}`, {
      method: 'DELETE',
      headers
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || 'Failed to delete deployment')
    }
  }

  return {
    projects,
    isLoaded,
    addProject,
    updateProject,
    deleteProject,
    addProjectDocument,
    deleteProjectDocument,
    getDeployments,
    triggerDeployment,
    deleteDeployment,
    refreshProjects: fetchProjects
  }
}
