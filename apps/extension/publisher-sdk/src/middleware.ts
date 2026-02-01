/**
 * Unlock Publisher SDK
 * Wraps official x402-express with Unlock-specific features
 */

import { Request, Response, NextFunction } from 'express';
import { paymentMiddleware as x402PaymentMiddleware } from 'x402-express';
import { X402Config, RouteConfig } from './types';

const COINBASE_FACILITATOR = 'https://api.cdp.coinbase.com/x402';

/**
 * Unlock middleware wrapper around official x402-express
 * Converts dollar amounts to atomic units and adds Unlock branding
 */
export function x402Middleware(config: X402Config, routes: RouteConfig) {
  const network = config.network || 'base';
  const facilitatorUrl = config.facilitator || COINBASE_FACILITATOR;

  // Convert Unlock route config to x402-express format
  const x402Routes: Record<string, any> = {};
  
  for (const [path, priceOrFn] of Object.entries(routes)) {
    const method = 'GET';
    const key = `${method} ${path}`;
    
    if (typeof priceOrFn === 'function') {
      // Dynamic pricing
      x402Routes[key] = {
        price: (req: Request) => {
          const price = priceOrFn(req);
          return dollarStringToPrice(price);
        },
        network: network === 'base' ? 'base-sepolia' : network
      };
    } else {
      // Static pricing
      x402Routes[key] = {
        price: dollarStringToPrice(priceOrFn),
        network: network === 'base' ? 'base-sepolia' : network
      };
    }
  }

  // Use official x402-express middleware
  return x402PaymentMiddleware(
    config.payToAddress,
    x402Routes,
    {
      url: facilitatorUrl as `${string}://${string}`
    }
  );
}

/**
 * Convert dollar string like "$0.10" to x402 price format
 * USDC has 6 decimals on most chains
 */
function dollarStringToPrice(priceStr: string): string {
  const dollars = parseFloat(priceStr.replace('$', ''));
  return `$${dollars.toFixed(3)}`;
}

/**
 * Simple one-route middleware
 */
export function simpleX402(payToAddress: string, price: string, network: 'base' | 'bnb' | 'ethereum' | 'polygon' = 'base') {
  return x402Middleware(
    { payToAddress, network },
    { '/*': price }
  );
}

