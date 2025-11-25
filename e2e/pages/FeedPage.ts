import { Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class FeedPage extends BasePage {
  // Locators (made specific to avoid ambiguous matches)
  private readonly articleTitle = (title: string) =>
    this.page.getByRole("heading", { name: title, exact: true });
  private readonly authorLink = (author: string) =>
    this.page.getByRole("link", { name: author, exact: true });
  private readonly articlePreview = (text: string) =>
    this.page
      .getByRole("article")
      .filter({ hasText: text })
      .locator("p")
      .first();
  private readonly likeButton = (count: string) =>
    this.page.locator("button", { hasText: count }).first();
  private readonly tagItem = (tag: string) =>
    this.page.locator("li").filter({ hasText: tag }).first();
  private readonly yourFeedTab = this.page.getByText("Your Feed", {
    exact: true,
  });
  private readonly globalFeedTab = this.page.getByText("Global Feed", {
    exact: true,
  });
  private readonly paginationNav = this.page
    .getByRole("navigation")
    .filter({ hasText: "1" });
  private readonly pageButton = (page: string) =>
    this.page.getByRole("button", { name: page });
  private readonly articleTitleLocator = this.page.locator(
    ".article-preview h1",
  );
  private readonly popularTagsHeader = this.page.locator("text=Popular Tags");
  private readonly tagElements = this.page.locator(
    ".tag-list > a.tag-default.tag-pill",
  );

  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async navigateToFeeds() {
    await this.navigate("/");
  }

  // Feed Tab Actions
  async switchToYourFeed() {
    await this.yourFeedTab.click();
  }

  async switchToGlobalFeed() {
    await this.globalFeedTab.click();
  }

  // Feed State Verifications
  async verifyYourFeedState() {
    // In this app unauthenticated users are redirected to the Sign in page or shown the Sign in form
    const signInHeading = this.page.getByRole("heading", { name: "Sign in" });
    const emailInput = this.page.getByRole("textbox", { name: "Email" });
    await Promise.any([
      signInHeading.waitFor({ state: "visible", timeout: 3000 }),
      emailInput.waitFor({ state: "visible", timeout: 3000 }),
    ]);
  }

  async verifyGlobalFeedState() {
    await expect(this.globalFeedTab).toBeVisible();
  }

  // Other Verifications
  async verifyArticleDisplay(title: string, previewText: string, date: string) {
    // Verify the heading is visible
    const titleLocator = this.articleTitle(title);
    await expect(titleLocator).toBeVisible();

    // Scope to the nearest ancestor that contains the date text so both heading and date belong to same block
    const articleBlock = titleLocator.locator(
      `xpath=ancestor::*[.//span[contains(normalize-space(.), "${date}")]][1]`,
    );
    await expect(articleBlock).toBeVisible();

    // Within that container verify preview paragraph and date span
    const previewLocator = articleBlock.locator(
      `xpath=.//p[contains(normalize-space(.), "${previewText}")]`,
    );
    await expect(previewLocator).toBeVisible();

    const dateLocator = articleBlock
      .locator(`xpath=.//span[contains(normalize-space(.), "${date}")]`)
      .first();
    await expect(dateLocator).toBeVisible();
  }

  async verifyArticleComponents(
    author: string,
    likeCount: string,
    tag: string,
  ) {
    await expect(this.authorLink(author)).toBeVisible();
    await expect(this.likeButton(likeCount)).toBeVisible();
    await expect(this.tagItem(tag)).toBeVisible();
  }

  async verifyFeedTabs() {
    await expect(this.globalFeedTab).toBeVisible();
    await expect(this.yourFeedTab).toBeVisible();
  }

  async verifyPaginationIfAvailable() {
    if (await this.paginationNav.isVisible()) {
      await expect(this.pageButton("1")).toBeVisible();
    }
  }

  // Article Actions
  async clickArticleTitle(title: string) {
    await this.articleTitle(title).click();
  }

  async clickAuthor(author: string) {
    await this.authorLink(author).click();
  }

  async clickLikeButton(count: string) {
    await this.likeButton(count).click();
  }

  async clickTag(tag: string) {
    await this.tagItem(tag).click();
  }

  // Popular Tags Methods
  /**
   * Verify that the Popular Tags section header is visible
   */
  async verifyPopularTagsHeaderVisible(): Promise<void> {
    await expect(this.popularTagsHeader).toBeVisible();
  }

  /**
   * Get all popular tags currently displayed on the page
   * @returns Array of trimmed tag names
   */
  async getPopularTags(): Promise<string[]> {
    const allTagsText = await this.tagElements.allTextContents();
    return allTagsText.map((tag) => tag.trim());
  }

  /**
   * Verify that all visible tags match the expected tags
   * @param expectedTags - Array of expected tag names
   */
  async verifyTagsMatch(expectedTags: string[]): Promise<void> {
    // Verify we have the expected number of tags
    const tagCount = await this.tagElements.count();
    expect(tagCount).toBe(expectedTags.length);

    // Get all visible tags
    const visibleTags = await this.getPopularTags();

    // Verify each expected tag is present
    for (const expectedTag of expectedTags) {
      expect(visibleTags).toContain(expectedTag);
    }

    // Verify all visible tags match the expected tags exactly (order-independent)
    expect(visibleTags.sort()).toEqual(expectedTags.sort());
  }

  /**
   * Click on a specific popular tag
   * @param tagName - Name of the tag to click
   */
  async clickPopularTag(tagName: string): Promise<void> {
    const tag = this.page.locator(
      `.tag-list > a.tag-default.tag-pill:has-text("${tagName}")`,
    );
    await expect(tag).toBeVisible();
    await tag.click();
  }

  // Pagination Methods
  /**
   * Verify that a specific page number exists in the pagination controls
   * @param pageNumber - The page number to verify (e.g., 2, 3, etc.)
   */
  async verifyPaginatorPageExists(pageNumber: number) {
    const pageBtn = this.pageButton(String(pageNumber));
    await expect(pageBtn).toBeVisible();
  }

  /**
   * Navigate to a specific page number
   * @param pageNumber - The page number to navigate to
   */
  async goToPaginatorPage(pageNumber: number) {
    const pageBtn = this.pageButton(String(pageNumber));
    await pageBtn.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get all article titles currently displayed on the page
   * @returns Array of article titles
   */
  async getArticleTitlesOnCurrentPage(): Promise<string[]> {
    // Wait for at least one article to appear
    await this.articleTitleLocator
      .first()
      .waitFor({ state: "visible", timeout: 5000 });

    // Get all article title elements
    const count = await this.articleTitleLocator.count();
    const titles: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await this.articleTitleLocator.nth(i).textContent();
      if (text) {
        titles.push(text.trim());
      }
    }

    return titles;
  }
}
