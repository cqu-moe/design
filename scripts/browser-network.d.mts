import type { BrowserContext } from '@playwright/test';
export function guardNetwork(context: BrowserContext, baseURL: string): Promise<() => void>;
