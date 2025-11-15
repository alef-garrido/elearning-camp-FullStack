import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Lesson } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface ArticleLessonProps {
  lesson: Lesson;
  courseId?: string;
  onEnded?: () => void;
}

const ArticleLesson: React.FC<ArticleLessonProps> = ({ lesson }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const content = lesson.url || '';

  const renderMarkdown = (md: string) => {
    const renderer = new marked.Renderer();
    renderer.code = (code: string, infostring: string | undefined) => {
      const lang = (infostring || '').split(' ')[0] || 'code';
      const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `
        <div class="code-block border border-border rounded-md overflow-hidden bg-muted my-4">
          <div class="code-block-toolbar flex items-center justify-between px-3 py-2 border-b border-border">
            <span class="text-xs font-mono text-muted-foreground">${lang}</span>
            <button class="copy-code-btn text-xs px-2 py-1 rounded hover:bg-muted-foreground/20">Copy</button>
          </div>
          <pre class="p-3 overflow-x-auto"><code class="language-${lang} font-mono text-sm">${escaped}</code></pre>
        </div>
      `;
    };

    const raw = marked.parse(md || '', { renderer });
    return DOMPurify.sanitize(raw);
  };

  const sanitizedHtml = useMemo(() => renderMarkdown(content), [content]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const buttons = Array.from(root.querySelectorAll('.copy-code-btn')) as HTMLButtonElement[];
    const handlers: Array<() => void> = [];

    buttons.forEach((btn) => {
      const handler = () => {
        const codeEl = btn.closest('.code-block')?.querySelector('pre > code');
        if (!codeEl) return;
        const text = codeEl.textContent || '';
        navigator.clipboard.writeText(text).then(() => {
          setCopiedCode(text);
          toast.success('Code copied');
          setTimeout(() => setCopiedCode(null), 2000);
        }).catch(() => {
          toast.error('Copy failed');
        });
      };
      btn.addEventListener('click', handler);
      handlers.push(() => btn.removeEventListener('click', handler));
    });

    return () => handlers.forEach((h) => h());
  }, [sanitizedHtml]);

  if (!content) {
    return (
      <div className="p-6 rounded-lg bg-red-50 border border-red-200">
        <p className="text-red-800 font-semibold">Article Not Available</p>
        <p className="text-sm text-red-700 mt-2">The article content for this lesson is missing.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div ref={containerRef} className="rounded-lg border border-border bg-card p-6" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Article
        </Button>
      </div>

      {lesson.durationSeconds && (
        <p className="text-xs text-muted-foreground">Estimated reading time: {Math.ceil(lesson.durationSeconds / 60)} minutes</p>
      )}
    </div>
  );
};

export default ArticleLesson;
