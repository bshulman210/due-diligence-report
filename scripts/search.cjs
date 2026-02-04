const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const url = process.argv[2];

if (!url) {
    console.error(JSON.stringify({ error: 'No URL provided' }));
    process.exit(1);
}

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--window-size=1280,1024',
                '--lang=en-US,en',
            ],
        });

        const page = await browser.newPage();

        await page.setViewport({ width: 1280, height: 1024 });

        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        });

        // Set Bing locale cookies to force English US results
        await page.setCookie(
            { name: '_EDGE_S', value: 'mkt=en-us', domain: '.bing.com' },
            { name: '_EDGE_V', value: '1', domain: '.bing.com' },
            { name: 'MUID', value: Math.random().toString(36).substring(2), domain: '.bing.com' },
            { name: 'MUIDB', value: Math.random().toString(36).substring(2), domain: '.bing.com' },
            { name: '_SS', value: 'SID=0', domain: '.bing.com' },
            { name: 'SRCHD', value: 'AF=NOFORM', domain: '.bing.com' },
            { name: 'SRCHUSR', value: 'DOB=20200101&T=' + Date.now(), domain: '.bing.com' },
            { name: 'SRCHHPGUSR', value: 'SRCHLANG=en&BRW=W&BRH=M&CW=1280&CH=1024&SCW=1280&SCH=1024&DPR=1&UTC=-300&DM=0', domain: '.bing.com' },
        );

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for Bing results to render
        await new Promise(r => setTimeout(r, 2000));

        // Take screenshot
        const screenshotBuffer = await page.screenshot({ fullPage: true, type: 'png' });
        const screenshotBase64 = screenshotBuffer.toString('base64');

        // Extract links from Bing search results
        const links = await page.evaluate(() => {
            const results = [];

            // Bing organic results: each result is an <li class="b_algo"> with an <h2><a> inside
            document.querySelectorAll('li.b_algo h2 a').forEach(a => {
                const href = a.href;
                if (href && !href.includes('bing.com') && !href.includes('microsoft.com')) {
                    results.push({
                        title: a.textContent.trim().substring(0, 200),
                        url: href,
                    });
                }
            });

            // Deduplicate by URL
            const seen = new Set();
            return results.filter(item => {
                if (seen.has(item.url)) return false;
                seen.add(item.url);
                return true;
            });
        });

        console.log(JSON.stringify({ screenshot: screenshotBase64, links: links }));
    } catch (err) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
})();
