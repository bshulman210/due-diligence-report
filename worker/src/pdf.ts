import { PDFDocument, PDFFont, PDFPage, PDFString, StandardFonts, rgb, type RGB } from 'pdf-lib';
import type { SearchResult } from './search';

export interface ReportData {
    name: string;
    city: string;
    state: string;
    results: SearchResult[];
    generatedAt: string;
}

// US Letter, in points.
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 64;
const MARGIN_Y = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

function hex(color: string): RGB {
    const n = parseInt(color.slice(1), 16);
    return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const COLORS = {
    text: hex('#333333'),
    blue: hex('#2563eb'),
    darkBlue: hex('#1e40af'),
    gray: hex('#6b7280'),
    lightGray: hex('#9ca3af'),
    infoBg: hex('#f0f4ff'),
    infoBorder: hex('#bfdbfe'),
    sectionBorder: hex('#93c5fd'),
    queryBg: hex('#f9fafb'),
    queryBorder: hex('#e5e7eb'),
    site: hex('#4d5156'),
    link: hex('#1a0dab'),
    rule: hex('#d1d5db'),
};

class ReportWriter {
    private page!: PDFPage;
    private y = 0;
    private charset: Set<number>;

    constructor(
        private doc: PDFDocument,
        private regular: PDFFont,
        private bold: PDFFont,
        private italic: PDFFont,
    ) {
        // The standard PDF fonts only cover WinAnsi; anything else would make pdf-lib throw.
        this.charset = new Set(regular.getCharacterSet());
        this.newPage();
    }

    newPage(): void {
        this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        this.y = PAGE_HEIGHT - MARGIN_Y;
    }

    ensureSpace(height: number): void {
        if (this.y - height < MARGIN_Y) {
            this.newPage();
        }
    }

    clean(text: string): string {
        let out = '';
        for (const ch of text.replace(/\s+/g, ' ')) {
            if (this.charset.has(ch.codePointAt(0)!)) {
                out += ch;
                continue;
            }
            const stripped = ch.normalize('NFKD').replace(/[̀-ͯ]/g, '');
            out += [...stripped].every((c) => this.charset.has(c.codePointAt(0)!)) ? stripped : '?';
        }
        return out.trim();
    }

    // pdf-lib's widthOfTextAtSize is slow (it encodes and kerns every call) and wrapping
    // measures a lot of text, so sum cached per-character widths instead.
    private widths = new Map<PDFFont, Map<string, number>>();

    width(text: string, font: PDFFont, size: number): number {
        let table = this.widths.get(font);
        if (!table) this.widths.set(font, (table = new Map()));
        let total = 0;
        for (const ch of text) {
            let w = table.get(ch);
            if (w === undefined) table.set(ch, (w = font.widthOfTextAtSize(ch, 1000)));
            total += w;
        }
        return (total * size) / 1000;
    }

    wrap(text: string, font: PDFFont, size: number, width: number, firstLineWidth = width): string[] {
        const lines: string[] = [];
        const space = this.width(' ', font, size);
        let line = '';
        let lineWidth = 0;
        let max = firstLineWidth;

        const push = () => {
            lines.push(line);
            line = '';
            lineWidth = 0;
            max = width;
        };

        for (const word of text.split(' ')) {
            const wordWidth = this.width(word, font, size);
            if (line && lineWidth + space + wordWidth <= max) {
                line += ' ' + word;
                lineWidth += space + wordWidth;
                continue;
            }
            if (line) push();
            if (wordWidth <= max) {
                line = word;
                lineWidth = wordWidth;
                continue;
            }
            // Break words (usually URLs) that are wider than a whole line.
            for (const ch of word) {
                const w = this.width(ch, font, size);
                if (line && lineWidth + w > max) push();
                line += ch;
                lineWidth += w;
            }
        }
        if (line || lines.length === 0) lines.push(line);
        return lines;
    }

    linesHeight(count: number, size: number, leading = 1.4): number {
        return count * size * leading;
    }

    drawLines(lines: string[], x: number, font: PDFFont, size: number, color: RGB, leading = 1.4): void {
        for (const line of lines) {
            this.y -= size * leading;
            this.page.drawText(line, { x, y: this.y + size * (leading - 1) * 0.5 + size * 0.2, size, font, color });
        }
    }

    centered(text: string, font: PDFFont, size: number, color: RGB): void {
        this.y -= size * 1.3;
        const w = this.width(text, font, size);
        this.page.drawText(text, { x: (PAGE_WIDTH - w) / 2, y: this.y + size * 0.25, size, font, color });
    }

    rule(color: RGB, thickness: number): void {
        this.page.drawLine({
            start: { x: MARGIN_X, y: this.y },
            end: { x: PAGE_WIDTH - MARGIN_X, y: this.y },
            thickness,
            color,
        });
    }

    addLink(url: string, x: number, top: number, width: number, height: number): void {
        const annot = this.doc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [x, top - height, x + width, top],
            Border: [0, 0, 0],
            A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
        });
        this.page.node.addAnnot(this.doc.context.register(annot));
    }

    header(): void {
        this.centered('Open Source Research Report', this.bold, 15, COLORS.darkBlue);
        this.y -= 3;
        this.centered('Confidential - For Internal Use Only', this.regular, 9, COLORS.gray);
        this.y -= 11;
        this.rule(COLORS.blue, 1.5);
        this.y -= 15;
    }

    infoBox(rows: [string, string][]): void {
        const size = 7.5;
        const padX = 11;
        const padY = 8;
        const labelWidth = 90;
        const wrapped = rows.map(([label, value]) => [label, this.wrap(this.clean(value), this.regular, size, CONTENT_WIDTH - padX * 2 - labelWidth)] as const);
        const height = padY * 2 + wrapped.reduce((h, [, lines]) => h + this.linesHeight(lines.length, size, 1.7), 0);

        this.page.drawRectangle({
            x: MARGIN_X,
            y: this.y - height,
            width: CONTENT_WIDTH,
            height,
            color: COLORS.infoBg,
            borderColor: COLORS.infoBorder,
            borderWidth: 0.75,
        });

        this.y -= padY;
        for (const [label, lines] of wrapped) {
            const top = this.y;
            this.drawLines([label], MARGIN_X + padX, this.bold, size, COLORS.darkBlue, 1.7);
            this.y = top;
            this.drawLines(lines, MARGIN_X + padX + labelWidth, this.regular, size, COLORS.text, 1.7);
        }
        this.y -= padY + 15;
    }

    section(result: SearchResult): void {
        // Section title
        this.ensureSpace(60);
        this.drawLines([this.clean(result.label)], MARGIN_X, this.bold, 10.5, COLORS.darkBlue, 1.3);
        this.y -= 4;
        this.rule(COLORS.sectionBorder, 0.75);
        this.y -= 8;

        // Query box
        const qSize = 6;
        const pad = 6;
        const label = 'Search Query: ';
        const labelWidth = this.width(label, this.bold, qSize);
        const innerWidth = CONTENT_WIDTH - pad * 2;
        const qLines = this.wrap(this.clean(result.query), this.regular, qSize, innerWidth, innerWidth - labelWidth);
        const qHeight = pad * 2 + this.linesHeight(qLines.length, qSize);

        this.ensureSpace(qHeight + 20);
        this.page.drawRectangle({
            x: MARGIN_X,
            y: this.y - qHeight,
            width: CONTENT_WIDTH,
            height: qHeight,
            color: COLORS.queryBg,
            borderColor: COLORS.queryBorder,
            borderWidth: 0.75,
        });
        this.y -= pad;
        const top = this.y;
        this.drawLines([label], MARGIN_X + pad, this.bold, qSize, COLORS.gray);
        this.y = top;
        this.drawLines(qLines.slice(0, 1), MARGIN_X + pad + labelWidth, this.regular, qSize, COLORS.gray);
        this.drawLines(qLines.slice(1), MARGIN_X + pad, this.regular, qSize, COLORS.gray);
        this.y -= pad + 6;

        this.drawLines([`Approximately ${result.totalResults} results found`], MARGIN_X, this.regular, 6.75, COLORS.gray);
        this.y -= 8;

        if (result.links.length === 0) {
            this.drawLines(['No results were found for this search query.'], MARGIN_X, this.italic, 7.5, COLORS.lightGray);
            this.y -= 8;
            return;
        }

        for (const link of result.links) {
            this.resultItem(link.url, link.title, link.snippet);
        }
    }

    resultItem(url: string, title: string, snippet: string): void {
        let host = '';
        try {
            host = new URL(url).hostname;
        } catch {}

        const siteLines = host ? [this.clean(host)] : [];
        const titleLines = this.wrap(this.clean(title), this.regular, 9, CONTENT_WIDTH);
        const snippetLines = snippet ? this.wrap(this.clean(snippet), this.regular, 6.75, CONTENT_WIDTH, CONTENT_WIDTH) : [];
        const height =
            this.linesHeight(siteLines.length, 6.75) + 1.5 +
            this.linesHeight(titleLines.length, 9, 1.3) + 2 +
            this.linesHeight(snippetLines.length, 6.75, 1.5);

        this.ensureSpace(height);

        this.drawLines(siteLines, MARGIN_X, this.regular, 6.75, COLORS.site);
        this.y -= 1.5;

        const titleTop = this.y;
        this.drawLines(titleLines, MARGIN_X, this.regular, 9, COLORS.link, 1.3);
        if (url) {
            const width = Math.max(...titleLines.map((l) => this.width(l, this.regular, 9)));
            this.addLink(url, MARGIN_X, titleTop, width, titleTop - this.y);
        }

        if (snippetLines.length) {
            this.y -= 2;
            this.drawLines(snippetLines, MARGIN_X, this.regular, 6.75, COLORS.site, 1.5);
        }
        this.y -= 12;
    }

    footer(lines: string[]): void {
        const height = 22 + this.linesHeight(lines.length, 6);
        this.ensureSpace(height);
        this.y -= 14;
        this.rule(COLORS.rule, 0.75);
        this.y -= 8;
        for (const line of lines) {
            this.centered(line, this.regular, 6, COLORS.lightGray);
        }
    }
}

export async function renderReport(data: ReportData): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    doc.setTitle(`Due Diligence Report - ${data.name}`);

    const writer = new ReportWriter(
        doc,
        await doc.embedFont(StandardFonts.Helvetica),
        await doc.embedFont(StandardFonts.HelveticaBold),
        await doc.embedFont(StandardFonts.HelveticaOblique),
    );

    writer.header();
    writer.infoBox([
        ['Subject Name:', data.name],
        ['Location:', [data.city, data.state].filter(Boolean).join(', ') || 'Not specified'],
        ['Report Generated:', data.generatedAt],
    ]);

    data.results.forEach((result, index) => {
        if (index > 0) writer.newPage();
        writer.section(result);
    });

    writer.footer([
        'This report was generated automatically using publicly available search engine results.',
        'It is intended for internal due diligence purposes only and does not constitute legal advice.',
        'Results should be reviewed and verified by qualified personnel before making any decisions.',
    ]);

    return doc.save();
}
