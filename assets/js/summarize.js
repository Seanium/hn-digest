const { ZhipuAI } = require('zhipuai-sdk-nodejs-v4');
const http = require('http');
const https = require('https');

function getArticleHtml(url) {
    return new Promise((resolve) => {
        if (!url) {
            resolve(null);
            return;
        }

        const protocol = url.startsWith('https:') ? https : http;
        const req = protocol.get(url, (resp) => {
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

class Summarizer {
    constructor(apiKey) {
        this.ai = new ZhipuAI({ apiKey });
    }

    async getSummary(html) {
        try {
            // 第一轮总结
            const firstResponse = await this.ai.createCompletions({
                model: "glm-4-flash",
                messages: [{
                    role: "user",
                    content: `这个网页包含一篇文章或一些文字，请你用**约100个字**总结这些文字的主要内容。注意：必须使用中文输出！不要在回答中包含网页源码！不要直接对源码进行总结，而是对其中包含的内容文字进行总结！以下是网页的内容：\n\n${html}。重复提醒：请你只用一段话**约100个字**总结网页（HTML代码）中的文字的主要内容，而不是分析代码本身！必须严格遵守字数限制！`
                }],
                stream: false
            });

            const firstSummary = firstResponse.choices[0].message.content;

            // 检查字数是否超过250
            if (firstSummary.length > 250) {
                console.log('[Summary] First round exceeded 250 chars, initiating second round...');

                // 第二轮总结
                const secondResponse = await this.ai.createCompletions({
                    model: "glm-4-flash",
                    messages: [{
                        role: "user",
                        content: `${firstSummary}\n\n截断以上文字的重复内容，只输出截断后内容，不要输出无关文字！注意：必须使用中文输出！必须严格遵守字数限制，一共约100字！如果是github项目，需要介绍其项目详情。不要输出无关文字！`
                    }],
                    stream: false
                });

                return secondResponse.choices[0].message.content;
            }

            return firstSummary;
        } catch (error) {
            console.error('[Summary] Error:', error.message);
            return null;
        }
    }

    async processBatch(stories) {
        for (let i = 0; i < stories.length; i++) {
            const story = stories[i];

            if (story.url) {
                console.log(`[HTML] ${i + 1}/${stories.length}: Fetching HTML for ${story.url}...`);
                const html = await getArticleHtml(story.url);
                console.log(`[HTML] ${i + 1}/${stories.length}: HTML fetched`);

                if (html) {
                    console.log(`[Summary] ${i + 1}/${stories.length}: Generating summary...`);
                    story.summary = await this.getSummary(html);
                    console.log(`[Summary] ${i + 1}/${stories.length}: Summary generated: ${story.summary}`);
                } else {
                    console.log(`[Summary] ${i + 1}/${stories.length}: HTML is empty or failed to fetch`);
                }
            } else {
                console.log(`[Summary] ${i + 1}/${stories.length}: No URL to summarize`);
            }

            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        return stories;
    }
}

module.exports = Summarizer;