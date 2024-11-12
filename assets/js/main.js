const fs = require('fs');
const path = require('path');
const { fetchStories } = require('./fetch-hn');
const Summarizer = require('./summarize');
require('dotenv').config();

async function main() {
    try {
        const summarizer = new Summarizer(process.env.ZHIPU_API_KEY);
        const stories = await fetchStories();
        const processedStories = await summarizer.processBatch(stories);

        const data = {
            stories: processedStories,
            lastUpdate: new Date().toISOString()
        };

        const outputPath = 'assets/data/stories.json';
        const dir = path.dirname(outputPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync('assets/data/stories.json', JSON.stringify(data, null, 2));
        console.log('[Success] All stories processed and saved');
    } catch (error) {
        console.error('[Fatal] Process failed:', error);
        process.exit(1);
    }
}

main();