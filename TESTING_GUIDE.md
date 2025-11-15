# 🧪 Quick Testing Guide - Lesson Material CRUD

## ⚡ 5-Minute Quick Start

### 1. Start the Dev Server
```bash
cd /home/aleflemat/Documents/GitRepos/elearning-camp-FullStack
pnpm run dev
```
Visit: http://localhost:5173

### 2. Create a Test Course (if you don't have one)
1. Log in as a publisher
2. Go to **"My Communities"** or **"Create Course"**
3. Create a new course with title **"Lesson Types Test"**
4. Save course (get the course ID)

### 3. Edit Course & Add Lessons
1. Find the course you created
2. Click **"Edit Course"**
3. Scroll to **"Lessons"** section
4. Click **"Add Lesson"** three times

---

## 📹 Lesson 1: Video

### Fill Video Lesson Form
```
Title:           Introduction to React
Type:            Video (blue section appears)
Video URL:       https://www.w3schools.com/html/mov_bbb.mp4
Duration:        10 (minutes)
Order:           1
Description:     Learn React fundamentals
```

**Expected Result:**
- URL field accepts video URLs
- Duration field is in MINUTES (not seconds)
- Blue background section

---

## 📄 Lesson 2: PDF

### Fill PDF Lesson Form
```
Title:           Advanced TypeScript Guide
Type:            PDF (red section appears)
PDF URL:         https://www.w3schools.com/whatis/whatis_pdf.pdf
Reading Time:    15 (minutes)
Order:           2
Description:     Complete TypeScript reference guide
```

**Expected Result:**
- URL field accepts PDF URLs
- Reading time field in MINUTES
- Red background section

---

## 📝 Lesson 3: Article

### Fill Article Lesson Form
```
Title:           Getting Started with Node.js
Type:            Article (green section appears)
Article Content: 
  # Getting Started with Node.js
  
  ## What is Node.js?
  Node.js is a JavaScript runtime. Read more below.
  
  ## Installation
  
  To install Node.js:
  
  ```
  curl https://nodejs.org/install.sh | bash
  ```
  
  **Important:** Make sure you have npm installed!

Reading Time:    5 (minutes)
Order:           3
Description:     Introduction to Node.js development
```

**Expected Result:**
- Markdown textarea for article content
- Reading time field in MINUTES
- Green background section
- Code blocks wrapped in triple backticks

### Markdown Syntax Supported
| Feature | Syntax | Example |
|---------|--------|---------|
| Heading 1 | `# text` | `# Title` |
| Heading 2 | `## text` | `## Subtitle` |
| Bold | `**text**` | `**important**` |
| Code block | ``` code ``` | ``` console.log('hi') ``` |
| List item | `- item` | `- Step one` |

---

## 💾 Save the Course
1. Scroll to bottom
2. Click **"Save Changes"** button
3. You should be redirected to course detail page
4. Toast notification: **"Course updated"**

---

## 🎬 Test Lesson Rendering in CoursePlayer

### Video Lesson Tests
1. Navigate to course detail page
2. Click **"Enroll in Course"** (if not enrolled)
3. Click **"Go to Course"** button
4. You should see the first lesson (Video)

**Verify:**
- [ ] Video player appears with controls (play, pause, seek, fullscreen)
- [ ] Video has black background
- [ ] Duration shows "10 minutes" below video
- [ ] Title appears: "Introduction to React"
- [ ] Description appears
- [ ] No console errors in DevTools

**Test Video Interaction:**
1. Click play → video should play
2. Click pause → should save progress
3. Seek to middle → pause → save position
4. Let video play to end → should:
   - [ ] Show "Lesson Completed" toast
   - [ ] Auto-advance to next lesson (PDF)

---

### PDF Lesson Tests
After video completes, you should see the PDF lesson.

**Verify:**
- [ ] PDF viewer appears in iframe
- [ ] "Open in New Tab" button is visible
- [ ] "Download PDF" button is visible
- [ ] Reading time shows "15 minutes"
- [ ] Title appears: "Advanced TypeScript Guide"
- [ ] Description appears

**Test PDF Interaction:**
1. Click "Open in New Tab" → should open PDF in new browser tab
2. Click "Download PDF" → should download PDF file
3. Click next lesson button → should advance to Article

---

### Article Lesson Tests
After PDF, you should see the Article lesson.

**Verify:**
- [ ] Markdown content renders
- [ ] "# Getting Started with Node.js" appears as heading
- [ ] "## What is Node.js?" appears as smaller heading
- [ ] **Bold text** renders properly
- [ ] Code block appears with:
  - [ ] Monospace font
  - [ ] Background color
  - [ ] Copy button on code block
- [ ] "Print Article" button is visible
- [ ] Reading time shows "5 minutes"

**Test Article Interaction:**
1. Hover over code block → Copy button should appear
2. Click Copy → button changes to "✓ Copied" for 2 seconds
3. Paste elsewhere → should have copied code: `curl https://nodejs.org/install.sh | bash`
4. Click "Print Article" → browser print dialog should open
5. Click next lesson button → should be disabled (no more lessons)

---

## 🔄 Test Lesson Navigation

### Navigation Buttons
**Test "Previous Lesson":**
1. From Article lesson, click "Previous Lesson"
2. Should go back to PDF lesson

**Test "Next Lesson":**
1. From PDF, click "Next Lesson"
2. Should go forward to Article lesson

