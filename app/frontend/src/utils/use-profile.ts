'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface ProfileDocument {
  id: string
  profileId: string
  name: string
  url: string
  createdAt: string
}

export interface GalleryItem {
  id: string
  profileId: string
  imageUrl: string
  caption: string
  tags: string[]
  createdAt: string
}

export interface Profile {
  id: string
  name: string
  bio: string
  skills: string[]
  avatarUrl?: string
  documents?: ProfileDocument[]
  gallery?: GalleryItem[]
  updatedAt?: string
}

export const DEFAULT_PROFILE: Profile = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "F1nn-ach",
  bio: "I build high-performance backend systems with Go and design pixel-perfect, responsive web interfaces using Next.js.",
  skills: ["Go (Golang)", "React / Next.js", "Docker & Compose", "PostgreSQL", "TypeScript", "Tailwind CSS"],
  avatarUrl: "",
  documents: [],
  gallery: []
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchProfile = async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2-second timeout

    try {
      const res = await fetch(`${API_URL}/profile`, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setProfile(data)
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('Error fetching profile, falling back to default:', err)
      setProfile(DEFAULT_PROFILE)
    } finally {
      setIsLoaded(true)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

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

  const updateProfile = async (updatedFields: Partial<Profile>) => {
    if (!profile) return
    setIsSaving(true)
    try {
      const merged = { ...profile, ...updatedFields }
      // Remove nested fields that aren't saved in public.profiles table direct PUT
      const { documents, gallery, ...cleanFields } = merged

      const headers = await getAuthHeaders()
      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(cleanFields)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to update profile')
      }

      const data = await res.json()
      setProfile({
        ...data,
        documents: profile.documents || [],
        gallery: profile.gallery || []
      })
      return data
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to update profile')
      throw err
    } finally {
      setIsSaving(false)
    }
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

  const uploadProfilePicture = async (file: File): Promise<string> => {
    // Delete existing profile picture if any
    if (profile?.avatarUrl) {
      await deleteFileOnly(profile.avatarUrl).catch(err => console.error(err))
    }
    const url = await uploadFileOnly(file)
    await updateProfile({ avatarUrl: url })
    return url
  }

  const addProfileDocument = async (name: string, file: File) => {
    const url = await uploadFileOnly(file)
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/profile/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, url })
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || 'Failed to add profile document')
    }

    await fetchProfile()
  }

  const deleteProfileDocument = async (id: string, url: string) => {
    await deleteFileOnly(url).catch(err => console.error(err))

    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/profile/documents/${id}`, {
      method: 'DELETE',
      headers
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || 'Failed to delete profile document')
    }

    await fetchProfile()
  }

  const addGalleryItem = async (file: File, caption: string, tags: string[]) => {
    const url = await uploadFileOnly(file)
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/profile/gallery`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageUrl: url, caption, tags })
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || 'Failed to add gallery item')
    }

    await fetchProfile()
  }

  const deleteGalleryItem = async (id: string, imageUrl: string) => {
    await deleteFileOnly(imageUrl).catch(err => console.error(err))

    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/profile/gallery/${id}`, {
      method: 'DELETE',
      headers
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || 'Failed to delete gallery item')
    }

    await fetchProfile()
  }

  return {
    profile,
    isLoaded,
    isSaving,
    updateProfile,
    uploadProfilePicture,
    addProfileDocument,
    deleteProfileDocument,
    addGalleryItem,
    deleteGalleryItem,
    refreshProfile: fetchProfile
  }
}
