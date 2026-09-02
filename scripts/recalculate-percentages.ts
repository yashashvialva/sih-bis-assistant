import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Recalculating completion percentages for all roadmaps...');
  
  const { data: roadmaps, error: rmError } = await supabase.from('roadmaps').select('id');
  if (rmError) throw rmError;

  for (const rm of roadmaps) {
    const { data: steps } = await supabase
      .from('roadmap_steps')
      .select('status')
      .eq('roadmap_id', rm.id);

    if (steps) {
      const totalSteps = steps.length;
      const completedSteps = steps.filter(s => s.status === 'COMPLETED').length;
      const percentage = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

      await supabase
        .from('roadmaps')
        .update({ completion_percentage: percentage })
        .eq('id', rm.id);
        
      console.log(`Roadmap ${rm.id}: ${percentage}%`);
    }
  }
  
  console.log('Done recalculating roadmaps.');
}

main().catch(console.error);
