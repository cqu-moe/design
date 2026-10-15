import { test as base, type BrowserContext, type BrowserContextOptions } from '@playwright/test';
import { guardNetwork } from '../../scripts/browser-network.mjs';
export { expect } from '@playwright/test';

export const test = base.extend<{
  newContext: (options: BrowserContextOptions) => Promise<BrowserContext>;
}>({
  context: async ({ context, baseURL }, use) => {
    const checkNetwork = await guardNetwork(context, baseURL!);
    try {
      await use(context);
    } finally {
      checkNetwork();
    }
  },
  newContext: async ({ browser, browserName, baseURL }, use, testInfo) => {
    const contexts: { context: BrowserContext; check: () => void }[] = [];
    try {
      await use(async (options) => {
        const context = await browser.newContext({
          ...options,
          baseURL,
          serviceWorkers: 'block',
          // Firefox supports narrow/touch contexts, but not isMobile emulation.
          isMobile: browserName === 'firefox' ? false : options.isMobile,
        });
        contexts.push({ context, check: await guardNetwork(context, baseURL!) });
        return context;
      });
    } finally {
      const failures: unknown[] = [];
      for (const [index, { context, check }] of contexts.entries()) {
        try {
          if (testInfo.status !== testInfo.expectedStatus) {
            for (const [pageIndex, page] of context.pages().entries()) {
              await testInfo.attach(`context-${index}-page-${pageIndex}`, {
                body: await page.screenshot({ fullPage: true }),
                contentType: 'image/png',
              });
            }
          }
          check();
        } catch (error) {
          failures.push(error);
        } finally {
          await context.close();
        }
      }
      if (failures.length)
        throw new AggregateError(failures, 'Browser context verification failed');
    }
  },
});
