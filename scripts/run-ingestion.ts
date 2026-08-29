import * as dotenv from 'dotenv';
import path from 'path';

// Load env before importing other modules
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { runIngestionPipeline } from '../src/lib/ingestion/pipeline';
import type { IngestionInput } from '../src/lib/ingestion/types';

async function main() {
  console.log('Starting BIS Compliance Assistant Ingestion CLI...');
  console.log('Environment:', {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing',
    groqApiKey: process.env.GROQ_API_KEY ? 'Configured' : 'Missing',
  });

  const input: IngestionInput = {};

  // Parse simple CLI args if provided
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--standard' && args[i + 1]) {
      input.standardNumber = args[i + 1];
      i++;
    } else if (args[i] === '--product' && args[i + 1]) {
      input.productCategory = args[i + 1];
      i++;
    } else if (args[i] === '--url' && args[i + 1]) {
      input.urls = [args[i + 1]];
      i++;
    }
  }

  console.log('Input parameters:', input);
  console.log('Initializing pipeline...\n');

  try {
    const jobId = await runIngestionPipeline(input, 'MANUAL');
    console.log(`\nPipeline started successfully! Job ID: ${jobId}`);
    console.log('Check the database or admin UI for progress.');
    
    // We let the process exit, since runIngestionPipeline runs asynchronously 
    // but in a CLI context, we would normally wait for it. For now, since 
    // runIngestionPipeline fires and returns jobId, we'll wait 5 seconds then exit.
    console.log('Waiting 5s for initial logs...');
    setTimeout(() => {
      console.log('Exiting CLI. The pipeline might still be running in the background if run via server, but in CLI it will terminate. If you need it to run fully, use the Admin UI.');
      process.exit(0);
    }, 5000);
  } catch (error) {
    console.error('Failed to start ingestion:', error);
    process.exit(1);
  }
}

main();
