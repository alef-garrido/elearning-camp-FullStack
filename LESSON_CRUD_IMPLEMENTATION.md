# Lesson Material CRUD Implementation Plan

## Overview
Implementing a type-aware lesson rendering system that handles three distinct content types (Video, PDF, Article) with specialized editors and viewers.

## Architecture

### Component Hierarchy
```
EditCourse.tsx (lesson CRUD form)
  ↓
  └─ Lesson cards with type-specific input fields
     ├─ Video type → URL field + duration (minutes)
     ├─ PDF type → URL field + reading time (minutes)
     └─ Article type → Markdown textarea + reading time (minutes)

CoursePlayer.tsx (lesson consumption)
  ↓
  └─ LessonContentRenderer.tsx (type router)
     ├─ VideoLesson.tsx (HTML5 video + progress tracking)
     ├─ PDFLesson.tsx (iframe viewer + download)
     └─ ArticleLesson.tsx (markdown renderer + copy blocks)
```

## Components Implemented

### 1. LessonContentRenderer.tsx
**Purpose:** Central router that dispatches to type-specific lesson components

**Props:**
```typescript
interface LessonContentRendererProps {
  lesson: Lesson;
  courseId: string;
  onEnded?: () => void;
}
```

**Logic:**
- Switch on `lesson.type` ('video' | 'pdf' | 'article')
- Delegate to appropriate component
- Handle unknown types with error message

**Files Created:**
- `/frontend/src/components/LessonContentRenderer.tsx`

---

### 2. VideoLesson.tsx
**Purpose:** HTML5 video player with automatic progress tracking

**Features:**
- ✅ Auto-play on load
- ✅ Video controls (play/pause/seek/fullscreen)
- ✅ Progress tracking:
  - Saves position every 5 seconds (throttled)
  - Saves on pause
  - Marks as completed when video ends
- ✅ Graceful error handling for missing URL
- ✅ Display duration in minutes

**Data Flow:**
1. Video plays from `lesson.url`
2. On pause/timeupdate → saves `lastPositionSeconds` to backend
3. On video end → marks completed, calls `onEnded()` to advance to next lesson

**API Integration:**
```typescript
ApiClient.updateLessonProgress(courseId, lesson._id, {
  lastPositionSeconds: number,
  completed: boolean
})
```

**Files Created:**
- `/frontend/src/components/VideoLesson.tsx`

---

### 3. PDFLesson.tsx
**Purpose:** PDF document viewer with download & print options

**Features:**
- ✅ Embedded iframe PDF viewer (Google Docs Viewer syntax)
- ✅ Open in new tab button (for full-screen viewing)
- ✅ Download PDF button (direct link)
- ✅ Display estimated reading time
- ✅ Graceful error handling for missing URL

**Data Model:**
- `lesson.url` → direct URL to PDF file (e.g., `https://example.com/docs/file.pdf`)
- `lesson.durationSeconds` → estimated reading time (user-entered)

**Iframe URL Format:**
```
{lesson.url}#toolbar=1&navpanes=0&scrollbar=1
```
- `toolbar=1` → show PDF toolbar
- `navpanes=0` → hide navigation pane
- `scrollbar=1` → show scrollbar

**Files Created:**
- `/frontend/src/components/PDFLesson.tsx`

---

### 4. ArticleLesson.tsx
**Purpose:** Markdown content renderer with code block utilities

**Features:**
- ✅ Markdown parsing (basic: headings, bold, code blocks, lists)
- ✅ Code block copy-to-clipboard button
- ✅ Copy feedback (shows "Copied" for 2 seconds)
- ✅ Print article support
- ✅ Display estimated reading time
- ✅ Graceful error handling for missing content

**Markdown Support:**
| Feature | Syntax | Example |
|---------|--------|---------|
| Heading 1 | `# text` | `# Introduction` |
| Heading 2 | `## text` | `## Getting Started` |
| Bold | `**text**` | `**important**` |
| Code block | ``` code ``` | ``` console.log('hi') ``` |
| List item | `- item` | `- Step one` |

**Data Model:**
- `lesson.url` → markdown content (stored as string in DB)
- `lesson.durationSeconds` → estimated reading time (user-entered)

**Implementation Notes:**
- For production, upgrade to `marked` library for full markdown support
- Currently uses basic regex splitting and HTML rendering
- Code blocks are extractable and copyable

**Files Created:**
- `/frontend/src/components/ArticleLesson.tsx`

---

### 5. Updated EditCourse.tsx
**Purpose:** Form for creating/editing courses with type-aware lesson inputs

**Changes:**
1. **Lesson Card Layout** (previously single row)
   - Now displays 3-column header: Title, Type, Order
   - Type-specific inputs below (color-coded sections)

