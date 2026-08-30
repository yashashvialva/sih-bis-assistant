import { NextResponse } from 'next/server';
import { extractBISIdentifierFromImage } from '@/lib/bis/extractor';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    // Convert Web File to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call Tesseract OCR Extraction
    const extractionResult = await extractBISIdentifierFromImage(buffer);

    return NextResponse.json({ result: extractionResult });
  } catch (error: any) {
    console.error('API /verify/extract POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
