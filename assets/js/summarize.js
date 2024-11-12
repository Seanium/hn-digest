const { ZhipuAI } = require('zhipuai-sdk-nodejs-v4');

class Summarizer {
    constructor(apiKey) {
        this.ai = new ZhipuAI({ apiKey });
    }

    async getSummary(html) {
        try {
            const response = await this.ai.createCompletions({
                model: "glm-4-flash",
                messages: [{
                    role: "user",
                    content: `这个网页包含一篇文章或一些文字，请你用**约100个字**总结这些文字的主要内容。注意：必须使用中文输出！不要在回答中包含网页源码！不要直接对源码进行总结，而是对其中包含的内容文字进行总结！以下是网页的内容：\n\n${html}。重复提醒：请你只用一段话**约100个字**总结网页（HTML代码）中的文字的主要内容，而不是分析代码本身！必须严格遵守字数限制！`
                }],
                stream: false
            });

            
            return response.choices[0].message.content;
        } catch (error) {
            console.error('[Summary] Error:', error.message);
            return null;
        }
    }
}

module.exports = Summarizer;