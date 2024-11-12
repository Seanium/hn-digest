const storiesContainer = document.getElementById("stories");

function formatTime(time) {
    const seconds = Math.floor((Date.now() / 1000) - time);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} days ago`;
    } else if (hours > 0) {
        return `${hours} hours ago`;
    } else {
        return `${minutes} minutes ago`;
    }
}

async function loadStories() {
    try {
        const response = await fetch('./assets/data/stories.json');
        const data = await response.json();
        const stories = data.stories;
        const lastUpdate = new Date(data.lastUpdate);

        storiesContainer.innerHTML = `
            <div class="update-time">Last Updated: ${lastUpdate.toLocaleString('zh-CN')}</div>
        `;

        stories.forEach((story, index) => {
            const storyElement = document.createElement("div");
            storyElement.className = "story";

            const timeAgo = formatTime(story.time);

            storyElement.innerHTML = `
                <span class="rank">${index + 1}</span>
                <div class="story-content">
                    <a href="${story.url}" target="_blank">${story.title}</a>
                    ${story.summary ? `<div class="summary">${marked.parse(story.summary)}</div>` : ''}
                    <p>
                        ${story.score} points by 
                        <a href="https://news.ycombinator.com/user?id=${story.by}" target="_blank" class="user-link">${story.by}</a> 
                        <a href="https://news.ycombinator.com/item?id=${story.id}" target="_blank" class="time-link">${timeAgo}</a> | 
                        <a href="https://news.ycombinator.com/item?id=${story.id}" target="_blank" class="comments-link">${story.descendants || 0} comments</a>
                    </p>
                </div>`;
            storiesContainer.appendChild(storyElement);
        });
    } catch (error) {
        storiesContainer.innerHTML = "<p>Unable to load stories. Please try again later.</p>";
        console.error("Error loading stories:", error);
    }
}

loadStories();