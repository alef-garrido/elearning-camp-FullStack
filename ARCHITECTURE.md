# 🏗️ Architecture & Component Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     E-Learning Application                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐        ┌──────────────────────┐   │
│  │   Publisher Side     │        │   Learner Side       │   │
│  │  (Course Creation)   │        │  (Course Consumption)│   │
│  └──────────────────────┘        └──────────────────────┘   │
│         │                                    │                │
│         │                                    │                │
│         ▼                                    ▼                │
│  ┌──────────────────────┐        ┌──────────────────────┐   │
│  │   EditCourse.tsx     │        │ CoursePlayer.tsx     │   │
│  │  (Lesson Editor)     │        │ (Lesson Viewer)      │   │
│  └──────────────────────┘        └──────────────────────┘   │
│         │                                    │                │
│         │ Lesson form with                  │ Render lesson   │
│         │ type-specific inputs              │                │
│         │                                    │                │
│         │ ┌─ Video: URL + duration          │ ┌──────────────┤
│         │ ├─ PDF: URL + reading time        │ │              │
│         │ └─ Article: markdown + reading    │ │              │
│         │                                    ▼              │
│         │                          ┌──────────────────────┐ │
│         │                          │LessonContentRenderer │ │
│         │                          │   (Type Router)      │ │
│         │                          └──────────────────────┘ │
│         │                                    │               │
│         │                                    │ Switch on     │
│         │                                    │ lesson.type   │
│         │                                    │               │
│         │                          ┌─────────┼─────────┐     │
│         │                          │         │         │     │
│         │                          ▼         ▼         ▼     │
│         │                      ┌─────┐ ┌─────┐ ┌─────────┐  │
│         │                      │Video│ │ PDF │ │ Article │  │
│         │                      │Less.│ │Less.│ │ Lesson  │  │
│         │                      └─────┘ └─────┘ └─────────┘  │
│         │                                                     │
│         │                      ┌─────────────────────────┐   │
│         │                      │  Supporting Components  │   │
│         │                      ├─────────────────────────┤   │
│         │                      │ • LessonNav (prev/next) │   │
│         │                      │ • MaterialsList (sidebar)│  │
│         │                      │ • ProgressBar (tracking)│   │
│         │                      │ • LessonNotes (notes)   │   │
│         │                      └─────────────────────────┘   │
│         │                                                     │
│         └────────────────────┬────────────────────────────   │
│                              │                               │
│                              ▼                               │
│                      ┌──────────────────┐                   │
│                      │  Backend API     │                   │
│                      ├──────────────────┤                   │
│                      │ PUT /courses/:id │                   │
│                      │ (saves lessons)  │                   │
│                      │                  │                   │
│                      │ POST /.../progress│                  │
│                      │ (tracks progress)│                   │
│                      └──────────────────┘                   │
│                              │                               │
│                              ▼                               │
│                      ┌──────────────────┐                   │
│                      │   MongoDB        │                   │
│                      ├──────────────────┤                   │
│                      │ Courses          │                   │
│                      │ ├─ lessons[]     │                   │
│                      │ ├─ title         │                   │
│                      │ └─ description   │                   │
│                      │                  │                   │
│                      │ Progress         │                   │
│                      │ ├─ lessonId      │                   │
│                      │ └─ completed     │                   │
│                      └──────────────────┘                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Tree

```
App.tsx
│
├── Routes
│   │
│   ├── /courses/:courseId/player
│   │   └── CoursePlayer.tsx
│   │       └── LessonContentRenderer.tsx
│   │           ├── VideoLesson.tsx
│   │           ├── PDFLesson.tsx
│   │           └── ArticleLesson.tsx
│   │
│   └── /courses/:courseId/edit
│       └── EditCourse.tsx
│           └── (Lesson form with type-specific inputs)
│
└── Supporting Components
    ├── LessonNav.tsx (prev/next buttons)
    ├── MaterialsList.tsx (sidebar navigation)
    ├── ProgressBar.tsx (progress tracking)
    └── LessonNotes.tsx (notes feature)
```

---

## Data Model & Type System

