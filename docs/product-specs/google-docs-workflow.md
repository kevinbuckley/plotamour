# Product Spec: Google Docs Workflow

**Phase:** 1
**Status:** draft

## The Core Loop

This is what makes plotamour different. The writer's flow:

```
Plan (plotamour) → Write (Google Docs) → Review (plotamour) → Plan more → Write more
```

## "Write in Google Docs" Button

Appears in:
- Scene detail panel (primary location)
- Outline view (on hover for each scene)
- Timeline card context menu (right-click > "Write")

### First Click (No Doc Exists)
1. Button shows: "Write in Google Docs"
2. Click → loading spinner
3. plotamour creates a new Google Doc:
   - **Title:** `{Book Title} — Ch{N}: {Scene Title}`
   - **Location:** A folder in user's Drive named "plotamour — {Project Title}"
   - **Content:** Light context block at the top:
     ```
     ┌────────────────────────────────────────┐
     │ plotamour · Chapter 2: The Discovery   │
     │                                         │
     │ Scene: Elena finds the letter           │
     │ POV: Elena                              │
     │ Conflict: She must decide whether to    │
     │ reveal the truth                        │
     │                                         │
     │ Characters: Elena, Marcus               │
     │ Setting: The Library                    │
     │                                         │
     │ ← Back to plotamour                     │
     └────────────────────────────────────────┘

     [Writer starts typing here]
     ```
   - The context block uses Google Docs formatting: light gray background, smaller font
   - "Back to plotamour" is a hyperlink to the scene in plotamour
4. New browser tab opens with the Doc
5. Button changes to: "Open in Google Docs (1,245 words)"

### Subsequent Clicks (Doc Exists)
1. Button shows: "Open in Google Docs (1,245 words)"
2. Click → opens existing Doc in new tab
3. No content is overwritten

## Returning to plotamour

When the user navigates back to plotamour (browser tab switch, direct URL, or "Back to plotamour" link in the Doc):

1. **On page load/focus:** plotamour triggers a metadata sync for the current project
2. **Sync pulls from Google Docs API:**
   - Word count (body content minus the context block)
   - Last modified timestamp
3. **UI updates:**
   - Scene card word count badge refreshes
   - Status updates: 0 words → "not started", 1+ words → "in progress"
   - "Draft complete" is manually set by the writer (checkbox in scene detail)

## Visual Indicators

### On Scene Cards (Timeline)
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Scene Title  │     │ Scene Title  │     │ Scene Title  │
│              │     │              │     │              │
│ ⚪ No doc    │     │ 🟡 1,245 wds│     │ ✅ 3,100 wds│
└──────────────┘     └──────────────┘     └──────────────┘
  Not started          In progress         Draft complete
```

### In Outline View
Each scene row shows:
- Status icon (⚪ / 🟡 / ✅)
- Word count
- "Last written: 2 hours ago" (relative timestamp)

## Edge Cases

| Situation | Behavior |
|---|---|
| User deletes the Google Doc manually | Show "Doc not found" status, offer to create a new one |
| User renames the Doc in Google Drive | We don't care — we track by Doc ID, not title |
| Scene is deleted in plotamour | Doc link is removed but Doc is NOT deleted from Drive |
| Chapter reorder in plotamour | Doc titles are updated to reflect new chapter numbers |
| User revokes Google Docs permission | Show "Reconnect Google Docs" prompt in scene panel |
| Google API is down | Show stale data with "Last synced: ..." timestamp |
