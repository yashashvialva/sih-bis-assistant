import { pipeline } from '@xenova/transformers';
import { EMBEDDING_MODEL } from './config';

// Singleton for embedding pipeline to prevent reloading
let embeddingPipeline: any = null;

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    if (!embeddingPipeline) {
      // Create pipeline only once
      embeddingPipeline = await pipeline('feature-extraction', EMBEDDING_MODEL, {
        quantized: true, // Use quantized for performance if needed
      });
    }

    const output = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true,
    });
    
    // Output is a tensor, convert to array
    const embedding = Array.from(output.data);
    return embedding as number[];
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    throw new Error('Embedding generation failed.');
  }
}
