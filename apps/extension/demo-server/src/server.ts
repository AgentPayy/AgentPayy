/**
 * Unlock Demo Server
 * Demonstrates x402 integration for publishers
 */

import express, { Request, Response } from 'express';
import { x402Middleware } from '@unlock/publisher-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
// Use a properly checksummed test address
const PAY_TO_ADDRESS = process.env.PAY_TO_ADDRESS || '0x742d35Cc6634C0532925a3B844Bc9e7595f0bEb';
const NETWORK = (process.env.NETWORK as 'base' | 'bnb') || 'base';

app.use(express.json());
app.use(express.static('public'));

// Detailed logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[${timestamp}] Response Status: ${res.statusCode}`);
    console.log('Response Headers:', JSON.stringify(res.getHeaders(), null, 2));
    if (res.statusCode === 402) {
      console.log('402 Payment Required Body:', data);
    }
    return originalSend.call(this, data);
  };
  
  next();
});

const paymentRoutes = {
  '/premium/article-1': '$0.10',
  '/premium/article-2': '$0.15',
  '/premium/whitepaper': '$0.50',
  '/api/data': '$0.01',
  '/api/analytics': (req: Request) => {
    const queries = parseInt(req.query.queries as string) || 1;
    return `$${(queries * 0.005).toFixed(2)}`;
  }
};

app.use(x402Middleware(
  {
    payToAddress: PAY_TO_ADDRESS,
    network: NETWORK,
    refundPolicy: 'Full refund within 30 minutes of purchase'
  },
  paymentRoutes
));

