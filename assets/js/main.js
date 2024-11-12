const fs = require('fs');
const { fetchStories } = require('./fetch-hn');
const Summarizer = require('./summarize');
const https = require('https');
require('dotenv').config();

function getArticleHtml(url) {
    return new Promise((resolve) => {
        if (!url) {
            resolve(null);
            return;
        }

        const req = https.get(url, (resp) => {
            if (resp.statusCode !== 200) {
                resolve(null);
                return;
            }
            let data = '';
            resp.on('data', (chunk) => { data += chunk; });
            resp.on('end', () => { resolve(data); });
        }).on('error', () => resolve(null));

        req.setTimeout(3000, () => {
            req.abort();
            resolve(null);
        });
    });
}

async function main() {
    try {
        const summarizer = new Summarizer(process.env.ZHIPU_API_KEY);
        
        const stories = await fetchStories();

        for (let i = 0; i < stories.length; i++) {
            const story = stories[i];
            
            if (story.url) {
                console.log(`[HTML] ${i + 1}/${stories.length}: Fetching HTML for ${story.url}...`);
                const html = await getArticleHtml(story.url);
                console.log(`[HTML] ${i + 1}/${stories.length}: HTML fetched`);
                if (html) {
                    console.log(`[Summary] ${i + 1}/${stories.length}: Generating summary...`);
                    story.summary = await summarizer.getSummary(html);
                    console.log(`[Summary] ${i + 1}/${stories.length}: Summary generated: ${story.summary}`);
                } else {
                    console.log(`[Summary] ${i + 1}/${stories.length}: HTML is empty or failed to fetch`);
                }
            } else {
                console.log(`[Summary] ${i + 1}/${stories.length}: No URL to summarize`);
            }
     
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        const data = {
            stories: stories,
            lastUpdate: new Date().toISOString()
        };
        
        fs.writeFileSync('assets/data/stories.json', JSON.stringify(data, null, 2));
        console.log('[Success] All stories processed and saved');
    } catch (error) {
        console.error('[Fatal] Process failed:', error);
        process.exit(1);
    }
}

main();