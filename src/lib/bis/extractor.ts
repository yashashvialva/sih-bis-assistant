import { createWorker, Worker } from 'tesseract.js';

export interface ExtractionResult {
  licenceNumber: string | null;
  confidence: number;
  extractedText: string;
  source: 'IMAGE';
}

/**
 * Extracts text from an image buffer and attempts to find a BIS CM/L or R number.
 */
export async function extractBISIdentifierFromImage(imageBuffer: Buffer): Promise<ExtractionResult> {
  let worker: Worker | null = null;
  try {
    worker = await createWorker('eng');
    
    // Pass the buffer to tesseract
    const { data } = await worker.recognize(imageBuffer);
    const extractedText = data.text;
    
    // Average confidence of the OCR
    const confidence = data.confidence / 100;

    // Regex for BIS Identifiers
    // CM/L-XXXXXXX (can have spaces, hyphens, and 7 to 10 digits)
    const cmlRegex = /CM\s*\/\s*L\s*-?\s*(\d{7,10})/i;
    // Registration Number R-XXXXXXXX
    const rNumberRegex = /R\s*-?\s*(\d{8})/i;

    let licenceNumber: string | null = null;

    const cmlMatch = extractedText.match(cmlRegex);
    const rMatch = extractedText.match(rNumberRegex);

    if (cmlMatch) {
      // Normalize format to CM/L-XXXXXXX
      licenceNumber = `CM/L-${cmlMatch[1]}`;
    } else if (rMatch) {
      // Normalize format to R-XXXXXXXX
      licenceNumber = `R-${rMatch[1]}`;
    }

    return {
      licenceNumber,
      confidence,
      extractedText,
      source: 'IMAGE'
    };
  } catch (error) {
    console.error("OCR Extraction failed:", error);
    throw new Error("Failed to process image");
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
