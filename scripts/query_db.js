import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffgilvzfnsfhlwtukswr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZ2lsdnpmbnNmaGx3dHVrc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3ODE2MjAsImV4cCI6MjA5NDM1NzYyMH0.D9o4Sat7D0CSDTRoV9tal_wNfMapBQ2k_knpkjc5fFc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Counting products and metadata stats...");
  const { count, error: countErr } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  const { count: nonAlteleCategoryCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .neq('category', 'Altele');

  const { count: materialCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .not('productmaterial', 'is', null);

  const { count: colorCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .not('color', 'is', null);

  const { count: dimensionsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .not('dimensions', 'is', null);

  console.log("Stats:");
  console.log(`  Total products: ${count}`);
  console.log(`  Category !== 'Altele': ${nonAlteleCategoryCount}`);
  console.log(`  Material !== null: ${materialCount}`);
  console.log(`  Color !== null: ${colorCount}`);
  console.log(`  Dimensions !== null: ${dimensionsCount}`);
}

run();
