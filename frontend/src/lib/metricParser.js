/**
 * Safely parse narrative quantitative metrics (Market Size/TAM, CAGR) into
 * a concise headline figure and a structured list of breakdown points.
 */
export function parseMetricData(rawText, type = 'tam') {
    if (!rawText || typeof rawText !== 'string') return { headline: '', breakdown: [] };
    const trimmed = rawText.trim();
    if (!trimmed) return { headline: '', breakdown: [] };

    // If it's already a short, clean statistic (e.g. "$4.2B" or "14.5% CAGR")
    if (trimmed.length <= 25) {
        return { headline: trimmed, breakdown: [] };
    }

    let headline = '';
    if (type === 'tam') {
        // Look for combined / total / overall opportunity first
        const combinedMatch = trimmed.match(/(?:combined|total|overall|opportunity)[\w\s,]*?((?:USD|\$)\s*[\d.]+(?:\s*-\s*[\d.]+)?\s*(?:billion|million|trillion|b|m|t)?)/i);
        if (combinedMatch && combinedMatch[1]) {
            headline = combinedMatch[1].trim();
        } else {
            // Find all currency estimates
            const matches = [...trimmed.matchAll(/((?:USD|\$)\s*[\d.]+(?:\s*-\s*[\d.]+)?\s*(?:billion|million|trillion|b|m|t)?)/gi)];
            if (matches.length > 0) {
                headline = matches[matches.length - 1][1].trim();
            }
        }
    } else if (type === 'cagr') {
        const cagrMatches = [...trimmed.matchAll(/(\d+(?:\.\d+)?%(?:\s*-\s*\d+(?:\.\d+)?%)?\s*(?:CAGR)?)/gi)];
        if (cagrMatches.length === 1) {
            headline = cagrMatches[0][1].trim();
        } else if (cagrMatches.length > 1) {
            const first = cagrMatches[0][1].replace(/CAGR/i, '').trim();
            const last = cagrMatches[cagrMatches.length - 1][1].trim();
            headline = `${first} – ${last}`;
            if (!headline.toUpperCase().includes('CAGR')) headline += ' CAGR';
        }
    }

    if (!headline) {
        headline = trimmed.length > 30 ? trimmed.slice(0, 26) + '...' : trimmed;
    }

    // Split detailed sentences or semicolons into clean readable points
    const breakdown = trimmed
        .split(/;\s*|\.\s+(?=[A-Z])/)
        .map(s => s.trim().replace(/\.$/, ''))
        .filter(s => s.length > 8);

    return { headline, breakdown };
}