```typescript
// Lesson Interface (shared across app)
interface Lesson {
  _id: string;
  title: string;                    // "Introduction to React"
  type: 'video' | 'pdf' | 'article';  // Lesson type
  url: string;                      // Content URL or markdown
  durationSeconds?: number;         // 600 (10 minutes)
  order?: number;                   // 1, 2, 3...
  description?: string;             // "Learn the basics"
  attachments?: Attachment[];       // Related files
}

// Per-type content storage:
┌─────────────────────────────────────┐
│ Type   │ lesson.url contains        │
├─────────────────────────────────────┤
│ video  │ https://youtube.com/vid.mp4│
│ pdf    │ https://example.com/f.pdf  │
│ article│ # Markdown\nContent here   │
└─────────────────────────────────────┘
```

---

## Lesson Form Input Strategy (EditCourse)

```
User selects lesson.type
        │
        ├─ 'video'  → Show BLUE section
        │            ├─ Video URL field
        │            └─ Duration (minutes)
        │
        ├─ 'pdf'    → Show RED section
        │            ├─ PDF URL field
        │            └─ Reading time (minutes)
        │
        └─ 'article'→ Show GREEN section
                     ├─ Markdown textarea
                     └─ Reading time (minutes)

        All types also show:
        ├─ Title field
        ├─ Order field
        ├─ Description field
        └─ Remove button
```

---

## Rendering Strategy (CoursePlayer)

```
LessonContentRenderer receives lesson object
        │
        ├─ Check lesson.type
        │
        ├─ if 'video':
        │   └─ Render VideoLesson
        │       ├─ HTML5 <video> element
        │       ├─ Auto-play + controls
        │       ├─ Progress throttled to 5s intervals
        │       └─ Mark complete on end
        │
        ├─ if 'pdf':
        │   └─ Render PDFLesson
        │       ├─ <iframe> with PDF URL
        │       ├─ Download button
        │       ├─ Open in new tab button
        │       └─ Manual completion
        │
        ├─ if 'article':
        │   └─ Render ArticleLesson
        │       ├─ Parse markdown
        │       ├─ Render HTML with styling
        │       ├─ Copy buttons on code blocks
        │       ├─ Print support
        │       └─ Manual completion
        │
        └─ else:
            └─ Show error message
```

---

## Progress Tracking Flow

```
┌─────────────────────────────────────────────┐
│     Lesson Type Progress Tracking           │
├─────────────────────────────────────────────┤
│                                             │
│  VIDEO:                                     │
│  ┌──────────────────────────────────────┐  │
│  │ • Play video → start tracking        │  │
│  │ • Every 5 seconds → save position    │  │
│  │ • On pause → save position           │  │
│  │ • On video end → mark COMPLETED      │  │
│  │ • Auto-advance to next lesson        │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  PDF & ARTICLE:                             │
│  ┌──────────────────────────────────────┐  │
│  │ • No automatic tracking              │  │
│  │ • Manual completion (user button)    │  │
│  │ • Learner marks complete when ready  │  │
│  │ • Progress bar updates               │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  API CALLS:                                 │
│  ┌──────────────────────────────────────┐  │
│  │ VideoLesson:                         │  │
│  │   POST /courses/:id/lessons/:id/progress
│  │   { lastPositionSeconds, completed }│  │
│  │                                      │  │
│  │ PDFLesson & ArticleLesson:           │  │
│  │   POST /courses/:id/lessons/:id/progress
│  │   { completed: true }                │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## File Organization

```
frontend/src/
│
├── components/
│   ├── LessonContentRenderer.tsx     ← NEW (router)
│   ├── VideoLesson.tsx               ← NEW (video player)
│   ├── PDFLesson.tsx                 ← NEW (PDF viewer)
│   ├── ArticleLesson.tsx             ← NEW (article renderer)
│   ├── LessonNav.tsx                 (existing)
│   ├── MaterialsList.tsx             (existing)
│   ├── ProgressBar.tsx               (existing)
│   ├── LessonNotes.tsx               (existing)
│   └── VideoPlayer.tsx               ← OLD (can delete after testing)
│
├── pages/
│   ├── EditCourse.tsx                ← UPDATED (type-specific form)
│   ├── CoursePlayer.tsx              ← UPDATED (use renderer)
│   └── ... (other pages)
│
├── types/
│   └── api.ts                        (Lesson interface)
│
└── lib/
    └── api.ts                        (ApiClient)
```

---

## State Management Flow

```
EditCourse.tsx
├── State: formData (course metadata)
├── State: lessons[] (array of Lesson objects)
├── Handler: updateLesson(idx, patch)
│   └─ Updates lessons[idx] with partial data
├── Handler: addLesson()
│   └─ Adds new lesson to lessons[] array
├── Handler: removeLesson(idx)
│   └─ Removes lesson and reorders
└── Handler: handleSubmit()
    └─ Sends lessons[] array to backend in PUT payload

