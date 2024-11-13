# content_fetcher.py
import asyncio
from crawl4ai import AsyncWebCrawler
import pdfplumber
import tempfile
import os
from urllib.parse import urlparse
import logging
import aiohttp


class ContentFetcher:
    """抓取网页或PDF内容"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def is_pdf_url(self, url: str) -> bool:
        return urlparse(url).path.lower().endswith(".pdf")

    async def fetch_webpage(self, url: str) -> str:
        try:
            async with AsyncWebCrawler(verbose=False, timeout=30000) as crawler:
                result = await crawler.arun(
                    url=url,
                    bypass_cache=True,
                    word_count_threshold=10,
                    remove_overlay_elements=True,
                    excluded_tags=["nav", "footer", "header"],
                )
                if result and result.success and (result.fit_markdown or result.markdown):
                    content = result.fit_markdown if result.fit_markdown else result.markdown
                    if content.startswith("Crawl4AI Error"):
                        self.logger.error(f"Crawl4AI Error found in content")
                        return None
                    return content
                else:
                    self.logger.error(f"Failed to extract content from {url}")
                    return None
        except Exception as e:
            self.logger.error(f"Failed to fetch webpage {url}: {str(e)}")
            return None

    async def fetch_pdf(self, url: str) -> str:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"PDF download failed: {response.status}")

                with tempfile.NamedTemporaryFile(
                    delete=False, suffix=".pdf"
                ) as tmp_file:
                    tmp_file.write(await response.read())
                    tmp_path = tmp_file.name

                try:
                    with pdfplumber.open(tmp_path) as pdf:
                        return "\n".join(page.extract_text() for page in pdf.pages)
                finally:
                    os.unlink(tmp_path)

    async def fetch_content(self, url: str, retries=3) -> str:
        if not url:
            return None

        for attempt in range(retries):
            try:
                if self.is_pdf_url(url):
                    self.logger.info(f"Fetching PDF: {url}")
                    content = await self.fetch_pdf(url)
                else:
                    self.logger.info(f"Fetching webpage: {url}")
                    content = await self.fetch_webpage(url)

                valid_len = 20
                if content and len(content) >= valid_len:
                    return content
                else:
                    self.logger.error(f"Content too short for {url}, length: {len(content)}")
                    return None
            except Exception as e:
                self.logger.warning(f"Attempt {attempt + 1}/{retries} failed for {url}: {str(e)}")
                if attempt == retries - 1:
                    self.logger.error(f"Content fetch failed for {url}: {str(e)}")
                    return None
                await asyncio.sleep(1)
