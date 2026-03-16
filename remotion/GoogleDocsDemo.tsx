import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Sequence,
} from "remotion";

/* ─── helpers ──────────────────────────────────────────────────────── */

const BRAND = "#6d5acd"; // primary purple
const BG = "#fafafa";
const CARD_BG = "#ffffff";
const MUTED = "#71717a";
const BORDER = "#e4e4e7";

function fadeIn(frame: number, start: number, dur = 15) {
  return interpolate(frame, [start, start + dur], [0, 1], { extrapolateRight: "clamp" });
}

function slideUp(frame: number, fps: number, delay: number) {
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120 } });
  return interpolate(s, [0, 1], [40, 0]);
}

/* ─── Scene 1: Title card ──────────────────────────────────────────── */

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const textOpacity = fadeIn(frame, 15);
  const subtitleOpacity = fadeIn(frame, 30);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f8f7ff",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Gradient background orb */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${BRAND}18 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      <div style={{ textAlign: "center", transform: `scale(${logoScale})` }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: BRAND,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(109,90,205,0.3)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
            </svg>
          </div>
          <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1 }}>
            plot<span style={{ color: BRAND }}>amour</span>
          </span>
        </div>

        <p
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#27272a",
            opacity: textOpacity,
            marginBottom: 12,
          }}
        >
          Google Docs Integration
        </p>
        <p
          style={{
            fontSize: 20,
            color: MUTED,
            opacity: subtitleOpacity,
            maxWidth: 600,
          }}
        >
          How plotamour uses Google Docs to help writers draft their novels
        </p>
      </div>
    </AbsoluteFill>
  );
};

/* ─── Scene 2: Outline view with "Write in Google Docs" ──────────── */

const OutlineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardY = slideUp(frame, fps, 0);
  const cardOpacity = fadeIn(frame, 0);
  const highlightOpacity = fadeIn(frame, 40, 20);
  const cursorProgress = spring({ frame: frame - 50, fps, config: { damping: 20, stiffness: 80 } });
  const cursorX = interpolate(cursorProgress, [0, 1], [900, 540]);
  const cursorY = interpolate(cursorProgress, [0, 1], [600, 415]);
  const clickScale = frame > 75 && frame < 85 ? 0.92 : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 80,
      }}
    >
      {/* Step label */}
      <div style={{ marginBottom: 32, opacity: fadeIn(frame, 0) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: BRAND,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            1
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#18181b" }}>
            Writer opens their story outline
          </span>
        </div>
        <p style={{ fontSize: 18, color: MUTED, marginLeft: 44 }}>
          Each scene has a &quot;Write in Google Docs&quot; button
        </p>
      </div>

      {/* Outline card mockup */}
      <div
        style={{
          background: CARD_BG,
          borderRadius: 16,
          border: `1px solid ${BORDER}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          overflow: "hidden",
          opacity: cardOpacity,
          transform: `translateY(${cardY}px)`,
        }}
      >
        {/* Chapter header */}
        <div
          style={{
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: `${BRAND}20`,
              color: BRAND,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            1
          </div>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Chapter 1: The Beginning</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: MUTED }}>3 scenes</span>
        </div>

        {/* Scene rows */}
        {[
          { title: "Opening scene", plotline: "Main Plot", color: "#6d5acd", summary: "The protagonist discovers the ancient map" },
          { title: "The meeting", plotline: "Romance", color: "#e84393", summary: "First encounter with the mysterious stranger" },
          { title: "Night escape", plotline: "Main Plot", color: "#6d5acd", summary: "Fleeing the castle under moonlight" },
        ].map((scene, i) => (
          <div
            key={i}
            style={{
              padding: "14px 24px",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              borderBottom: i < 2 ? `1px solid ${BORDER}60` : "none",
              position: "relative",
            }}
          >
            {/* Plotline accent */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: scene.color }} />
            {/* Status dot */}
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#d4d4d8", marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{scene.title}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "white",
                    background: scene.color,
                    borderRadius: 999,
                    padding: "2px 8px",
                  }}
                >
                  {scene.plotline}
                </span>
              </div>
              <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{scene.summary}</p>
              {/* Write button */}
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    color: i === 0 ? BRAND : MUTED,
                    background: i === 0 ? `${BRAND}12` : "transparent",
                    transform: i === 0 ? `scale(${clickScale})` : "none",
                    border: i === 0 && highlightOpacity > 0.5 ? `2px solid ${BRAND}40` : "2px solid transparent",
                    transition: "all 0.2s",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                  Write in Google Docs
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Animated cursor */}
      {frame > 50 && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            opacity: fadeIn(frame, 50, 10),
            filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.3))",
            zIndex: 10,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1">
            <path d="M5 3l14 8-6 2-4 6z" />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ─── Scene 3: Doc being created (loading) ────────────────────────── */

const CreatingDoc: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spinAngle = frame * 6;
  const progressSpring = spring({ frame: frame - 30, fps, config: { damping: 20, stiffness: 60 } });
  const checkOpacity = fadeIn(frame, 60, 10);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 80,
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: BRAND,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            2
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#18181b" }}>
            plotamour creates a Google Doc
          </span>
        </div>
        <p style={{ fontSize: 18, color: MUTED, marginLeft: 44 }}>
          Using the <code style={{ background: "#f0ecff", color: BRAND, padding: "2px 6px", borderRadius: 4, fontSize: 16 }}>documents</code> scope to create a new doc with scene context
        </p>
      </div>

      {/* API calls visualization */}
      <div
        style={{
          background: CARD_BG,
          borderRadius: 16,
          border: `1px solid ${BORDER}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Step 1: Create document */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {frame < 60 ? (
            <div style={{ width: 28, height: 28, position: "relative" }}>
              <svg width="28" height="28" style={{ transform: `rotate(${spinAngle}deg)` }}>
                <circle cx="14" cy="14" r="11" fill="none" stroke={`${BRAND}30`} strokeWidth="3" />
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke={BRAND}
                  strokeWidth="3"
                  strokeDasharray="40 30"
                />
              </svg>
            </div>
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: checkOpacity,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          )}
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#18181b" }}>
              POST /v1/documents
            </p>
            <p style={{ fontSize: 13, color: MUTED }}>
              Creates &quot;The Lost Kingdom &mdash; Ch1: Opening scene&quot;
            </p>
          </div>
        </div>

        {/* Step 2: Insert context */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: interpolate(progressSpring, [0, 1], [0.3, 1]) }}>
          {frame < 75 ? (
            <div style={{ width: 28, height: 28, position: "relative" }}>
              {frame > 30 ? (
                <svg width="28" height="28" style={{ transform: `rotate(${spinAngle}deg)` }}>
                  <circle cx="14" cy="14" r="11" fill="none" stroke={`${BRAND}30`} strokeWidth="3" />
                  <circle cx="14" cy="14" r="11" fill="none" stroke={BRAND} strokeWidth="3" strokeDasharray="40 30" />
                </svg>
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e4e4e7" }} />
              )}
            </div>
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          )}
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#18181b" }}>
              POST /v1/documents/&#123;id&#125;:batchUpdate
            </p>
            <p style={{ fontSize: 13, color: MUTED }}>
              Inserts scene summary, characters, and setting as context
            </p>
          </div>
        </div>

        {/* Step 3: Save link */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: frame > 75 ? 1 : 0.3 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: frame > 80 ? "#22c55e" : "#e4e4e7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {frame > 80 && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#18181b" }}>
              Save doc link to database
            </p>
            <p style={{ fontSize: 13, color: MUTED }}>
              Links the Google Doc back to the scene in plotamour
            </p>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─── Scene 4: Google Doc with context ──────────────────────────── */

const DocPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardY = slideUp(frame, fps, 0);
  const typingProgress = interpolate(frame, [40, 120], [0, 1], { extrapolateRight: "clamp" });
  const fullText = "It was the kind of night that made you believe in fate. The map had been hidden beneath the floorboards for centuries, waiting—";
  const visibleChars = Math.floor(typingProgress * fullText.length);
  const typedText = fullText.slice(0, visibleChars);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 80,
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: BRAND,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            3
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#18181b" }}>
            Google Doc opens with scene context
          </span>
        </div>
        <p style={{ fontSize: 18, color: MUTED, marginLeft: 44 }}>
          The writer starts drafting immediately — word count syncs back to plotamour
        </p>
      </div>

      {/* Google Docs mockup */}
      <div
        style={{
          background: CARD_BG,
          borderRadius: 16,
          border: `1px solid ${BORDER}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          overflow: "hidden",
          transform: `translateY(${cardY}px)`,
        }}
      >
        {/* Google Docs toolbar mockup */}
        <div
          style={{
            background: "#f8f9fa",
            padding: "10px 20px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Google Docs icon */}
          <svg width="24" height="24" viewBox="0 0 24 24">
            <rect x="4" y="2" width="16" height="20" rx="2" fill="#4285F4" />
            <rect x="7" y="7" width="10" height="1.5" rx="0.5" fill="white" />
            <rect x="7" y="10.5" width="8" height="1.5" rx="0.5" fill="white" />
            <rect x="7" y="14" width="10" height="1.5" rx="0.5" fill="white" />
            <rect x="7" y="17.5" width="6" height="1.5" rx="0.5" fill="white" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 500, color: "#18181b" }}>
            The Lost Kingdom &mdash; Ch1: Opening scene
          </span>
        </div>

        {/* Document content */}
        <div style={{ padding: "40px 80px", minHeight: 400 }}>
          {/* Context block (gray, smaller) */}
          <div style={{ color: "#999", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
            <p>plotamour &middot; Chapter 1: Opening scene</p>
            <p style={{ marginTop: 8 }}>Scene: The protagonist discovers the ancient map hidden beneath the castle floorboards</p>
            <p style={{ marginTop: 8 }}>Characters: Elena, Castle Keeper</p>
            <p style={{ marginTop: 8 }}>Setting: Castle Library</p>
            <p style={{ marginTop: 12 }}>---</p>
          </div>

          {/* User's writing (typed in) */}
          <p style={{ fontSize: 18, lineHeight: 1.8, color: "#18181b" }}>
            {typedText}
            {typingProgress < 1 && (
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 22,
                  background: "#18181b",
                  marginLeft: 1,
                  opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                  verticalAlign: "text-bottom",
                }}
              />
            )}
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─── Scene 5: Data access summary ──────────────────────────────── */

const ScopeSummary: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scopes = [
    {
      scope: "documents",
      purpose: "Create new Google Docs for each scene",
      detail: "Inserts scene context (title, summary, characters, setting) so the writer can start drafting immediately",
    },
    {
      scope: "drive.file",
      purpose: "Access only files created by plotamour",
      detail: "plotamour never reads or modifies any other files in the user's Drive — only the docs it creates",
    },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 80,
      }}
    >
      <div style={{ marginBottom: 40, opacity: fadeIn(frame, 0) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: BRAND,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            4
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#18181b" }}>
            Scopes used &amp; why
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {scopes.map((s, i) => {
          const delay = i * 15;
          const opacity = fadeIn(frame, 10 + delay);
          const y = slideUp(frame, fps, 10 + delay);
          return (
            <div
              key={i}
              style={{
                background: CARD_BG,
                borderRadius: 16,
                border: `1px solid ${BORDER}`,
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                padding: 32,
                opacity,
                transform: `translateY(${y}px)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <code
                  style={{
                    background: "#f0ecff",
                    color: BRAND,
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {s.scope}
                </code>
                <span style={{ fontSize: 18, fontWeight: 600, color: "#18181b" }}>{s.purpose}</span>
              </div>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.6 }}>{s.detail}</p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ─── Scene 6: Closing card ────────────────────────────────────── */

const ClosingCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f8f7ff",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${BRAND}18 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      <div style={{ textAlign: "center", transform: `scale(${scale})` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: BRAND,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(109,90,205,0.3)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
            </svg>
          </div>
          <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1 }}>
            plot<span style={{ color: BRAND }}>amour</span>
          </span>
        </div>

        <p style={{ fontSize: 22, color: MUTED, opacity: fadeIn(frame, 15), maxWidth: 500 }}>
          plotamour only creates Google Docs for the user&apos;s own writing.
          <br />
          No other files are accessed.
        </p>

        <p style={{ fontSize: 16, color: `${MUTED}80`, opacity: fadeIn(frame, 30), marginTop: 24 }}>
          www.plotamour.com
        </p>
      </div>
    </AbsoluteFill>
  );
};

/* ─── Main composition ─────────────────────────────────────────── */

export const GoogleDocsDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Scene 1: Title (0s – 5s) */}
      <Sequence from={0} durationInFrames={150}>
        <TitleCard />
      </Sequence>

      {/* Scene 2: Outline view (5s – 15s) */}
      <Sequence from={150} durationInFrames={300}>
        <OutlineScene />
      </Sequence>

      {/* Scene 3: Creating doc (15s – 25s) */}
      <Sequence from={450} durationInFrames={300}>
        <CreatingDoc />
      </Sequence>

      {/* Scene 4: Doc preview with typing (25s – 40s) */}
      <Sequence from={750} durationInFrames={450}>
        <DocPreview />
      </Sequence>

      {/* Scene 5: Scope summary (40s – 52s) */}
      <Sequence from={1200} durationInFrames={360}>
        <ScopeSummary />
      </Sequence>

      {/* Scene 6: Closing card (52s – 60s) */}
      <Sequence from={1560} durationInFrames={240}>
        <ClosingCard />
      </Sequence>
    </AbsoluteFill>
  );
};
