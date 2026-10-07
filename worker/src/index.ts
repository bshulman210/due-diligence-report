import { renderReport } from './pdf';
import { runSearches } from './search';

interface Env {
    SERPER_API_KEY: string;
}

const TIME_ZONE = 'America/New_York';

function json(body: unknown, status: number): Response {
    return Response.json(body, { status });
}

function easternParts(date: Date): Record<string, string> {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).formatToParts(date);
    return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

function contentDisposition(filename: string): string {
    const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

async function handleSearch(request: Request, env: Env): Promise<Response> {
    let form: FormData;
    try {
        form = await request.formData();
    } catch {
        return json({ error: 'Invalid form submission.' }, 400);
    }

    const fields: Record<string, string> = {};
    for (const key of ['name', 'city', 'state']) {
        const value = form.get(key);
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if (!trimmed && key === 'name') {
            return json({ error: `The ${key} field is required.` }, 422);
        }
        if (trimmed.length > 255) {
            return json({ error: `The ${key} field must not be greater than 255 characters.` }, 422);
        }
        fields[key] = trimmed;
    }

    try {
        const results = await runSearches(env.SERPER_API_KEY, fields.name, fields.city, fields.state);

        const now = new Date();
        const p = easternParts(now);
        const generatedAt = `${p.month} ${p.day}, ${p.year} at ${p.hour}:${p.minute} ${p.dayPeriod} ET`;

        const pdf = await renderReport({ name: fields.name, city: fields.city, state: fields.state, results, generatedAt });

        const date = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, month: '2-digit', day: '2-digit', year: '2-digit' })
            .format(now)
            .replaceAll('/', '.');
        const filename = `${fields.name}_Open Source_No Relevant Negative News Found_${date}.pdf`;

        return new Response(pdf, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': contentDisposition(filename),
            },
        });
    } catch (e) {
        console.error(e);
        return json({ error: e instanceof Error ? e.message : 'Unexpected error.' }, 500);
    }
}

export default {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === '/search') {
            if (request.method !== 'POST') {
                return json({ error: 'Method not allowed.' }, 405);
            }
            return handleSearch(request, env);
        }

        return json({ error: 'Not found.' }, 404);
    },
} satisfies ExportedHandler<Env>;
