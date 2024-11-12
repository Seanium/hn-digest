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

async function fetchStories() {
    console.log('[HN] Fetching top stories...');
    const topStoryIds = await httpsGet('https://hacker-news.firebaseio.com/v0/topstories.json');
    const N = 20;
    const topNStoryIds = topStoryIds.slice(0, N);
    
    console.log('[HN] Fetching story details...');
    const stories = [];
    for (const id of topNStoryIds) {
        const story = await httpsGet(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        stories.push(story);
    }
    
    return stories;
}

module.exports = {
    fetchStories,
};