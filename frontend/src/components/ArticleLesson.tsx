import { useMemo } from 'react';
import { Lesson } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Copy, Check, Printer } from 'lucide-react';
import { useState } from 'react';

interface ArticleLessonProps {
  lesson: Lesson;
  courseId: string;
}

/**
 * Article lesson renderer with markdown support
 * Handles: rendering markdown content, copy code blocks, print support
 * Note: Uses basic HTML rendering; for full markdown, can upgrade to marked or markdown-it
 */
const ArticleLesson = ({ lesson }: ArticleLessonProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Simple markdown-like content rendering
  // In production, use: npm install marked
  const renderContent = (content: string) => {
    // Split content by code blocks
    const parts = content.split(/```([\s\S]*?)```/);
    
    return (
      <div className="space-y-4">
        {parts.map((part, idx) => {
          if (idx % 2 === 0) {
            // Regular text
            return (
              <div
                key={idx}
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: part
                    .split('\n# ')
                    .map((line, i) =>
                      i === 0
                        ? line
                            .split('\n## ')
                            .map((l, j) =>
                              j === 0
                                ? l
                                    .split('\n')
                                    .map((p) => {
                                      if (p.startsWith('**') && p.endsWith('**')) {
                                        return `<strong>${p.slice(2, -2)}</strong>`;
                                      }
                                      if (p.startsWith('- ')) {
                                        return `<li>${p.slice(2)}</li>`;
                                      }
                                      if (p) return `<p>${p}</p>`;
                                      return '';
                                    })
                                    .join('')
                                : `<h2>${l}</h2>`
                            )
                            .join('')
                        : `<h1>${line}</h1>`
                    )
                    .join(''),
                }}
              />
            );
          } else {
            // Code block
            const code = part.trim();
            return (
              <div
                key={idx}
                className="bg-muted rounded-lg overflow-hidden border border-border"
              >
                <div className="flex items-center justify-between bg-muted-foreground/10 px-4 py-2 border-b border-border">
                  <span className="text-xs font-mono text-muted-foreground">
                    Code
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      setCopiedCode(code);
                      setTimeout(() => setCopiedCode(null), 2000);
                    }}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-muted-foreground/20 transition"
                  >
                    {copiedCode === code ? (
                      <>
                        <Check className="h-3 w-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto">
                  <code className="text-xs font-mono text-foreground">
                    {code}
                  </code>
                </pre>
              </div>
            );
          }
        })}
      </div>
    );
  };

  if (!lesson.url) {
    return (
      <div className="p-6 rounded-lg bg-red-50 border border-red-200">
        <p className="text-red-800 font-semibold">Article Not Available</p>
        <p className="text-sm text-red-700 mt-2">
          The article content for this lesson is missing. Please contact the
          instructor.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Article Content */}
      <div className="rounded-lg border border-border bg-card p-6">
        {renderContent(lesson.url)}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Print Article
        </Button>
      </div>

      {lesson.durationSeconds && (
        <p className="text-xs text-muted-foreground">
          Estimated reading time: {Math.ceil(lesson.durationSeconds / 60)} minutes
        </p>
      )}
    </div>
  );
};

export default ArticleLesson;
