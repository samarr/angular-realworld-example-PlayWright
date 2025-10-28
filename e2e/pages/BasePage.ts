import { Page, Route } from "@playwright/test";
import fs from "fs";
import path from "path";

export type WaitUntilState = "load" | "domcontentloaded" | "networkidle";

export class BasePage {
  constructor(protected page: Page) {}

  async navigate(path: string) {
    await this.page.goto(`http://localhost:4200${path}`);
  }

  async getPageTitle() {
    return await this.page.title();
  }

  /**
   * Generic browser navigation helper.
   * action: 'back' | 'forward' | 'refresh'
   * options.waitUntil: how long to wait after navigation (defaults to 'networkidle')
   * options.timeout: navigation timeout in ms
   * Returns the navigation response for back/forward, or null for reload.
   */
  async browserNavigate(
    action: "back" | "forward" | "refresh",
    options?: { waitUntil?: WaitUntilState; timeout?: number },
  ) {
    const waitUntil = options?.waitUntil ?? "networkidle";
    const timeout = options?.timeout;

    if (action === "back") {
      const res = await this.page.goBack({ waitUntil, timeout });
      // ensure the page finished loading
      await this.page.waitForLoadState(waitUntil);
      return res;
    }

    if (action === "forward") {
      const res = await this.page.goForward({ waitUntil, timeout });
      await this.page.waitForLoadState(waitUntil);
      return res;
    }

    // refresh
    const res = await this.page.reload({ waitUntil, timeout });
    await this.page.waitForLoadState(waitUntil);
    return res;
  }

  // Convenience wrappers
  async browserBack(options?: {
    waitUntil?: WaitUntilState;
    timeout?: number;
  }) {
    return this.browserNavigate("back", options);
  }

  async browserForward(options?: {
    waitUntil?: WaitUntilState;
    timeout?: number;
  }) {
    return this.browserNavigate("forward", options);
  }

  async refresh(options?: { waitUntil?: WaitUntilState; timeout?: number }) {
    return this.browserNavigate("refresh", options);
  }

  /**
   * Generic API interceptor that returns mock data from a fixture file.
   * @param urlPattern - URL pattern to intercept (supports wildcards)
   * @param fixturePath - Relative path to fixture file from e2e/fixtures/
   * @param options - Optional status code and headers override
   *
   * Example: await basePage.interceptWithFixture('star-star/api/articles-star-star', 'mockdata/articles-11.json');
   */
  async interceptWithFixture(
    urlPattern: string,
    fixturePath: string,
    options?: { status?: number; headers?: Record<string, string> },
  ) {
    const {
      status = 200,
      headers = { "Content-Type": "application/json; charset=utf-8" },
    } = options || {};

    // Resolve fixture path relative to e2e/fixtures/
    const fullPath = path.resolve(__dirname, "../fixtures", fixturePath);
    const fixtureData = JSON.parse(fs.readFileSync(fullPath, "utf8"));

    await this.page.route(urlPattern, async (route: Route) => {
      // For pagination, we need to handle different pages
      const url = new URL(route.request().url());
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      // If fixture has articles array, slice based on pagination params
      if (fixtureData.articles && Array.isArray(fixtureData.articles)) {
        const paginatedArticles = fixtureData.articles.slice(
          offset,
          offset + limit,
        );
        await route.fulfill({
          status,
          headers,
          body: JSON.stringify({
            articles: paginatedArticles,
            articlesCount:
              fixtureData.articlesCount || fixtureData.articles.length,
          }),
        });
      } else {
        // Return fixture as-is if not an articles response
        await route.fulfill({
          status,
          headers,
          body: JSON.stringify(fixtureData),
        });
      }
    });
  }

  /**
   * Remove all route interceptions for a specific URL pattern.
   * @param urlPattern - URL pattern to stop intercepting
   */
  async removeIntercept(urlPattern: string) {
    await this.page.unroute(urlPattern);
  }

  /**
   * Other useful helpers you may add here:
   * - visitAndWait(path, selector) -> navigate and wait for a stable selector
   * - ensureVisible(locator) -> common wait/assert wrapper
   * - setViewport(width,height) -> change viewport per-test
   * - takePageSnapshot(name) -> save screenshot with consistent settings
   */
}
