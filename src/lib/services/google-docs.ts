// Layer 3: Services — Google Docs integration

import { createClient } from "@/lib/db/server";
import type { SceneGoogleDoc } from "@/lib/types/database";

/** Thrown when Google returns 401/403, indicating missing or insufficient OAuth scopes. */
export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

interface GoogleTokens {
  access_token: string;
  refresh_token: string;
}

async function getGoogleTokens(userId: string): Promise<GoogleTokens | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("google_refresh_token")
    .eq("id", userId)
    .single();

  if (!profile?.google_refresh_token) {
    console.error("[GoogleDocs] No refresh token found in profile for user:", userId);
    throw new GoogleAuthError("No Google refresh token — user needs to connect Google Docs.");
  }

  // Always use the stored refresh token to get an access token with the correct
  // Google Docs scopes. The session provider_token comes from the initial login
  // which may NOT include Docs scopes — using it causes 403 SCOPE_INSUFFICIENT.
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("[GoogleDocs] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set");
    return null;
  }

  console.log("[GoogleDocs] Refreshing access token via Google OAuth...");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: profile.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[GoogleDocs] Token refresh failed:", res.status, errBody);
    // If the refresh token is invalid/revoked, user needs to reconnect
    throw new GoogleAuthError("Google token refresh failed — user needs to reconnect Google Docs.");
  }

  const tokenData = await res.json();
  console.log("[GoogleDocs] Token refresh successful");

  return {
    access_token: tokenData.access_token,
    refresh_token: profile.google_refresh_token,
  };
}

export async function createDocForScene(input: {
  sceneId: string;
  bookTitle: string;
  chapterNumber: number;
  sceneTitle: string;
  summary?: string;
  characters?: string[];
  placeName?: string;
}): Promise<SceneGoogleDoc | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[GoogleDocs] No authenticated user");
    return null;
  }

  // getGoogleTokens throws GoogleAuthError if tokens are missing/invalid
  const tokens = await getGoogleTokens(user.id);
  if (!tokens) {
    console.error("[GoogleDocs] Could not obtain Google tokens");
    return null;
  }

  const docTitle = `${input.bookTitle} — Ch${input.chapterNumber}: ${input.sceneTitle}`;

  // Build the context block for the doc
  const contextLines = [
    `plotamour · Chapter ${input.chapterNumber}: ${input.sceneTitle}`,
    "",
  ];
  if (input.summary) contextLines.push(`Scene: ${input.summary}`, "");
  if (input.characters?.length) contextLines.push(`Characters: ${input.characters.join(", ")}`, "");
  if (input.placeName) contextLines.push(`Setting: ${input.placeName}`, "");
  contextLines.push("---", "", "");

  try {
    // Create the Google Doc
    const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: docTitle }),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      console.error("[GoogleDocs] Doc creation failed:", createRes.status, errBody);
      if (createRes.status === 401 || createRes.status === 403) {
        throw new GoogleAuthError("Google Docs API returned " + createRes.status + " — insufficient scopes.");
      }
      return null;
    }
    const doc = await createRes.json();
    const docId = doc.documentId;

    // Insert context text
    const contextText = contextLines.join("\n");
    await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: contextText,
            },
          },
          {
            updateTextStyle: {
              range: { startIndex: 1, endIndex: 1 + contextText.length },
              textStyle: {
                foregroundColor: {
                  color: { rgbColor: { red: 0.6, green: 0.6, blue: 0.6 } },
                },
                fontSize: { magnitude: 10, unit: "PT" },
              },
              fields: "foregroundColor,fontSize",
            },
          },
        ],
      }),
    });

    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

    // Save the link in our database
    const { data, error } = await supabase
      .from("scene_google_docs")
      .insert({
        scene_id: input.sceneId,
        google_doc_id: docId,
        google_doc_url: docUrl,
        word_count: 0,
        writing_status: "not_started",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    if (err instanceof GoogleAuthError) throw err;
    return null;
  }
}

export async function getDocForScene(sceneId: string): Promise<SceneGoogleDoc | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scene_google_docs")
    .select("*")
    .eq("scene_id", sceneId)
    .single();

  return data ?? null;
}

export async function syncDocMetadata(sceneId: string): Promise<SceneGoogleDoc | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const doc = await getDocForScene(sceneId);
  if (!doc) return null;

  const tokens = await getGoogleTokens(user.id);
  if (!tokens) return null;

  try {
    const res = await fetch(
      `https://docs.googleapis.com/v1/documents/${doc.google_doc_id}`,
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!res.ok) return doc;
    const docData = await res.json();

    // Count words in the document body
    let wordCount = 0;
    if (docData.body?.content) {
      for (const element of docData.body.content) {
        if (element.paragraph?.elements) {
          for (const el of element.paragraph.elements) {
            if (el.textRun?.content) {
              const words = el.textRun.content.trim().split(/\s+/).filter(Boolean);
              wordCount += words.length;
            }
          }
        }
      }
    }

    const writingStatus = wordCount === 0 ? "not_started" : "in_progress";

    const { data: updated } = await supabase
      .from("scene_google_docs")
      .update({
        word_count: wordCount,
        writing_status: doc.writing_status === "draft_complete" ? "draft_complete" : writingStatus,
        last_synced_at: new Date().toISOString(),
        last_modified_at: new Date().toISOString(),
      })
      .eq("id", doc.id)
      .select()
      .single();

    return updated ?? doc;
  } catch {
    return doc;
  }
}

export async function syncProjectDocs(bookId: string): Promise<void> {
  const supabase = await createClient();

  const { data: scenes } = await supabase
    .from("scenes")
    .select("id")
    .eq("book_id", bookId)
    .is("deleted_at", null);

  if (!scenes) return;

  const { data: docs } = await supabase
    .from("scene_google_docs")
    .select("scene_id")
    .in("scene_id", scenes.map((s) => s.id));

  if (!docs?.length) return;

  // Sync up to 10 at a time to avoid rate limits
  const batch = docs.slice(0, 10);
  await Promise.allSettled(batch.map((d) => syncDocMetadata(d.scene_id)));
}

export async function updateDocTitle(
  sceneId: string,
  newTitle: string
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const doc = await getDocForScene(sceneId);
  if (!doc) return;

  const tokens = await getGoogleTokens(user.id);
  if (!tokens) return;

  try {
    await fetch(
      `https://docs.googleapis.com/v1/documents/${doc.google_doc_id}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              replaceAllText: {
                containsText: { text: doc.google_doc_id, matchCase: false },
                replaceText: newTitle,
              },
            },
          ],
        }),
      }
    );
  } catch {
    // Non-critical — title update failure is acceptable
  }
}
