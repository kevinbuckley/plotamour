# Design Doc: Google Docs Integration

**Status:** accepted
**Author:** plotamour team
**Date:** 2026-03-02

## Problem

Hobby novelists outline in one tool, then write in another (usually Google Docs). The round-trip is painful: they lose context switching between apps, manually track which scenes are written, and have no easy way to jump from outline to prose and back.

## Solution

plotamour integrates with Google Docs so that:
1. Each scene can have a linked Google Doc
2. Writers click "Write" to jump directly into the Doc with scene context
3. Returning to plotamour shows writing progress (word count, last edited)
4. The outline stays the source of truth for structure; Docs hold the prose

## User Workflow

### Starting to Write
```
1. Writer opens plotamour, views their timeline
2. Clicks a scene card → scene detail panel opens
3. Clicks "Write in Google Docs" button
4. First time: A new Google Doc is created in their Drive
   - Doc title: "{Book Title} — Ch{N}: {Scene Title}"
   - Doc body starts with scene context:
     - Scene summary (from the card)
     - Characters in this scene
     - Place/setting
     - Notes from the writer
   - This context is inserted as a light-gray header block
5. Subsequent times: Opens the existing linked Doc
6. Writer writes freely in Google Docs
```

### Returning to plotamour
```
1. Writer comes back to plotamour (via bookmark, direct nav, or a
   "Back to Outline" link we place in the Doc header)
2. plotamour syncs metadata for recently-edited Docs:
   - Word count (body text only, excluding our header)
   - Last modified timestamp
   - We do NOT pull the prose content into plotamour
3. Timeline/outline views update to show:
   - Word count badges on scene cards
   - "Last written" timestamps
   - Visual indicator: not started / in progress / draft complete
```

### Reordering Scenes
```
1. Writer drags scenes to reorder chapters in plotamour
2. Google Doc links remain attached to scenes (not chapter numbers)
3. Doc titles are updated to reflect new chapter ordering
4. No content is lost — the Doc itself doesn't move, only our reference
```

## Technical Design

### OAuth Setup
- Google OAuth consent screen with scopes:
  - `openid`, `email`, `profile` (for auth)
  - `https://www.googleapis.com/auth/documents` (Docs CRUD)
  - `https://www.googleapis.com/auth/drive.file` (only files we create)
- Tokens stored in Supabase (encrypted `google_refresh_token` on user profile)
- Token refresh handled server-side before API calls

### Database Schema Addition
```sql
-- Links scenes to Google Docs
CREATE TABLE scene_google_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  google_doc_id TEXT NOT NULL,       -- Google's document ID
  google_doc_url TEXT NOT NULL,      -- Full URL for opening
  word_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  last_modified_at TIMESTAMPTZ,      -- From Google API
  writing_status TEXT DEFAULT 'not_started'
    CHECK (writing_status IN ('not_started', 'in_progress', 'draft_complete')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Service Layer
```
src/lib/services/google-docs.ts
├── getGoogleClient(userId)        — Builds authenticated Google API client
├── createDocForScene(scene)       — Creates Doc, stores link, returns URL
├── getDocUrl(sceneId)             — Returns URL for existing linked Doc
├── syncDocMetadata(sceneId)       — Fetches word count + last modified
├── syncProjectDocs(projectId)     — Batch sync all Docs in a project
├── updateDocTitle(sceneId, title) — Renames Doc when scene/chapter changes
└── deleteDocLink(sceneId)         — Removes link (does NOT delete the Doc)
```

### Word Count Calculation
- Use Google Docs API `documents.get` to retrieve document body
- Count words in body content, excluding our inserted header block
- Header block is identified by a custom named range: `plotamour_context`

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Create Docs vs link existing | Create new | Simpler UX, we control the Doc structure |
| Store prose in plotamour? | No | Docs is the writing tool, we own structure only |
| Sync frequency | On-demand | Sync when user returns, not real-time polling |
| Delete Doc when scene deleted? | No | Writer's content is sacred. Unlink only. |
| Folder organization | One Drive folder per project | Keeps writer's Drive tidy |

## Risks

- **Google API rate limits:** Batch sync could hit limits for large projects. Mitigation: throttle and cache.
- **OAuth token expiry:** Refresh tokens can be revoked. Mitigation: graceful re-auth flow.
- **Scope creep:** Temptation to build a Doc editor inside plotamour. Mitigation: core belief #3.
