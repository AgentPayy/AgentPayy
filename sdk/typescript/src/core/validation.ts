import { ethers } from 'ethers';

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Validate amount string
 */
export function isValidAmount(amount: string): boolean {
  try {
    const parsed = ethers.parseUnits(amount, 6); // USDC has 6 decimals
    return parsed > 0n;
  } catch {
    return false;
  }
}

/**
 * Validate model ID format
 */
export function isValidModelId(modelId: string): boolean {
  return typeof modelId === 'string' && modelId.length > 0 && modelId.length <= 100;
}

/**
 * Validate chain name
 */
export function isValidChain(chain: string): boolean {
  const validChains = ['base', 'arbitrum', 'optimism', 'polygon', 'ethereum'];
  return validChains.includes(chain.toLowerCase());
}

/**
 * Validate private key format
 */
export function isValidPrivateKey(privateKey: string): boolean {
  try {
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
} 