2. **Type-Specific Sections**

   **Video (Blue section):**
   ```
   ┌─ Video URL field (https://example.com/video.mp4)
   └─ Duration in MINUTES (converted to/from seconds)
   ```

   **PDF (Red section):**
   ```
   ┌─ PDF URL field (https://example.com/file.pdf)
   └─ Reading time in MINUTES
   ```

   **Article (Green section):**
   ```
   ┌─ Markdown textarea (large, monospace font)
   └─ Reading time in MINUTES
   ```

3. **Shared Fields**
   - Description (always shown)
   - Remove button
   - Add Lesson button

4. **Data Transformation**
   - Duration input/output in MINUTES (user-friendly)
   - Stored as SECONDS in database (standard)
   - Conversion: `minutes * 60 = seconds`

**Files Modified:**
- `/frontend/src/pages/EditCourse.tsx`

---

### 6. Updated CoursePlayer.tsx
**Purpose:** Lesson consumption interface with type-aware rendering

**Changes:**
1. **Import Change**
   - Removed: `import VideoPlayer from '@/components/VideoPlayer'`
   - Added: `import LessonContentRenderer from '@/components/LessonContentRenderer'`

2. **Rendering Change** (lines ~46-62)
   ```tsx
   // Before: hardcoded VideoPlayer
   <VideoPlayer lesson={activeLesson} courseId={course._id} onEnded={...} />
   
   // After: type-aware renderer
   <LessonContentRenderer lesson={activeLesson} courseId={course._id} onEnded={...} />
   ```

3. **Behavior**
   - Calls `LessonContentRenderer` which routes based on lesson type
   - Each type handles its own UI and progress tracking
   - `onEnded` callback marks lesson complete and advances to next

**Files Modified:**
- `/frontend/src/pages/CoursePlayer.tsx`

---

## Data Flow Diagrams

### Creating a Lesson
```
EditCourse Form
  ↓
User selects type: 'video' | 'pdf' | 'article'
  ↓
Type-specific inputs appear
  ↓
User fills: title, type, URL/content, duration, description
  ↓
Submit → Lesson object:
  {
    title: string,
    type: 'video' | 'pdf' | 'article',
    url: string (video URL, PDF URL, or markdown),
    durationSeconds: number (minutes * 60),
    order: number,
    description: string,
    attachments: []
  }
  ↓
PUT /api/v1/courses/:id with lessons[] array
  ↓
Backend saves to MongoDB
```

### Consuming a Lesson
```
CoursePlayer loads course + activeLesson
  ↓
LessonContentRenderer receives lesson object
  ↓
Switch on lesson.type:
  
  case 'video':
    → VideoLesson renders <video src={lesson.url}>
    → On play: auto-progress tracking begins
    → On end: saves completion, calls onEnded()
  
  case 'pdf':
    → PDFLesson renders <iframe src={lesson.url}>
    → User can download or open full page
    → No auto-progress (manual marking)
  
  case 'article':
    → ArticleLesson renders markdown from lesson.url
    → User can copy code blocks
    → No auto-progress (manual marking)
  ↓
Next lesson button → sets activeLesson to next in array
```

---

## Testing Strategy

### Unit Tests (Per Component)
- [ ] VideoLesson: plays video, throttles progress updates, marks completion
- [ ] PDFLesson: embeds PDF, download link works, graceful error handling
- [ ] ArticleLesson: renders markdown, copy button works, print functionality
- [ ] LessonContentRenderer: routes to correct component per type

### Integration Tests (E2E)
1. **Create Test Course**
   - Create new course
   - Add 3 lessons (one of each type)
   - Fill in type-specific fields
   - Save course

2. **Verify EditCourse Form**
   - Edit course → verify lessons load
   - Switch lesson type → verify inputs change
   - Update duration conversion (minutes ↔ seconds)
   - Delete lesson → verify order renumbers

3. **Verify CoursePlayer Rendering**
   - Navigate to course player (as enrolled user)
   - Video lesson: plays, shows controls, progress saves
   - PDF lesson: loads in iframe, download works
   - Article lesson: renders markdown, copy buttons work
   - Navigation: prev/next buttons switch lessons
   - Progress: progress bar updates correctly

4. **Verify Progress Tracking**
   - Video: progress saved every 5 seconds + on pause
   - PDF/Article: manual completion marking (via button)
   - Progress bar reflects completed lessons

---

## Migration Notes

### Old VideoPlayer Component
**Status:** Superseded by VideoLesson (single-purpose component)

**What happened:**
- Old `VideoPlayer.tsx` only handled video type
- New `VideoLesson.tsx` same functionality with minor improvements
- CoursePlayer now uses `LessonContentRenderer` instead
- Old component can be deleted after testing

**Next Steps:**
```bash
# After testing is complete:
rm frontend/src/components/VideoPlayer.tsx
```

---

## File Checklist

