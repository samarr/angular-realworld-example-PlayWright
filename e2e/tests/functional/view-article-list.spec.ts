import { test, expect } from "@playwright/test";
import { FeedPage } from "../../pages/FeedPage";

test.describe("Article Management", () => {
  test("View Article List components and feed tabs", async ({ page }) => {
    const feedPage = new FeedPage(page);

    // Navigate to home page
    await feedPage.navigateToFeeds();

    // Verify article content
    await feedPage.verifyArticleDisplay(
      "dummy-1",
      "dummy-1",
      "September 2, 2019",
    );

    // Verify article components
    await feedPage.verifyArticleComponents("dummy-1", "0", "test");

    // Verify feed tabs functionality and switching between feeds
    await feedPage.verifyFeedTabs();

    // Verify Global Feed state (default)
    await feedPage.verifyGlobalFeedState();

    // Switch to Your Feed and verify state
    await feedPage.switchToYourFeed();
    await feedPage.verifyYourFeedState();

    // Verify pagination - navigate back to previous state using BasePage helper
    await feedPage.browserBack();
    await feedPage.verifyPaginationIfAvailable();
  });

  test("View Article List with pagination when more than 10 articles present", async ({
    page,
  }) => {
    const feedPage = new FeedPage(page);

    // Intercept the articles API before navigation to return 11 articles
    await feedPage.interceptWithFixture(
      "**/api/articles**",
      "mockdata/articles-11.json",
    );

    // Navigate to home page (will use the intercepted response)
    await feedPage.navigateToFeeds();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verify pagination shows page 2 button
    await feedPage.verifyPaginatorPageExists(2);

    // Capture articles on page 1
    const titlesPage1 = await feedPage.getArticleTitlesOnCurrentPage();
    expect(titlesPage1.length).toBeGreaterThan(0);

    // Navigate to page 2
    await feedPage.goToPaginatorPage(2);

    // Capture articles on page 2
    const titlesPage2 = await feedPage.getArticleTitlesOnCurrentPage();
    expect(titlesPage2.length).toBeGreaterThan(0);

    // Verify page 1 and page 2 have different content
    expect(titlesPage1).not.toEqual(titlesPage2);

    // Clean up intercept
    await feedPage.removeIntercept("**/api/articles**");
  });

  test("Verify Popular Tags are visible and match mock data", async ({
    page,
  }) => {
    const feedPage = new FeedPage(page);
    const expectedTags = ["mock", "mountebank", "fast", "testing"];

    // Navigate to home page
    await feedPage.navigateToFeeds();

    // Verify Popular Tags header is visible
    await feedPage.verifyPopularTagsHeaderVisible();

    // Verify tags match mock data
    await feedPage.verifyTagsMatch(expectedTags);
  });
});