CoursePlayer.tsx
├── State: activeLesson (current Lesson object)
├── State: completedLessons (string[])
├── Handler: handleNextLesson()
│   └─ Sets activeLesson to next in course.lessons[]
├── Handler: handlePreviousLesson()
│   └─ Sets activeLesson to previous
└── Render: LessonContentRenderer
    └─ Shows appropriate viewer based on lesson.type
```

---

## Error Handling Strategy

```
Each component handles errors gracefully:

VideoLesson:
├─ Missing URL → Show red error box: "Video Not Available"
└─ API error → Toast: "Failed to save progress"

PDFLesson:
└─ Missing URL → Show red error box: "PDF Not Available"

ArticleLesson:
└─ Missing URL → Show red error box: "Article Not Available"

LessonContentRenderer:
└─ Unknown type → Show amber warning: "Unknown lesson type: xyz"

EditCourse:
├─ Missing required fields → Validation error
└─ API error → Toast: "Failed to update course"

CoursePlayer:
├─ Course not found → Show message
├─ No lessons → Show message
└─ API error → Toast notification
```

---

## Performance Considerations

```
Video Lesson:
├─ Progress saved every 5 seconds (throttled)
│  └─ Prevents spam to backend
├─ Video element keyed by lesson._id
│  └─ Forces re-render on lesson change
└─ Event listeners cleaned up on unmount
   └─ Prevents memory leaks

PDF Lesson:
└─ iframe loaded once, no re-renders
   └─ Good performance

Article Lesson:
├─ Markdown parsed on render
├─ Can upgrade to marked library for performance
└─ Code blocks stored in memory for copy feature

CoursePlayer:
├─ Lessons loaded once on mount
├─ activeLesson state change → minimal re-render
└─ LessonContentRenderer → only renders active lesson
   └─ Off-screen lessons not rendered
```

---

## Type Safety

```
All components fully typed:

interface VideoLessonProps {
  lesson: Lesson;        ← type-checked
  courseId: string;      ← type-checked
  onEnded?: () => void;  ← type-checked
}

Lesson.type enum-checked:
type LessonType = 'video' | 'pdf' | 'article';

TypeScript prevents:
├─ Passing wrong props
├─ Accessing non-existent properties
├─ Type mismatches in callbacks
└─ Invalid lesson types in switch statement
```

---

## Extensibility Example

### Adding a new lesson type (e.g., 'interactive-quiz')

1. **Update types/api.ts:**
```typescript
type LessonType = 'video' | 'pdf' | 'article' | 'interactive-quiz';
```

2. **Create QuizLesson.tsx component:**
```typescript
const QuizLesson = ({ lesson, courseId }: QuizLessonProps) => {
  // Render quiz UI
  // Track answers
  // Mark complete when passed
}
```

3. **Update LessonContentRenderer.tsx:**
```typescript
case 'interactive-quiz':
  return <QuizLesson lesson={lesson} courseId={courseId} />;
```

4. **Update EditCourse.tsx:**
```typescript
<SelectItem value="interactive-quiz">Interactive Quiz</SelectItem>

{lesson.type === 'interactive-quiz' && (
  <div className="... (quiz-specific inputs)">
    // Quiz builder UI
  </div>
)}
```

Done! No other files need changes.

---

## Testing Pyramid

```
       ┌─────────┐
       │   E2E   │ (Full course: create → enroll → consume)
       │  Tests  │
       └────┬────┘
           / \
          /   \
        ┌───────────┐
        │Integration│ (Components work together)
        │  Tests    │
        └─────┬─────┘
            /   \
           /     \
      ┌──────────────────┐
      │   Unit Tests     │ (Individual components)
      └──────────────────┘
```

**Current Status:** Ready for manual E2E testing

---

## Deployment Checklist

- [ ] All components compile (pnpm tsc --noEmit)
- [ ] Build successful (pnpm run build)
- [ ] Test all 3 lesson types in dev environment
- [ ] Verify API endpoints work
- [ ] Check mobile responsiveness
- [ ] Test on different browsers
- [ ] Verify CORS settings allow PDF/video embedding
- [ ] Add real content (videos, PDFs, articles)
- [ ] Deploy to staging
- [ ] Do full E2E test
- [ ] Deploy to production

---

**Architecture Version:** 1.0  
**Last Updated:** November 14, 2025  
**Status:** Design Complete, Ready for Testing