### Sidebar Navigation
**Test clicking lesson in sidebar:**
1. Look at left/right sidebar (MaterialsList component)
2. Should show all 3 lessons
3. Click on "Introduction to React" (video)
4. Should immediately jump to that lesson
5. Click on "Advanced TypeScript Guide" (PDF)
6. Should immediately jump to that lesson

---

## 📊 Test Progress Tracking

### Progress Bar
**Verify progress bar:**
1. Open Course Player
2. Top should show progress bar with:
   - [ ] Total lessons: 3
   - [ ] Completed: 0/3 (gray)
3. Complete first (video) lesson
   - [ ] Progress bar updates to 1/3
   - [ ] Bar fills to ~33%
4. Manually mark PDF/Article complete (if there's a button)
   - [ ] Progress bar updates to 2/3, 3/3
   - [ ] Bar fills further

### Lesson Completion Indicators
**In sidebar MaterialsList:**
1. Video lesson should show checkmark when complete
2. PDF lesson should show checkmark when complete
3. Article lesson should show checkmark when complete

---

## 🐛 Troubleshooting

### Video doesn't play
**Solution:**
- Check DevTools Console for errors
- Verify video URL is accessible (copy-paste into browser address bar)
- Some browsers/networks may block video URLs
- Try different video URL from: https://www.w3schools.com/html/mov_bbb.mp4

### PDF doesn't load
**Solution:**
- Check DevTools Console for CORS errors
- Verify PDF URL is direct (not a link to a page)
- Try opening PDF URL directly in browser first
- Some PDFs may not allow embedding (CORS restrictions)

### Article markdown doesn't render
**Solution:**
- Check markdown syntax (code blocks need triple backticks)
- Verify content has `# Heading` syntax
- Check DevTools Console for errors
- Try simpler content: just `# Hello\n\nThis is a test`

### Progress not saving
**Solution:**
- Check DevTools Console for API errors
- Check Network tab → look for 422/400 errors
- Ensure you're enrolled in the course
- Backend endpoint might not exist (check backend logs)

---

## ✅ Success Criteria

### All Tests Pass If:
- [x] Video plays and saves progress
- [x] PDF loads with download button
- [x] Article renders markdown with copy buttons
- [x] Can navigate between all 3 lessons
- [x] Progress bar updates correctly
- [x] Sidebar shows all lessons
- [x] No console errors
- [x] No TypeScript errors in VSCode

### You're Done When:
1. All 3 lesson types render correctly
2. All interactive features work
3. No errors in browser console
4. No red squiggles in VSCode

---

## 📸 Expected Output Visuals

### Video Lesson
```
┌─────────────────────────────────────┐
│  [Video Player with Controls]       │
│     Play ▶ Pause ⏸ [Seek Bar]      │
└─────────────────────────────────────┘
Introduction to React
Learn React fundamentals
10 minutes
```

### PDF Lesson
```
┌─────────────────────────────────────┐
│  [PDF Embedded in iframe]           │
│  [can scroll, zoom, etc]            │
│                                     │
└─────────────────────────────────────┘
[Open in New Tab] [Download PDF]
Advanced TypeScript Guide
Complete TypeScript reference guide
15 minutes
```

### Article Lesson
```
┌─────────────────────────────────────┐
│                                     │
│ # Getting Started with Node.js      │
│                                     │
│ ## What is Node.js?                 │
│ Node.js is a JavaScript runtime...  │
│                                     │
│ ## Installation                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ curl https://nodejs.org/i...   │ │
│ │                         [Copy] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ **Important:** Make sure...         │
│                                     │
│ [Print Article]                     │
└─────────────────────────────────────┘
Getting Started with Node.js
Introduction to Node.js development
5 minutes
```

---

## 🎯 Optional Tests (Advanced)

### Test Type Switching in EditCourse
1. Go back to EditCourse
2. Find the video lesson
3. Change type from "Video" to "PDF"
4. Verify:
   - [ ] Form inputs change (URL + reading time appear)
   - [ ] Previous video URL is cleared
   - [ ] New PDF URL field is empty
5. Change back to "Video"
6. Verify inputs switch back

### Test Duration Conversion
1. Edit course
2. For video lesson, enter duration: 10 minutes
3. Save course
4. Check DevTools Network → look at PUT payload
5. Verify: `durationSeconds: 600` (10 * 60)
6. In CoursePlayer, verify duration shows as "10 minutes" (600 / 60)

### Test Lesson Deletion
1. Go to EditCourse
2. Find a lesson
3. Click "Remove" button
4. Verify:
   - [ ] Lesson is removed from form
   - [ ] Order numbers update for remaining lessons
5. Save course
6. Verify lesson is gone in CoursePlayer

---

## 📝 Notes for Developers

### Key Files to Watch in DevTools

**Console Errors:**
- Look for fetch/network errors (API endpoints)
- TypeScript errors should be zero
- Warning about video codec is OK

**Network Tab:**
- `GET /api/v1/courses/:id` → loads course with lessons
- `PUT /api/v1/courses/:id` → saves course edits
- `POST .../progress` → saves video progress (only for video)

**localStorage:**
- Auth token should be present when logged in
- Course data might be cached

---

## 🚀 Next: Real Data

Once testing is complete, you can:
1. Add real video URLs
2. Upload real PDFs (store URLs)
3. Write real article content
4. Add course to public listings
5. Have learners enroll and take courses

---

**Last Updated:** November 14, 2025  
**Status:** Ready for Testing  
**Estimated Testing Time:** 15-20 minutes