### Created Files
- ✅ `/frontend/src/components/LessonContentRenderer.tsx` (router)
- ✅ `/frontend/src/components/VideoLesson.tsx` (video player)
- ✅ `/frontend/src/components/PDFLesson.tsx` (PDF viewer)
- ✅ `/frontend/src/components/ArticleLesson.tsx` (markdown renderer)

### Modified Files
- ✅ `/frontend/src/pages/EditCourse.tsx` (type-specific form inputs)
- ✅ `/frontend/src/pages/CoursePlayer.tsx` (use LessonContentRenderer)

### Files to Delete (After Testing)
- [ ] `/frontend/src/components/VideoPlayer.tsx` (superseded)

---

## Configuration & Dependencies

### Required Dependencies (Already Installed)
- ✅ `sonner` - toast notifications
- ✅ `lucide-react` - icons (Copy, Download, ExternalLink, Printer)
- ✅ React 18 + TypeScript

### Optional Dependencies (For Enhancement)
- `marked` - full markdown parsing (instead of regex-based)
- `react-pdf` - advanced PDF viewer (instead of iframe)
- `remark` + `rehype` - markdown to JSX compiler
- `prismjs` - syntax highlighting for code blocks

### Current Implementation (No New Dependencies)
- Uses native HTML5 video, iframe, and basic markdown parsing
- Minimal dependencies = fast, maintainable, deployable

---

## Success Criteria

### When Complete ✅
- [ ] All 4 new components compile without errors
- [ ] EditCourse form shows correct inputs for each lesson type
- [ ] CoursePlayer renders video/PDF/article correctly
- [ ] Video progress tracking works (throttled updates)
- [ ] PDF viewer shows with download button
- [ ] Article markdown renders with copy-able code blocks
- [ ] Lesson navigation (prev/next) works across all types
- [ ] Progress bar reflects lesson completion
- [ ] No TypeScript errors in VSCode
- [ ] No console errors in browser

### E2E Test Passes ✅
- [ ] Create course with mixed lesson types
- [ ] Save and load course in EditCourse
- [ ] View as learner in CoursePlayer
- [ ] Each lesson type renders correctly
- [ ] All interactive features work (play, download, copy, print, navigate)
- [ ] Progress tracking works

---

## Future Enhancements

1. **Video Uploads**
   - Allow file upload instead of just URL
   - Store in cloud (AWS S3, Cloudinary, Supabase)
   - Generate video thumbnails

2. **Advanced Markdown**
   - Use `marked` library for full markdown spec
   - Add syntax highlighting via `prismjs`
   - Support tables, blockquotes, links

3. **Advanced PDF**
   - Use `react-pdf` for native viewing
   - Page-by-page navigation
   - Annotations support
   - Embedded video overlays

4. **Progress Tracking**
   - Auto-mark PDF/Article complete after ~80% read
   - Reading time estimates based on actual content length
   - Quiz/assessment before marking complete

5. **Attachments**
   - Upload supplementary files (PDFs, code repos, zips)
   - Store in lesson.attachments array
   - Display download links alongside lesson

6. **Accessibility**
   - Video captions/subtitles (WebVTT)
   - Transcript/chapter markers
   - Audio descriptions for images
   - Keyboard navigation

---

## Quick Start

### 1. Run Type Check
```bash
cd frontend
pnpm tsc --noEmit
```

### 2. Start Dev Server
```bash
pnpm run dev
```

### 3. Test Video Lesson
- Create course → add video with URL `https://example.com/video.mp4`
- Play video → should show controls, auto-play
- Pause → should save progress
- End → should mark complete, auto-advance

### 4. Test PDF Lesson
- Create course → add PDF with URL `https://example.com/file.pdf`
- Viewer should load
- Download button should work

### 5. Test Article Lesson
- Create course → add article with markdown content
- Markdown should render: headings, bold, code blocks
- Copy button on code blocks should work

---

## Troubleshooting

### Issue: Video doesn't play
**Check:**
- `lesson.url` is valid and accessible
- URL is absolute (not relative)
- CORS allows embedding
- Browser supports video codec

### Issue: PDF doesn't load
**Check:**
- PDF URL is direct (not a link to Google Drive page)
- PDF is publicly accessible
- Try opening URL directly in browser first

### Issue: Article markdown doesn't render
**Check:**
- Markdown syntax is valid
- Use triple backticks for code blocks
- Check browser console for errors

### Issue: Progress not saving
**Check:**
- API endpoint `/courses/:courseId/lessons/:lessonId/progress` exists
- User is enrolled in course
- Network tab shows successful requests

---

## References

- [HTML5 Video Spec](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
- [PDF.js for Advanced Viewing](https://mozilla.github.io/pdf.js/)
- [CommonMark Markdown Spec](https://spec.commonmark.org/)
- [React Best Practices](https://react.dev/learn)

