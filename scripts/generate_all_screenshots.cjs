const puppeteer = require('../frontend/node_modules/puppeteer-core');
const path = require('path');
const http = require('http');

function fetchReport(id) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:8000/api/analysis/${id}/report`, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function main() {
    console.log("Fetching sample report data...");
    const reportData = await fetchReport('ac2d6470-1b52-4630-926e-22b1b56d6b41');
    const screenshotsDir = path.resolve(__dirname, '../docs/screenshots');

    console.log("Launching headless browser...");
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', 
            '--window-size=1440,900'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    // Set dark mode & preseed storage
    await page.evaluateOnNewDocument((rep) => {
        localStorage.setItem('cofound_dark_mode', 'true');
        if (rep) {
            sessionStorage.setItem('cofound_analysis_result', JSON.stringify(rep));
            const toolResults = {
                'trends': {
                    query: 'Autonomous AI customer support copilot for Shopify merchants',
                    result: rep.structured_data?.trend_results
                },
                'competitors': {
                    query: 'Autonomous AI customer support copilot for Shopify merchants',
                    result: rep.structured_data?.competitor_results
                },
                'market-gaps': {
                    query: 'Autonomous AI customer support copilot for Shopify merchants',
                    result: rep.structured_data?.validation_results
                },
                'brainstorm': {
                    query: 'Autonomous AI customer support copilot for Shopify merchants',
                    result: rep.structured_data?.ideation_results
                }
            };
            sessionStorage.setItem('cofound_tool_results', JSON.stringify(toolResults));
        }
    }, reportData);

    // ── 1. Hero Landing Page ────────────────────────────────────────────────
    console.log("1. Capturing Hero Landing...");
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Type a sample idea into the textarea so it looks dynamic & active
    await page.evaluate(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
            const proto = Object.getPrototypeOf(textarea);
            const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
            nativeSetter.call(textarea, 'Autonomous WhatsApp B2B Sales SDR for Indian FMCG Distributors with Tally ERP integration and live catalog sync');
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, '01-hero-landing.png') });

    // ── 2. Live Swarm Execution ─────────────────────────────────────────────
    console.log("2. Capturing Live Swarm Execution...");
    await page.goto('http://localhost:5173/analysis/7f54d71a-3f9f-4fb7-9ae8-7202b95f4dfd', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, '02-active-swarm-execution.png') });

    // ── 3. Executive Dossier Report ──────────────────────────────────────────
    console.log("3. Capturing Executive Dossier Report...");
    await page.goto('http://localhost:5173/report', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, '03-executive-dossier-report.png') });

    // ── 4. Key Metrics Tab ──────────────────────────────────────────────────
    console.log("4. Capturing Key Metrics Tab...");
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && b.textContent.trim() === 'Key Metrics');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, '04-key-metrics.png') });

    // ── 5. Competitors Tab ──────────────────────────────────────────────────
    console.log("5. Capturing Competitors Tab...");
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && b.textContent.trim() === 'Competitors');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, '05-competitor-matrix.png') });

    // ── 6. Trend Explorer Page ──────────────────────────────────────────────
    console.log("6. Capturing Trend Explorer...");
    await page.goto('http://localhost:5173/trends', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, '06-trend-explorer.png') });

    // ── 7. Market Gaps Page ─────────────────────────────────────────────────
    console.log("7. Capturing Market Gaps...");
    await page.goto('http://localhost:5173/market-gaps', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, '07-market-gaps.png') });

    // ── 8. Idea Brainstorming Page ──────────────────────────────────────────
    console.log("8. Capturing Idea Brainstorming...");
    await page.goto('http://localhost:5173/brainstorm', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, '08-idea-brainstorming.png') });

    // ── 9. Curated Problem Ideas Library ────────────────────────────────────
    console.log("9. Capturing Curated Ideas Library...");
    await page.goto('http://localhost:5173/ideas', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, '09-curated-ideas.png') });

    // ── 10. AI Copilot Drawer ───────────────────────────────────────────────
    console.log("10. Capturing AI Copilot Drawer...");
    await page.goto('http://localhost:5173/report', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && b.textContent.includes('AI Copilot'));
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, '10-copilot-drawer.png') });

    // ── 11. Past Analysis History ───────────────────────────────────────────
    console.log("11. Capturing Past Analysis History...");
    await page.goto('http://localhost:5173/history', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, '11-analysis-history.png') });

    await browser.close();
    console.log("All screenshots captured successfully!");
}

main().catch(err => {
    console.error("Error generating screenshots:", err);
    process.exit(1);
});
