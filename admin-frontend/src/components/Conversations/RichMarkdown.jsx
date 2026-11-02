import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './RichMarkdown.css'

export default function RichMarkdown({ content = '' }) {
  if (!content) return null

  return (
    <div className="admin-rich-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="markdown-table-wrapper">
              <table {...props} />
            </div>
          ),
          a: ({ node, href, children, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code className="markdown-inline-code" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <pre className="markdown-pre">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
