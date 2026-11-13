import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Applique un filigrane visible et nominatif.
 *
 * Retourne `null` pour les formats non pris en charge : l'appelant décide
 * alors d'envoyer le fichier original via une URL signée.
 */
export async function watermarkBytes(params: {
  bytes: Uint8Array;
  contentType: string;
  text: string;
}): Promise<Uint8Array | null> {
  const { bytes, contentType, text } = params;

  if (contentType.startsWith("image/")) {
    const width = 900;
    const svg = Buffer.from(
      `<svg width="${width}" height="48" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="rgba(255,255,255,0.55)"/>
        <text x="12" y="30" font-family="Arial, Helvetica, sans-serif" font-size="14"
          fill="rgba(20,20,20,0.65)">${escapeXml(text)}</text>
      </svg>`,
    );

    return sharp(Buffer.from(bytes))
      .composite([{ input: svg, gravity: "southeast" }])
      .toBuffer();
  }

  if (contentType === "application/pdf") {
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    for (const page of pdf.getPages()) {
      page.drawText(text, {
        x: 24,
        y: 18,
        size: 8,
        font,
        color: rgb(0.25, 0.25, 0.25),
        opacity: 0.55,
      });
    }

    return pdf.save();
  }

  return null;
}
