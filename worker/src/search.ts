export interface SearchLink {
    title: string;
    url: string;
    snippet: string;
}

export interface SearchResult {
    label: string;
    query: string;
    links: SearchLink[];
    totalResults: string;
}

const QUERY_TEMPLATES = [
    'AND breach OR charge OR crime OR fraud OR laundering OR guilt OR scam OR bankrupt OR allege OR embezzle OR sanction OR investigate OR lawsuit OR corrupt OR arrest',
    'fraud OR lien OR judgment OR suit OR convict OR investigate OR allege OR crime OR scheme OR inquiry OR settle',
    'plea OR barred OR terrorist OR traffic OR narcotic OR judgment OR criminal OR bribe OR scam OR launder OR corrupt OR charges OR hearing OR civil OR corruption',
];

const QUERY_LABELS = [
    'Search 1: Criminal & Financial Red Flags',
    'Search 2: Legal & Fraud Indicators',
    'Search 3: Criminal & Corruption Keywords',
];

export function buildQuery(name: string, cityState: string, queryIndex: number): string {
    const location = cityState !== '' ? ` + ${cityState}` : '';

    return `${name}${location} ${QUERY_TEMPLATES[queryIndex]}`;
}

async function executeSearch(apiKey: string, query: string): Promise<{ links: SearchLink[]; totalResults: string }> {
    const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, gl: 'us', hl: 'en', num: 20 }),
    });

    if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(`Serper API error: ${body.message ?? 'Unknown API error'}`);
    }

    const data = (await response.json()) as {
        organic?: { title?: string; link?: string; snippet?: string }[];
        searchParameters?: { totalResults?: number | string };
    };

    const links = (data.organic ?? []).map((item) => ({
        title: item.title ?? 'No title',
        url: item.link ?? '',
        snippet: item.snippet ?? '',
    }));

    const total = Math.trunc(Number(data.searchParameters?.totalResults ?? links.length)) || 0;

    return { links, totalResults: total.toLocaleString('en-US') };
}

export async function runSearches(apiKey: string, name: string, city: string, state: string): Promise<SearchResult[]> {
    if (!apiKey) {
        throw new Error('Serper API key is not configured. Set the SERPER_API_KEY secret.');
    }

    const cityState = [city.trim(), state.trim()].filter(Boolean).join(', ');

    return Promise.all(
        QUERY_LABELS.map(async (label, i) => {
            const query = buildQuery(name, cityState, i);
            const { links, totalResults } = await executeSearch(apiKey, query);
            return { label, query, links, totalResults };
        }),
    );
}
