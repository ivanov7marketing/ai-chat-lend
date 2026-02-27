const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json({ limit: '50mb' }));

app.post('/generate', async (req, res) => {
    const { html } = req.body;

    if (!html) {
        return res.status(400).json({ error: 'HTML content is required' });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
            headless: true
        });

        const page = await browser.newPage();

        // Optimize for speed: don't wait for all resources unless necessary, but styles are important
        await page.setContent(html, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        res.contentType('application/pdf');
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Puppeteer microservice listening on port ${PORT}`);
});
