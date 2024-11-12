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

async function httpsGetWithRetry(url, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await httpsGet(url);
        } catch (error) {
            console.log(`Retry ${attempt + 1} for ${url}`);
            if (attempt === retries - 1) throw error;
            await new Promise(res => setTimeout(res, 1000));
        }
    }
}

async function fetchStories() {
    console.log('[HN] Fetching top stories...');
    const topStoryIds = await httpsGetWithRetry('https://hacker-news.firebaseio.com/v0/topstories.json');
    const N = 20;
    const topNStoryIds = topStoryIds.slice(0, N);

    console.log('[HN] Fetching story details...');
    const stories = [];
    for (const id of topNStoryIds) {
        const story = await httpsGetWithRetry(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        stories.push(story);
    }

    return stories;
}

module.exports = {
    fetchStories,
};