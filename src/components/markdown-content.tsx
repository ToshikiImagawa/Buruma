import { memo } from 'react'
import type { ComponentProps } from 'react'
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { CopyButton } from './copy-button'

const REMARK_PLUGINS = [remarkGfm, remarkBreaks]

const markdownComponents: ComponentProps<typeof Markdown>['components'] = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="mb-2 mt-4 text-lg font-bold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-3 text-base font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 mt-2 text-sm font-bold first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-0.5 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-0.5 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  a: ({ href, children }) => {
    const isSafe = href && /^https?:\/\//.test(href)
    return isSafe ? (
      <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <span className="text-primary underline">{children}</span>
    )
  },
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-border pl-3 italic text-muted-foreground last:mb-0">
      {children}
    </blockquote>
  ),
  code: ({ className, children, node }) => {
    const hasLanguageClass = className?.startsWith('language-')
    const isBlock = hasLanguageClass || node?.position?.start.line !== node?.position?.end.line
    const code = String(children).replace(/\n$/, '')

    if (isBlock) {
      const lang = hasLanguageClass ? (className?.replace('language-', '') ?? '') : ''
      return (
        <div className="group/code relative mb-2 last:mb-0">
          {lang && <div className="rounded-t-md bg-background/80 px-3 py-1 text-xs text-muted-foreground">{lang}</div>}
          <pre className={`overflow-x-auto rounded-b-md bg-background/80 p-3 ${!lang ? 'rounded-t-md' : ''}`}>
            <code className="text-xs">{code}</code>
          </pre>
          <CopyButton
            text={code}
            className="absolute top-2 right-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background/50 hover:text-foreground group-hover/code:opacity-100"
          />
        </div>
      )
    }

    return <code className="rounded bg-background/80 px-1.5 py-0.5 text-xs">{children}</code>
  },
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="min-w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
  th: ({ children }) => <th className="px-2 py-1 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-border/50 px-2 py-1">{children}</td>,
  hr: () => <hr className="my-3 border-border" />,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
}

interface MarkdownContentProps {
  content: string
}

export const MarkdownContent = memo(function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <Markdown remarkPlugins={REMARK_PLUGINS} components={markdownComponents}>
      {content}
    </Markdown>
  )
})
