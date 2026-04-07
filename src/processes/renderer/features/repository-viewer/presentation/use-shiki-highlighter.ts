import { useEffect, useState } from 'react'
import type { Highlighter } from 'shiki'

let cachedHighlighter: Highlighter | null = null
let loadingPromise: Promise<Highlighter> | null = null

async function getHighlighter(): Promise<Highlighter> {
  if (cachedHighlighter) return cachedHighlighter
  if (loadingPromise) return loadingPromise

  loadingPromise = import('shiki').then(async (shiki) => {
    const highlighter = await shiki.createHighlighter({
      themes: ['github-dark'],
      langs: [
        'typescript',
        'javascript',
        'tsx',
        'jsx',
        'json',
        'css',
        'html',
        'markdown',
        'yaml',
        'bash',
        'python',
        'rust',
        'go',
      ],
    })
    cachedHighlighter = highlighter
    return highlighter
  })

  return loadingPromise
}

export function useShikiHighlighter() {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(cachedHighlighter)

  useEffect(() => {
    if (cachedHighlighter) {
      setHighlighter(cachedHighlighter)
      return
    }
    getHighlighter()
      .then(setHighlighter)
      .catch(() => {
        // Shiki ロード失敗時はフォールバック（プレーンテキスト）
      })
  }, [])

  return highlighter
}

export function highlightLine(highlighter: Highlighter | null, code: string, lang: string): string {
  if (!highlighter) return escapeHtml(code)
  try {
    const loadedLangs = highlighter.getLoadedLanguages()
    if (!loadedLangs.includes(lang)) {
      return escapeHtml(code)
    }
    const tokens = highlighter.codeToTokens(code, {
      lang: lang as Parameters<Highlighter['codeToTokens']>[1]['lang'],
      theme: 'github-dark',
    })
    if (tokens.tokens.length === 0) return escapeHtml(code)
    return tokens.tokens[0]
      .map((token) => {
        const style = token.color ? ` style="color:${token.color}"` : ''
        return `<span${style}>${escapeHtml(token.content)}</span>`
      })
      .join('')
  } catch {
    return escapeHtml(code)
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
