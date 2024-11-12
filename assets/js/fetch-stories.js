const fs = require('fs');
const https = require('https');

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => { data += chunk; });
            resp.on('end', () => { resolve(JSON.parse(data)); });
        }).on('error', reject);
    });
}

async function fetchAndSaveStories() {
    try {
        const topStoryIds = await httpsGet('https://hacker-news.firebaseio.com/v0/topstories.json');
        const top30StoryIds = topStoryIds.slice(0, 30);
        
        const stories = await Promise.all(
            top30StoryIds.map(id => 
                httpsGet(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
            )
        );
        
        const data = {
            stories: stories,
            lastUpdate: new Date().toISOString()
        };
        
        fs.writeFileSync('assets/data/stories.json', JSON.stringify(data));
        console.log('Stories updated successfully');
    } catch (error) {
        console.error('Error fetching stories:', error);
        process.exit(1);
    }
}

fetchAndSaveStories();