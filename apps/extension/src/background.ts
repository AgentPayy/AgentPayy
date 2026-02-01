// AgentPayy Browser Extension - Base USDC Interceptor
// Ported from Solana to Base L2 via Coinbase SDK

import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';

const sdk = new CoinbaseWalletSDK({
  appName: 'AgentPayy Extension',
  appLogoUrl: 'https://agentpayy.com/logo.png',
  darkMode: true
});

const ethereum = sdk.makeWeb3Provider();

chrome.webRequest.onHeadersReceived.addListener(
  async (details) => {
    const statusLine = details.statusLine;
    
    // Detect x402 Payment Required
    if (statusLine.includes("402")) {
      console.log("💰 [AgentPayy] 402 Detected on Base Chain");
      
      const price = details.responseHeaders?.find(h => h.name === 'x-agentpay-price')?.value;
      const recipient = details.responseHeaders?.find(h => h.name === 'x-agentpay-recipient')?.value;

      if (price && recipient) {
        // Trigger Base USDC Transaction
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const tx = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: accounts[0],
            to: recipient,
            value: '0x0', // No ETH, purely USDC
            data: '0x...' // USDC transfer data
          }]
        });
        
        console.log("✅ [AgentPayy] Payment Sent on Base:", tx);
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);
