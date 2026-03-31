// Layer 3: Services — PDF generation via @react-pdf/renderer

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ExportData } from "./export";
import type { ManuscriptData } from "./manuscript";

// ─── Shared styles ──────────────────────────────────────────────────────────

const colors = {
  text: "#1a1a1a",
  muted: "#666666",
  light: "#999999",
  accent: "#6366f1",
  border: "#dddddd",
};

// ─── Manuscript PDF ─────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 72,
    paddingHorizontal: 72,
    fontFamily: "Times-Roman",
    fontSize: 12,
    lineHeight: 2,
    color: colors.text,
  },
  titlePage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bookTitle: {
    fontSize: 24,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: "center",
  },
  projectTitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 24,
    textAlign: "center",
  },
  wordCount: {
    fontSize: 11,
    color: colors.light,
    textAlign: "center",
  },
  chapterTitle: {
    fontSize: 18,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 120,
    marginBottom: 40,
  },
  sceneBreak: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: 14,
    letterSpacing: 4,
    color: colors.muted,
  },
  paragraph: {
    textIndent: 36,
    marginBottom: 0,
  },
  firstParagraph: {
    textIndent: 0,
    marginBottom: 0,
  },
  pageNumber: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    color: colors.light,
  },
});

function ManuscriptPdf({ data }: { data: ManuscriptData }) {
  let currentChapter = -1;
  let isFirstInChapter = true;

  const contentElements: React.ReactElement[] = [];

  for (const scene of data.scenes) {
    // Chapter heading
    if (scene.chapterIndex !== currentChapter) {
      currentChapter = scene.chapterIndex;
      isFirstInChapter = true;
      contentElements.push(
        <Text key={`ch-${scene.chapterIndex}`} style={ms.chapterTitle} break={contentElements.length > 0}>
          {scene.chapterTitle}
        </Text>
      );
    }

    // Scene separator
    if (!isFirstInChapter) {
      contentElements.push(
        <Text key={`sep-${scene.chapterIndex}-${scene.sceneIndex}`} style={ms.sceneBreak}>
          * * *
        </Text>
      );
    }
    isFirstInChapter = false;

    // Scene paragraphs
    const paragraphs = scene.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    paragraphs.forEach((para, pIdx) => {
      contentElements.push(
        <Text
          key={`p-${scene.chapterIndex}-${scene.sceneIndex}-${pIdx}`}
          style={pIdx === 0 ? ms.firstParagraph : ms.paragraph}
        >
          {para}
        </Text>
      );
    });
  }

  return (
    <Document title={data.bookTitle} author="plotamour">
      {/* Title page */}
      <Page size="LETTER" style={ms.page}>
        <View style={ms.titlePage}>
          <Text style={ms.bookTitle}>{data.bookTitle}</Text>
          {data.projectTitle !== data.bookTitle && (
            <Text style={ms.projectTitle}>{data.projectTitle}</Text>
          )}
          <Text style={ms.wordCount}>
            {data.totalWords.toLocaleString()} words
          </Text>
        </View>
      </Page>

      {/* Content pages */}
      <Page size="LETTER" style={ms.page}>
        {contentElements}
        <Text
          style={ms.pageNumber}
          render={({ pageNumber }) => `${pageNumber}`}
          fixed
        />
      </Page>
    </Document>
  );
}

// ─── Outline PDF ────────────────────────────────────────────────────────────

const ol = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.text,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 20,
    marginBottom: 10,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  chapterTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
  },
  chapterDesc: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 6,
  },
  sceneCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  sceneTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  plotlineBadge: {
    fontSize: 8,
    color: colors.accent,
    marginBottom: 4,
  },
  sceneSummary: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.5,
    marginBottom: 3,
  },
  sceneConflict: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.4,
  },
  sceneMeta: {
    fontSize: 8,
    color: colors.light,
    marginTop: 3,
  },
  plotlineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  plotlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  plotlineName: {
    fontSize: 10,
  },
  characterName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  characterDesc: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 8,
    lineHeight: 1.4,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: colors.light,
  },
});

function OutlinePdf({ data }: { data: ExportData }) {
  return (
    <Document title={`${data.projectTitle} — Outline`} author="plotamour">
      <Page size="LETTER" style={ol.page} wrap>
        {/* Title */}
        <Text style={ol.title}>{data.projectTitle}</Text>
        {data.bookTitle !== data.projectTitle && (
          <Text style={ol.subtitle}>{data.bookTitle}</Text>
        )}

        {/* Plotlines */}
        <Text style={ol.sectionTitle}>Plotlines</Text>
        {data.plotlines.map((p) => (
          <View key={p.id} style={ol.plotlineItem}>
            <View style={[ol.plotlineDot, { backgroundColor: p.color }]} />
            <Text style={ol.plotlineName}>{p.title}</Text>
          </View>
        ))}

        {/* Chapters & scenes */}
        {data.chapters.map((chapter, chapterIdx) => (
          <View key={chapter.id} wrap={false}>
            <Text style={ol.chapterTitle}>
              Chapter {chapterIdx + 1}: {chapter.title}
            </Text>
            {chapter.description ? (
              <Text style={ol.chapterDesc}>{chapter.description}</Text>
            ) : null}

            {chapter.scenes.map((scene) => (
              <View
                key={scene.id}
                style={[ol.sceneCard, { borderLeftColor: scene.plotlineColor }]}
                wrap={false}
              >
                <Text style={ol.sceneTitle}>{scene.title}</Text>
                <Text style={ol.plotlineBadge}>{scene.plotlineTitle}</Text>
                {scene.summary ? (
                  <Text style={ol.sceneSummary}>{scene.summary}</Text>
                ) : null}
                {scene.conflict ? (
                  <Text style={ol.sceneConflict}>
                    Conflict: {scene.conflict}
                  </Text>
                ) : null}
                {(scene.characters.length > 0 || scene.places.length > 0) && (
                  <Text style={ol.sceneMeta}>
                    {scene.characters.length > 0 &&
                      `Characters: ${scene.characters.join(", ")}`}
                    {scene.characters.length > 0 && scene.places.length > 0 &&
                      "  ·  "}
                    {scene.places.length > 0 &&
                      `Places: ${scene.places.join(", ")}`}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Characters */}
        {data.characters.length > 0 && (
          <View>
            <Text style={ol.sectionTitle}>Characters</Text>
            {data.characters.map((c) => (
              <View key={c.id} style={{ marginBottom: 4 }}>
                <Text style={ol.characterName}>{c.name}</Text>
                {c.description ? (
                  <Text style={ol.characterDesc}>{c.description}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Places */}
        {data.places.length > 0 && (
          <View>
            <Text style={ol.sectionTitle}>Places</Text>
            {data.places.map((p) => (
              <View key={p.id} style={{ marginBottom: 4 }}>
                <Text style={ol.characterName}>{p.name}</Text>
                {p.description ? (
                  <Text style={ol.characterDesc}>{p.description}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <Text
          style={ol.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function renderManuscriptPdf(data: ManuscriptData): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<ManuscriptPdf data={data} />);
  return new Uint8Array(buffer);
}

export async function renderOutlinePdf(data: ExportData): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<OutlinePdf data={data} />);
  return new Uint8Array(buffer);
}
