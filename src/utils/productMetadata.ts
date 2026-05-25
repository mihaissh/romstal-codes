import type { ProductDimensions } from "@/types/Product";

export interface ParsedMeta {
    category: string;
    productMaterial: string | null;
    color: string | null;
    dimensions: ProductDimensions;
}

export function parseMetaFromName(name: string): ParsedMeta {
    const nameUpper = name.toUpperCase();
    
    // 1. Category
    let category = "Altele";
    if (/\bCOT\b/.test(nameUpper)) category = "Coturi";
    else if (/\bTEAVA\b|\bTEVI\b/.test(nameUpper)) category = "Teava";
    else if (/\bTEU\b/.test(nameUpper)) category = "Teu";
    else if (/\bMUFA\b/.test(nameUpper)) category = "Mufa";
    else if (/\bROBINET\b|\bROB\b/.test(nameUpper)) category = "Robineti";
    else if (/\bREDUCTIE\b|\bRED\b/.test(nameUpper)) category = "Reductie";
    else if (/\bDOP\b/.test(nameUpper)) category = "Dop";
    else if (/\bNIPLU\b/.test(nameUpper)) category = "Niplu";
    else if (/\bRACORD\b/.test(nameUpper)) category = "Racord";
    else if (/\bBRATARA\b/.test(nameUpper)) category = "Bratara";
    else if (/\bCRUCE\b/.test(nameUpper)) category = "Cruce";
    else if (/\bFLANSA\b|\bCOLLER\b/.test(nameUpper)) category = "Flanse/Coller";
    else if (/\bOVERPASS\b|\bOCOLIRE\b/.test(nameUpper)) category = "Ocolire";
    
    // 2. Material
    let productMaterial: string | null = null;
    if (/\bPPR\b/.test(nameUpper)) productMaterial = "PPR";
    else if (/\bPVC\b/.test(nameUpper)) productMaterial = "PVC";
    else if (/\bPEHD\b/.test(nameUpper)) productMaterial = "PEHD";
    else if (/\bALAMA\b|\bBRONZ\b/.test(nameUpper)) productMaterial = "Alama";
    else if (/\bCUPRU\b|\bCU\b/.test(nameUpper)) productMaterial = "Cupru";
    else if (/\bFONTA\b/.test(nameUpper)) productMaterial = "Fonta";
    else if (/\bINOX\b/.test(nameUpper)) productMaterial = "Inox";
    
    // 3. Color
    let color: string | null = null;
    if (/\bALB\b|\bALBA\b/.test(nameUpper)) color = "Alb";
    else if (/\bGRI\b/.test(nameUpper)) color = "Gri";
    else if (/\bNEGRU\b|\bNEAGRA\b/.test(nameUpper)) color = "Negru";
    else if (/\bALBASTRU\b|\bALBASTRA\b/.test(nameUpper)) color = "Albastru";
    else if (/\bVERDE\b/.test(nameUpper)) color = "Verde";
    
    // 4. Dimensions (Diameter, Angle, Thread)
    const dimensions: ProductDimensions = {};
    
    // Angle
    const angleMatch = nameUpper.match(/\b(90|45|30|67|87|22\.5)\s*(?:GRD|G|GRAD|°)/i) || 
                       nameUpper.match(/\b(90|45|30|67|87)\b/);
    if (angleMatch) {
        const val = parseFloat(angleMatch[1]);
        if ([90, 45, 30, 67, 87, 22.5].includes(val)) {
            // Confirm it's not preceded by D (diameter indicator)
            const idx = nameUpper.indexOf(angleMatch[0]);
            const prefix = nameUpper.slice(Math.max(0, idx - 4), idx);
            if (!/D\s*\.?\s*$/i.test(prefix)) {
                dimensions.angle = val;
            }
        }
    }
    
    // Diameter
    const diameterMatch = nameUpper.match(/(?:D\.|D\s+|D|⌀\s*)(\d+)(?:\s*MM)?\b/i) ||
                          nameUpper.match(/\b(16|20|25|32|40|50|63|75|90|110|125|160)\s*MM\b/i);
    if (diameterMatch) {
        const val = parseInt(diameterMatch[1], 10);
        dimensions.diameter = val;
    }
    
    // Thread size
    const threadMatches = nameUpper.matchAll(/((?:1\s+)?(?:1\/2|3\/4|1\/4|3\/8|1|2|1\s*1\/2|1\s*1\/4|3|4))"/gi);
    const threads: string[] = [];
    for (const match of threadMatches) {
        threads.push(match[1].trim());
    }
    if (threads.length > 0) {
        dimensions.threadSize = threads;
    }
    
    return {
        category,
        productMaterial,
        color,
        dimensions
    };
}
