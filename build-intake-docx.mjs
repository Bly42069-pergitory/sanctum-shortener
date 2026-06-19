#!/usr/bin/env node
/**
 * Generates assets/MSR-Client-Intake-Questionnaire.docx
 * Run: npm install docx && node build-intake-docx.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  LevelFormat,
  ShadingType,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "assets", "MSR-Client-Intake-Questionnaire.docx");

const GOLD = "9A7B1A";
const MUTED = "666666";

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, ...opts })],
  });
}
function blank() {
  return new Paragraph({ children: [new TextRun("")] });
}
function fieldRow(label) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 2800, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 6560, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun(" ")] })],
        borders: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          top: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
      }),
    ],
  });
}
function checkItem(text, ref = "checks") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: [new TextRun(text)],
  });
}

const sectionProps = {
  page: {
    size: { width: 12240, height: 15840 },
    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
  },
};

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: GOLD },
        paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "checks",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "☐",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: sectionProps,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "MASTER SANCTUM RESTORATION", bold: true, size: 28, color: GOLD }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "Luxury Natural Stone & Marble Conservation", italics: true, size: 22 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [new TextRun({ text: "Client Intake Questionnaire", bold: true, size: 32 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "Protecting What Endures", italics: true, color: MUTED })],
        }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2800, 3280, 3280],
          rows: [
            new TableRow({
              children: ["Date", "Intake ID", "Gatekeeper"].map((h) =>
                new TableCell({
                  shading: { fill: "F5F0E6", type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                })
              ),
            }),
            new TableRow({
              children: [0, 1, 2].map(() =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun(" ")] })],
                })
              ),
            }),
          ],
        }),
        blank(),
        h2("Section A — Contact Information"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2800, 6560],
          rows: [
            fieldRow("Full name"),
            fieldRow("Phone"),
            fieldRow("Email"),
            fieldRow("Property address"),
            fieldRow("City / State / ZIP"),
            fieldRow("Preferred contact"),
            fieldRow("Best time to reach"),
            fieldRow("Role at property"),
          ],
        }),
        blank(),
        h2("Section B — Project Overview"),
        p("1. Surfaces needing restoration (check all that apply):"),
        checkItem("Kitchen countertop"),
        checkItem("Bathroom vanity"),
        checkItem("Shower / tub surround"),
        checkItem("Floor"),
        checkItem("Fireplace surround"),
        checkItem("Exterior stone"),
        checkItem("Monument / memorial"),
        checkItem("Lobby / commercial"),
        checkItem("Other: _________________________"),
        blank(),
        p("2. Stone type:"),
        checkItem("Marble"),
        checkItem("Granite"),
        checkItem("Limestone"),
        checkItem("Travertine"),
        checkItem("Quartzite"),
        checkItem("Engineered quartz"),
        checkItem("Unknown — need assessment"),
        blank(),
        fieldRow("3. Approximate square footage or dimensions"),
        blank(),
        p("4. Primary concerns (check all that apply):"),
        checkItem("Etching (acid / citrus)"),
        checkItem("Stains"),
        checkItem("Scratches / wear"),
        checkItem("Dull / lost polish"),
        checkItem("Lippage (uneven tiles)"),
        checkItem("Cracks / chips"),
        checkItem("Previous poor repair"),
        checkItem("Water damage"),
        blank(),
        fieldRow("5. How long has the issue been present?"),
        fieldRow("6. Prior work on this stone? Describe:"),
        blank(),
        h2("Section C — Property & Access"),
        p("Property type:"),
        checkItem("Single-family"),
        checkItem("Condo / HOA"),
        checkItem("Commercial"),
        checkItem("Hospitality"),
        checkItem("Historical"),
        blank(),
        fieldRow("Occupancy during work"),
        fieldRow("Access notes (gates, parking, pets)"),
        fieldRow("HOA / building approval required?"),
        blank(),
        h2("Section D — Timeline & Budget"),
        fieldRow("Desired start window"),
        fieldRow("Hard deadline (if any)"),
        p("Budget range (helps scope correctly):"),
        checkItem("Under $1,500"),
        checkItem("$1,500 – $3,500"),
        checkItem("$3,500 – $7,500"),
        checkItem("$7,500 – $15,000"),
        checkItem("$15,000+"),
        checkItem("Prefer estimate first"),
        blank(),
        h2("Section E — Documentation"),
        p("Can you provide photos?"),
        checkItem("Yes — attached / sent separately"),
        checkItem("Can take today"),
        checkItem("Need guidance"),
        blank(),
        p("Photo checklist:"),
        checkItem("Wide shot of full area"),
        checkItem("Close-up of worst damage"),
        checkItem("Edge / seam detail"),
        checkItem("Prior repair areas"),
        blank(),
        h2("Section F — Process Acknowledgment"),
        p("Master Sanctum follows conservation discipline: Assessment → Restoration → Protection."),
        checkItem("I understand an on-site assessment is required before a firm quote"),
        checkItem("I understand timelines depend on stone type, scope, and seal/cure time"),
        checkItem("I understand restoration is hand-finished — not a rushed contractor pass"),
        blank(),
        fieldRow("Additional notes or questions"),
        blank(),
        new Paragraph({
          spacing: { before: 400 },
          children: [
            new TextRun({
              text: "Next step: Gatekeeper review → site visit scheduling → written scope & estimate → Architect handoff for complex commissions.",
              italics: true,
              size: 20,
              color: MUTED,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 300 },
          children: [
            new TextRun({ text: "Guarded by Marmorax · Master Sanctum Restoration", italics: true, color: GOLD }),
          ],
        }),
      ],
    },
  ],
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log("Wrote", OUT, "(" + buffer.length + " bytes)");
