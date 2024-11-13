# main.py
import asyncio
import json
import os
from datetime import datetime
from dotenv import load_dotenv
import logging
from hn_fetcher import HNFetcher
from content_fetcher import ContentFetcher
from summarizer import Summarizer

load_dotenv()


async def main():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    try:
        # Initialize components
        hn_fetcher = HNFetcher(story_limit=20)
        content_fetcher = ContentFetcher()
        summarizer = Summarizer(api_key=os.getenv("ZHIPU_API_KEY"))

        # Fetch HN stories
        stories = await hn_fetcher.fetch_stories()
        total_stories = len(stories)

        # Process each story
        for index, story in enumerate(stories, 1):

            if story.get("url"):
                content = await content_fetcher.fetch_content(story["url"])
                await asyncio.sleep(2)
                if content:
                    logger.info(
                        f"{index}/{total_stories} Content fetched successfully ({len(content)} chars)"
                    )
                    logger.info(
                        f"{index}/{total_stories} Content: " + content[:100] + "..."
                    )
                    summary = await summarizer.generate_summary(content)
                    story["summary"] = summary
                    logger.info(
                        f"✅ {index}/{total_stories} Summary generated successfully: "
                        + summary[:100]
                        + "..."
                    )
                else:
                    logger.warning(
                        f"❌ {index}/{total_stories} Failed to fetch content for story"
                    )
            else:
                logger.warning(f"❌ {index}/{total_stories} Story has no URL")


        successful_summaries = sum(1 for story in stories if story.get("summary"))
        logger.info(
            f"📊 Successfully generated {successful_summaries} summaries out of {total_stories} stories"
        )
        # Save results
        data = {"stories": stories, "lastUpdate": datetime.now().isoformat()}

        os.makedirs("assets/data", exist_ok=True)
        with open("assets/data/stories.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        logger.info("Processing completed successfully")

    except Exception as e:
        logger.error(f"Process failed: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