app.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unlock Demo Server</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 16px;
          padding: 48px;
          max-width: 800px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
          font-size: 42px;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .routes {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .routes h2 {
          font-size: 20px;
          margin-bottom: 16px;
          color: #1a1a1a;
        }
        .route {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .route:last-child { border-bottom: none; }
        .route-path {
          font-family: monospace;
          color: #667eea;
          font-weight: 500;
        }
        .route-price {
          color: #00b894;
          font-weight: 600;
        }
        .cta {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
        .cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        .badge {
          display: inline-block;
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">🔓 Powered by x402</div>
        <h1>Unlock Demo Server</h1>
        <p>This server demonstrates x402 micropayment integration. Try accessing protected routes with the Unlock extension!</p>
        
        <div class="routes">
          <h2>Protected Routes</h2>
          <div class="route">
            <span class="route-path">/premium/article-1</span>
            <span class="route-price">$0.10</span>
          </div>
          <div class="route">
            <span class="route-path">/premium/article-2</span>
            <span class="route-price">$0.15</span>
          </div>
          <div class="route">
            <span class="route-path">/premium/whitepaper</span>
            <span class="route-price">$0.50</span>
          </div>
          <div class="route">
            <span class="route-path">/api/data</span>
            <span class="route-price">$0.01</span>
          </div>
          <div class="route">
            <span class="route-path">/api/analytics?queries=N</span>
            <span class="route-price">$0.005/query</span>
          </div>
        </div>

        <a href="/premium/article-1" class="cta">Try Premium Article →</a>
      </div>
    </body>
    </html>
  `);
});

app.get('/premium/article-1', (req: Request, res: Response) => {
  const receipt = (req as any).x402Receipt;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Premium Article 1 - Unlocked</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Georgia, serif;
          background: #fafafa;
          padding: 48px 24px;
        }
        .article {
          max-width: 700px;
          margin: 0 auto;
          background: white;
          padding: 64px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .unlock-badge {
          background: #00b894;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 24px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        h1 {
          font-size: 42px;
          line-height: 1.2;
          margin-bottom: 16px;
          color: #1a1a1a;
        }
        .meta {
          color: #999;
          font-size: 14px;
          margin-bottom: 32px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        p {
          font-size: 18px;
          line-height: 1.8;
          color: #333;
          margin-bottom: 24px;
        }
        .receipt {
          background: #f8f9fa;
          border-left: 4px solid #00b894;
          padding: 16px;
          margin-top: 48px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 14px;
          color: #666;
        }
        .receipt strong {
          color: #00b894;
        }
      </style>
    </head>
    <body>
      <div class="article">
        <div class="unlock-badge">🔓 Unlocked with x402</div>
        <h1>The Future of Web Monetization</h1>
        <div class="meta">October 31, 2025 · 5 min read</div>
        
        <p>
          The internet's monetization model is broken. For two decades, we've oscillated between
          two extremes: intrusive advertising that tracks users across the web, or paywalls that
          lock out casual readers. Neither serves creators nor consumers well.
        </p>
        
        <p>
          Enter x402—a revival of HTTP's forgotten status code that enables seamless micropayments.
          By embedding payment requirements directly into web protocols, we eliminate the friction
          that has plagued digital transactions since the web's inception.
        </p>
        
        <p>
          Imagine browsing the web where premium content, API calls, and digital services are
          instantly accessible for pennies. No subscriptions to manage, no personal data harvested,
          just frictionless value exchange. This isn't just theoretical—transaction volumes have
          exploded 10,000% in recent months as AI agents and savvy users adopt the protocol.
        </p>
        
        <p>
          Publishers earn directly from readers without intermediaries taking massive cuts.
          Creators can monetize individual pieces rather than forcing all-or-nothing subscriptions.
          Developers can expose APIs without complex authentication schemes. The web becomes
          truly open yet sustainable.
        </p>
        
        <p>
          This article itself demonstrates the concept. You paid $0.10—a fraction of a coffee—to
          access premium content without ads, tracking, or subscription commitments. Scale this
          across millions of transactions, and we unlock a fundamentally better internet.
        </p>
        
        ${receipt ? `
        <div class="receipt">
          <strong>✓ Payment Receipt</strong><br>
          Transaction: ${receipt.transactionHash.substring(0, 20)}...<br>
          Amount: ${(parseInt(receipt.amount) / 1e18).toFixed(2)} USDC<br>
          Network: ${receipt.network}<br>
          Refundable within 30 minutes
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `);
});

app.get('/premium/article-2', (req: Request, res: Response) => {
  res.send(`
    <html>
    <head><title>Premium Article 2</title></head>
    <body style="font-family: sans-serif; max-width: 700px; margin: 64px auto; padding: 24px;">
      <h1>🔓 AI Agents and the $30T Economy</h1>
      <p>This premium content explores how autonomous AI agents are driving x402 adoption...</p>
      <p>You unlocked this for $0.15.</p>
    </body>
    </html>
  `);
});

app.get('/premium/whitepaper', (req: Request, res: Response) => {
  res.send(`
    <html>
    <head><title>Technical Whitepaper</title></head>
    <body style="font-family: monospace; max-width: 800px; margin: 64px auto; padding: 24px;">
      <h1>x402 Protocol Specification</h1>
      <p>Technical deep-dive into HTTP 402 revival and micropayment architecture...</p>
      <p>Unlocked for $0.50.</p>
    </body>
    </html>
  `);
});

app.get('/api/data', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      users: 127845,
      transactions: 932000,
      volume: 483120.50
    },
    paid: true,
    cost: '$0.01'
  });
});

app.get('/api/analytics', (req: Request, res: Response) => {
  const queries = parseInt(req.query.queries as string) || 1;
  
  res.json({
    success: true,
    queries,
    results: Array.from({ length: queries }, (_, i) => ({
      metric: `metric_${i + 1}`,
      value: Math.random() * 1000
    })),
    cost: `$${(queries * 0.005).toFixed(3)}`
  });
});

app.listen(PORT, () => {
  console.log(`
  🔓 Unlock Demo Server
  
  Running on: http://localhost:${PORT}
  Pay-to address: ${PAY_TO_ADDRESS}
  Network: ${NETWORK}
  
  Try these routes with the Unlock extension:
  1. http://localhost:${PORT}/premium/article-1 ($0.10)
  2. http://localhost:${PORT}/api/data ($0.01)
  3. http://localhost:${PORT}/api/analytics?queries=10 ($0.05)
  `);
});

