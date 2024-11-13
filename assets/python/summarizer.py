from textwrap import dedent

from zhipuai import ZhipuAI
import logging


class Summarizer:
    """调用LLM生成摘要"""

    def __init__(self, api_key: str):
        self.client = ZhipuAI(api_key=api_key)
        self.logger = logging.getLogger(__name__)

    async def generate_summary(self, content: str) -> str:
        if not content:
            return None
        try:
            prompt = dedent(
                f"""
                ## Goals
                这个网页包含一篇文章或一些文字，请你只用一段话**约100个字**总结这些文字的主要内容。

                ## Constrains
                严格依据网页内容总结概括，不得额外推理。
                必须使用中文输出。
                必须严格遵守**约100个字**的字数限制！

                ## 网页内容：
                {content}

                ## 重要提醒
                以上网页包含一篇文章或一些文字，请你只用一段话**约100个字**总结这些文字的主要内容。
                严格依据网页内容总结概括，不得额外推理。
                必须使用中文输出。
                必须严格遵守**约100个字**的字数限制！
            """
            ).strip()

            response = self.client.chat.completions.create(
                model="glm-4-flash", messages=[{"role": "user", "content": prompt}]
            )

            return response.choices[0].message.content

        except Exception as e:
            self.logger.error(f"Summary generation failed: {str(e)}")
            return None
