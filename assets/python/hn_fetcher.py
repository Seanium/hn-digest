import aiohttp
import asyncio
import logging


class HNFetcher:
    """从HN API获取文章数据"""

    BASE_URL = "https://hacker-news.firebaseio.com/v0"

    def __init__(self, story_limit=20):
        self.story_limit = story_limit
        self.logger = logging.getLogger(__name__)

    async def fetch_json(self, url, retries=3):
        for attempt in range(retries):
            try:
                self.logger.debug(f"Fetching URL: {url}")
                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as response:
                        data = await response.json()
                        self.logger.debug(f"Successfully fetched {url}")
                        return data
            except Exception as e:
                self.logger.warning(f"Attempt {attempt + 1}/{retries} failed: {str(e)}")
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(1)

    async def fetch_stories(self):
        self.logger.info(f"Starting to fetch top {self.story_limit} stories...")
        story_ids = await self.fetch_json(f"{self.BASE_URL}/topstories.json")
        story_ids = story_ids[: self.story_limit]

        self.logger.info(f"Found {len(story_ids)} stories, fetching details...")
        tasks = []
        for i, id in enumerate(story_ids, 1):
            self.logger.info(f"Creating task {i}/{len(story_ids)}: story ID {id}")
            tasks.append(self.fetch_json(f"{self.BASE_URL}/item/{id}.json"))

        stories = await asyncio.gather(*tasks)
        self.logger.info(f"Successfully fetched details for all {len(stories)} stories")
        return stories
