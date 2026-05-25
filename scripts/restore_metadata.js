import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://ffgilvzfnsfhlwtukswr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZ2lsdnpmbnNmaGx3dHVrc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3ODE2MjAsImV4cCI6MjA5NDM1NzYyMH0.D9o4Sat7D0CSDTRoV9tal_wNfMapBQ2k_knpkjc5fFc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FILES = [
    '../src/stoc_1bn1_deposit.json',
    '../src/stoc_1bn1_expo.json',
    '../src/stoc_1bv1_deposit.json',
    '../src/stoc_1bv1_expo.json'
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log('---------------------------------------------------------');
    console.log('🚀 Romstal Companion Database Metadata Restore');
    console.log('---------------------------------------------------------');
    console.log('This script will restore category, material, color, and dimensions metadata to Supabase.');
    console.log('Please log in with your application user account.\n');

    let email = process.env.SUPABASE_EMAIL || process.argv[2];
    let password = process.env.SUPABASE_PASSWORD || process.argv[3];

    if (!email || !password) {
        email = await question('📧 Email/Username: ');
        password = await question('🔑 Password: ');
    }
    rl.close();

    console.log('\nLogging in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
    });

    if (authError) {
        console.error('❌ Login failed:', authError.message);
        process.exit(1);
    }

    console.log('✅ Logged in successfully!');
    
    for (const filePath of FILES) {
        const fullPath = path.resolve(__dirname, filePath);
        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️ File not found: ${filePath}`);
            continue;
        }

        console.log(`\n📄 Processing ${filePath}...`);
        const raw = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(raw);
        console.log(`Loaded ${data.length} products. Restoring metadata...`);

        const BATCH_SIZE = 400;
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const chunk = data.slice(i, i + BATCH_SIZE);
            const batch = chunk.map(p => ({
                code: p.code,
                store: p.store,
                storage: p.storage,
                category: p.category,
                productmaterial: p.productMaterial,
                color: p.color,
                dimensions: p.dimensions
            }));

            const { error } = await supabase
                .from('products')
                .upsert(batch, { onConflict: 'code,store,storage' });

            if (error) {
                console.error(`❌ Error at batch ${i / BATCH_SIZE + 1}:`, error.message);
            } else {
                process.stdout.write(`🚀 Restored ${Math.min(i + BATCH_SIZE, data.length)}/${data.length} products...\r`);
            }
        }
        console.log(`\n✨ Finished ${filePath}`);
    }

    console.log('\n🎉 ALL DONE! Metadata restore completed successfully!');
}

main().catch(console.error);
