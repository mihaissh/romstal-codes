import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://ffgilvzfnsfhlwtukswr.supabase.co';
// IMPORTANT: Use the SERVICE_ROLE_KEY for bulk uploads to bypass RLS
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; 

const BATCH_SIZE = 1000;
const FILES = [
    'src/stoc_1bn1_deposit.json',
    'src/stoc_1bn1_expo.json',
    'src/stoc_1bv1_deposit.json',
    'src/stoc_1bv1_expo.json'
];
// ---------------------

if (SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    console.error('❌ Error: Please provide your Supabase SERVICE_ROLE_KEY in the script.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function uploadFile(filePath) {
    console.log(`\n📄 Processing ${filePath}...`);
    const fullPath = path.resolve(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ File not found: ${filePath}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    console.log(`✅ Loaded ${data.length} products.`);

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        
        // Ensure all fields match the database schema and remove duplicates within the batch
        const seen = new Set();
        const formattedBatch = batch
            .map(p => ({
                code: p.code,
                name: p.name,
                category: p.category,
                productmaterial: p.productMaterial,
                color: p.color,
                dimensions: p.dimensions,
                stock: p.stock,
                unit: p.unit,
                value: p.value,
                store: p.store,
                storename: p.storeName,
                storage: p.storage,
                storagedesc: p.storageDesc,
                tokens: p.tokens
            }))
            .filter(p => {
                const key = `${p.code}-${p.store}-${p.storage}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

        const { error } = await supabase
            .from('products')
            .upsert(formattedBatch, { onConflict: 'code,store,storage' });

        if (error) {
            console.error(`❌ Error uploading batch ${i / BATCH_SIZE + 1}:`, error.message);
        } else {
            process.stdout.write(`🚀 Uploaded ${Math.min(i + BATCH_SIZE, data.length)}/${data.length} products...\r`);
        }
    }
    console.log(`\n✨ Finished ${filePath}`);
}

async function main() {
    console.log('🏁 Starting bulk upload to Supabase...');
    for (const file of FILES) {
        await uploadFile(file);
    }
    console.log('\n🎉 ALL DONE!');
}

main().catch(console.error);
