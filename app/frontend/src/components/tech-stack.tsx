"use client"

import React, { useMemo } from 'react'

interface TechStackProps {
  skills: string[]
}

export default function TechStack({ skills }: TechStackProps) {
  const grouped = useMemo(() => {
    const languages: string[] = []
    const frameworks: string[] = []
    const tools: string[] = []
    const dbAndOthers: string[] = []

    skills.forEach((skill) => {
      const n = skill.toLowerCase()

      // Languages
      if (
        n === 'go' || n.includes('golang') ||
        n.includes('typescript') || n === 'ts' ||
        n.includes('javascript') || n === 'js' ||
        n.includes('python') || n === 'py' ||
        n.includes('c++') || n.includes('cpp') ||
        n.includes('java') || n.includes('rust') ||
        n.includes('ruby') || n.includes('php') ||
        n.includes('html') || n.includes('css')
      ) {
        if (n.includes('tailwind') || n.includes('bootstrap')) {
          frameworks.push(skill)
        } else {
          languages.push(skill)
        }
      }
      // Frameworks & Libraries
      else if (
        n.includes('react') ||
        n.includes('next') ||
        n.includes('spring') ||
        n.includes('boot') ||
        n.includes('vue') ||
        n.includes('angular') ||
        n.includes('svelte') ||
        n.includes('solid') ||
        n.includes('express') ||
        n.includes('nest') ||
        n.includes('django') ||
        n.includes('flask') ||
        n.includes('fastapi') ||
        n.includes('flutter')
      ) {
        frameworks.push(skill)
      }
      // Tools & Platforms
      else if (
        n.includes('vs code') || n.includes('vscode') ||
        n.includes('eclipse') ||
        n.includes('postman') ||
        n.includes('docker') ||
        n.includes('linux') ||
        n.includes('git') ||
        n.includes('github') ||
        n.includes('ci/cd') ||
        n.includes('actions') ||
        n.includes('nginx')
      ) {
        tools.push(skill)
      }
      // Databases & Others
      else {
        dbAndOthers.push(skill)
      }
    })

    return { languages, frameworks, tools, dbAndOthers }
  }, [skills])

  const maxRows = Math.max(
    grouped.languages.length,
    grouped.frameworks.length,
    grouped.tools.length,
    grouped.dbAndOthers.length
  )

  const rows = []
  for (let i = 0; i < maxRows; i++) {
    rows.push({
      language: grouped.languages[i] || '',
      framework: grouped.frameworks[i] || '',
      tool: grouped.tools[i] || '',
      dbAndOther: grouped.dbAndOthers[i] || '',
    })
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-[#040816]/10 backdrop-blur-md shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[650px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.01]">
              <th className="w-1/4 px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-white/5">Languages</th>
              <th className="w-1/4 px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-white/5">Frameworks</th>
              <th className="w-1/4 px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-white/5">Tools</th>
              <th className="w-1/4 px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Databases & Others</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/[0.005] transition-colors">
                {/* Languages */}
                <td className="px-6 py-3.5 text-sm text-slate-300 border-r border-white/5 align-top">
                  {row.language && (
                    <div className="flex items-center gap-2 group/item">
                      <div className="h-1.5 w-1.5 rounded-full bg-sky-400 group-hover/item:bg-pink-500 transition-colors shadow-[0_0_8px_rgba(56,189,248,0.3)]" />
                      <span className="font-semibold text-slate-300">{row.language}</span>
                    </div>
                  )}
                </td>

                {/* Frameworks */}
                <td className="px-6 py-3.5 text-sm text-slate-300 border-r border-white/5 align-top">
                  {row.framework && (
                    <div className="flex items-center gap-2 group/item">
                      <div className="h-1.5 w-1.5 rounded-full bg-pink-400 group-hover/item:bg-sky-400 transition-colors shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                      <span className="font-semibold text-slate-300">{row.framework}</span>
                    </div>
                  )}
                </td>

                {/* Tools */}
                <td className="px-6 py-3.5 text-sm text-slate-300 border-r border-white/5 align-top">
                  {row.tool && (
                    <div className="flex items-center gap-2 group/item">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 group-hover/item:bg-pink-500 transition-colors shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
                      <span className="font-semibold text-slate-300">{row.tool}</span>
                    </div>
                  )}
                </td>

                {/* Databases & Others */}
                <td className="px-6 py-3.5 text-sm text-slate-300 align-top">
                  {row.dbAndOther && (
                    <div className="flex items-center gap-2 group/item">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover/item:bg-sky-400 transition-colors shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
                      <span className="font-semibold text-slate-300">{row.dbAndOther}</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
