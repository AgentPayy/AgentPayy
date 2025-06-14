import { test, expect, Page } from '@playwright/test';

test.describe('AgentPayyKit User Journey E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // Start with a fresh page for each test
    page = await browser.newPage();
    
    // Mock wallet connection for testing
    await page.addInitScript(() => {
      // @ts-ignore
      window.ethereum = {
        isMetaMask: true,
        request: async (args: any) => {
          if (args.method === 'eth_requestAccounts') {
            return ['0x742d35Cc6634C0532925a3b8D0B25dEbB2e8B57D'];
          }
          if (args.method === 'eth_chainId') {
            return '0x2105'; // Base Chain ID
          }
          if (args.method === 'personal_sign') {
            return '0x' + '0'.repeat(130); // Mock signature
          }
          return null;
        },
        on: () => {},
        removeListener: () => {}
      };
    });
  });

  test('Complete API Provider Journey', async () => {
    // Navigate to AgentPayyKit dashboard
    await page.goto('http://localhost:3000/dashboard');
    
    // 1. Connect Wallet
    await page.click('[data-testid="connect-wallet"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');
    
    // 2. Register a new AI model
    await page.click('[data-testid="register-model"]');
    
    await page.fill('[data-testid="model-id"]', 'my-gpt-4o');
    await page.fill('[data-testid="model-endpoint"]', 'https://api.mycompany.com/v1/chat');
    await page.fill('[data-testid="model-price"]', '0.001');
    await page.selectOption('[data-testid="token-select"]', 'USDC');
    
    await page.click('[data-testid="register-submit"]');
    
    // Wait for transaction confirmation
    await page.waitForSelector('[data-testid="registration-success"]');
    
    // Verify model appears in dashboard
    await expect(page.locator('[data-testid="model-my-gpt-4o"]')).toBeVisible();
    
    // 3. Configure model settings
    await page.click('[data-testid="model-my-gpt-4o"] [data-testid="edit-model"]');
    await page.fill('[data-testid="model-description"]', 'Advanced GPT-4o model for enterprise use');
    await page.check('[data-testid="enable-analytics"]');
    await page.click('[data-testid="save-settings"]');
    
    // 4. View earnings dashboard
    await page.click('[data-testid="earnings-tab"]');
    await expect(page.locator('[data-testid="total-earnings"]')).toContainText('$0.00');
    await expect(page.locator('[data-testid="total-calls"]')).toContainText('0');
  });

  test('Complete API Consumer Journey', async () => {
    await page.goto('http://localhost:3000');
    
    // 1. Browse available models
    await page.click('[data-testid="browse-models"]');
    await page.waitForSelector('[data-testid="models-grid"]');
    
    // Should see at least one model
    await expect(page.locator('[data-testid="model-card"]').first()).toBeVisible();
    
    // 2. Select a model
    await page.click('[data-testid="model-card"]').first();
    await page.waitForSelector('[data-testid="model-details"]');
    
    // 3. Connect wallet
    await page.click('[data-testid="connect-wallet"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');
    
    // 4. Add funds to prepaid balance
    await page.click('[data-testid="add-funds"]');
    await page.fill('[data-testid="deposit-amount"]', '10');
    await page.click('[data-testid="deposit-submit"]');
    await page.waitForSelector('[data-testid="deposit-success"]');
    
    // Verify balance updated
    await expect(page.locator('[data-testid="balance-usdc"]')).toContainText('10.00');
    
    // 5. Make API call
    await page.fill('[data-testid="api-input"]', 'What is the capital of France?');
    await page.click('[data-testid="submit-query"]');
    
    // Wait for API response
    await page.waitForSelector('[data-testid="api-response"]');
    await expect(page.locator('[data-testid="api-response"]')).toContainText('Paris');
    
    // Verify balance deducted
    await expect(page.locator('[data-testid="balance-usdc"]')).toContainText('9.999'); // Assuming 0.001 USDC cost
    
    // 6. View transaction history
    await page.click('[data-testid="history-tab"]');
    await expect(page.locator('[data-testid="transaction-item"]').first()).toBeVisible();
  });

  test('Paywall Integration Journey', async () => {
    // Navigate to a demo site with AgentPayyKit paywall
    await page.goto('http://localhost:3001/premium-content');
    
    // 1. Encounter paywall
    await expect(page.locator('[data-testid="paywall-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="content-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="premium-content"]')).not.toBeVisible();
    
    // 2. Connect wallet to paywall
    await page.click('[data-testid="unlock-content"]');
    await page.click('[data-testid="connect-wallet"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');
    
    // 3. Choose payment method
    await page.click('[data-testid="pay-with-balance"]'); // Use prepaid balance
    
    // 4. Confirm payment
    await page.click('[data-testid="confirm-payment"]');
    await page.waitForSelector('[data-testid="payment-success"]');
    
    // 5. Access premium content
    await expect(page.locator('[data-testid="paywall-overlay"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="premium-content"]')).toBeVisible();
    
    // Content should persist on refresh (access token stored)
    await page.reload();
    await expect(page.locator('[data-testid="premium-content"]')).toBeVisible();
  });

  test('Mobile Responsive Journey', async () => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    // 1. Mobile navigation
    await page.click('[data-testid="mobile-menu"]');
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // 2. Connect wallet on mobile
    await page.click('[data-testid="connect-wallet-mobile"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');
    
    // 3. Browse models in mobile view
    await page.click('[data-testid="browse-models"]');
    await expect(page.locator('[data-testid="models-grid-mobile"]')).toBeVisible();
    
    // 4. Make payment on mobile
    await page.click('[data-testid="model-card"]').first();
    await page.fill('[data-testid="api-input"]', 'Test query');
    await page.click('[data-testid="submit-query"]');
    
    await page.waitForSelector('[data-testid="api-response"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
  });

  test('Error Handling and Edge Cases', async () => {
    await page.goto('http://localhost:3000');
    
    // 1. Test network connection error
    await page.route('**/api/**', route => route.abort());
    await page.click('[data-testid="browse-models"]');
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    
    // 2. Test insufficient balance
    await page.unroute('**/api/**');
    await page.click('[data-testid="connect-wallet"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');
    
    // Try to make payment with 0 balance
    await page.click('[data-testid="model-card"]').first();
    await page.fill('[data-testid="api-input"]', 'Test query');
    await page.click('[data-testid="submit-query"]');
    
    await expect(page.locator('[data-testid="insufficient-balance-error"]')).toBeVisible();
    
    // 3. Test wallet rejection
    await page.addInitScript(() => {
      // @ts-ignore
      window.ethereum.request = async (args: any) => {
        if (args.method === 'personal_sign') {
          throw new Error('User rejected the request');
        }
        return null;
      };
    });
    
    await page.reload();
    await page.click('[data-testid="connect-wallet"]');
    await expect(page.locator('[data-testid="wallet-rejection-error"]')).toBeVisible();
  });

  test('Cross-Browser Compatibility', async ({ browserName }) => {
    // Skip certain tests for specific browsers if needed
    test.skip(browserName === 'webkit', 'WebKit has known issues with wallet simulation');
    
    await page.goto('http://localhost:3000');
    
    // Test basic functionality across browsers
    await page.click('[data-testid="browse-models"]');
    await expect(page.locator('[data-testid="models-grid"]')).toBeVisible();
    
    await page.click('[data-testid="connect-wallet"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');
    
    // Verify wallet connection works in all browsers
    await expect(page.locator('[data-testid="wallet-address"]')).toContainText('0x742d35Cc');
  });

  test('Performance and Load Testing', async () => {
    await page.goto('http://localhost:3000');
    
    // Measure page load time
    const navigationStart = await page.evaluate(() => performance.timing.navigationStart);
    const loadEventEnd = await page.evaluate(() => performance.timing.loadEventEnd);
    const pageLoadTime = loadEventEnd - navigationStart;
    
    expect(pageLoadTime).toBeLessThan(5000); // Page should load in under 5 seconds
    
    // Test rapid consecutive API calls
    await page.click('[data-testid="connect-wallet"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');
    
    await page.click('[data-testid="model-card"]').first();
    
    // Make 5 rapid API calls
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="api-input"]', `Test query ${i}`);
      await page.click('[data-testid="submit-query"]');
      await page.waitForSelector(`[data-testid="response-${i}"]`);
    }
    
    // All responses should be visible
    for (let i = 0; i < 5; i++) {
      await expect(page.locator(`[data-testid="response-${i}"]`)).toBeVisible();
    }
  });
}); 