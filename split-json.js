const fs = require('fs');
const path = require('path');

// Split 1BV1
const data1bv1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'stoc_1bv1.json'), 'utf8'));

const deposit1bv1 = data1bv1.filter(p => p['Loc de depozitare'] === '1V00' || p['Descr.loc.depozitare'] === 'Vanzare Marfa');
const expo1bv1 = data1bv1.filter(p => p['Loc de depozitare'] === '1V06' || p['Descr.loc.depozitare'] === 'EXPO');

fs.writeFileSync(
    path.join(__dirname, 'src', 'stoc_1bv1_deposit.json'),
    JSON.stringify(deposit1bv1, null, 2),
    'utf8'
);

fs.writeFileSync(
    path.join(__dirname, 'src', 'stoc_1bv1_expo.json'),
    JSON.stringify(expo1bv1, null, 2),
    'utf8'
);

console.log(`1BV1 Deposit: ${deposit1bv1.length} products`);
console.log(`1BV1 EXPO: ${expo1bv1.length} products`);

// Split 1BN1 (only has deposit, but split for consistency)
const data1bn1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'stoc_1bn1.json'), 'utf8'));

const deposit1bn1 = data1bn1.filter(p => p['Loc de depozitare'] === '1V00' || p['Descr.loc.depozitare'] === 'Vanzare Marfa' || !p['Descr.loc.depozitare'] || p['Descr.loc.depozitare'] === '');
const expo1bn1 = data1bn1.filter(p => p['Loc de depozitare'] === '1V06' || p['Descr.loc.depozitare'] === 'EXPO');

fs.writeFileSync(
    path.join(__dirname, 'src', 'stoc_1bn1_deposit.json'),
    JSON.stringify(deposit1bn1, null, 2),
    'utf8'
);

fs.writeFileSync(
    path.join(__dirname, 'src', 'stoc_1bn1_expo.json'),
    JSON.stringify(expo1bn1, null, 2),
    'utf8'
);

console.log(`1BN1 Deposit: ${deposit1bn1.length} products`);
console.log(`1BN1 EXPO: ${expo1bn1.length} products`);

console.log('\n✅ JSON files split successfully!');
