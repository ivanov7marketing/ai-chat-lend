export async function generatePdfFromHtml(html: string): Promise<Buffer> {
    const puppeteerUrl = process.env.PUPPETEER_URL || 'http://puppeteer:3002/generate';

    // In local development without docker it might fail, we should handle it gracefully
    try {
        const response = await fetch(puppeteerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ html }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Puppeteer service error: ${response.status} ${errText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error('Error connecting to Puppeteer service:', error);
        throw error;
    }
}
