export function buildProductTokens(name: string, code: string): string[] {
    const fromName = name
        .toLowerCase()
        .normalize("NFKD")
        .replace(/\p{Diacritic}/gu, "")
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 1);

    const codeLower = code.toLowerCase().trim();
    const fromCode = codeLower.match(/\d+/g) ?? [];

    return [...new Set([...fromName, codeLower, ...fromCode])];
}
