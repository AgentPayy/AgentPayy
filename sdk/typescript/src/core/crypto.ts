import { ethers } from 'ethers';
import type { PaymentData, PaymentProof } from './types';

/**
 * Create deterministic hash of API input
 */
export function createInputHash(input: any): string {
  const inputJson = JSON.stringify(input, null, 0);
  return ethers.keccak256(ethers.toUtf8Bytes(inputJson));
}

/**
 * Generate payment hash for verification
 */
export function createPaymentHash(
  modelId: string,
  payer: string,
  amount: string,
  timestamp: number
): string {
  return ethers.solidityPackedKeccak256(
    ['string', 'address', 'uint256', 'uint256'],
    [modelId, payer, amount, timestamp]
  );
}

/**
 * Verify payment signature
 */
export function verifyPaymentSignature(
  paymentHash: string,
  signature: string,
  expectedSigner: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(
      ethers.getBytes(paymentHash),
      signature
    );
    return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
  } catch (error) {
    return false;
  }
}

/**
 * Create payment proof for API calls
 */
export function createPaymentProof(
  txHash: string,
  signature: string,
  payer: string,
  amount: string,
  timestamp: number
): PaymentProof {
  return {
    txHash,
    signature,
    payer,
    amount,
    timestamp,
    verified: false // Will be verified by paywall
  };
}

/**
 * Generate permit signature for USDC
 */
export async function createPermitSignature(
  signer: ethers.Signer,
  tokenAddress: string,
  owner: string,
  spender: string,
  value: string,
  deadline: number,
  chainId: number
): Promise<{ v: number; r: string; s: string }> {
  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: chainId,
    verifyingContract: tokenAddress
  };

  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  };

  // Get nonce from token contract
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function nonces(address) view returns (uint256)'],
    signer.provider
  );
  const nonce = await tokenContract.nonces(owner);

  const permitValue = { owner, spender, value, nonce, deadline };
  const signature = await signer.signTypedData(domain, types, permitValue);
  const { v, r, s } = ethers.Signature.from(signature);

  return { v, r, s };
}

/**
 * Prepare smart wallet payment data
 */
export async function prepareSmartWalletPayment(
  signer: ethers.Signer,
  modelId: string,
  inputHash: string,
  amount: string,
  deadline: number
): Promise<PaymentData> {
  const messageHash = ethers.solidityPackedKeccak256(
    ['string', 'bytes32', 'uint256', 'uint256'],
    [modelId, inputHash, amount, deadline]
  );

  const signature = await signer.signMessage(ethers.getBytes(messageHash));

  return {
    modelId,
    inputHash,
    amount,
    deadline,
    smartWalletSig: signature,
    v: 0,
    r: ethers.ZeroHash,
    s: ethers.ZeroHash
  };
}

/**
 * Prepare permit-based payment data
 */
export async function preparePermitPayment(
  signer: ethers.Signer,
  modelId: string,
  inputHash: string,
  amount: string,
  deadline: number,
  tokenAddress: string,
  spenderAddress: string,
  chainId: number
): Promise<PaymentData> {
  const owner = await signer.getAddress();
  const permitSig = await createPermitSignature(
    signer,
    tokenAddress,
    owner,
    spenderAddress,
    amount,
    deadline,
    chainId
  );

  return {
    modelId,
    inputHash,
    amount,
    deadline,
    smartWalletSig: '0x',
    v: permitSig.v,
    r: permitSig.r,
    s: permitSig.s
  };
}

/**
 * Format amount for display
 */
export function formatAmount(amount: string, decimals: number = 6): string {
  return ethers.formatUnits(amount, decimals);
}

/**
 * Parse amount from display format
 */
export function parseAmount(amount: string, decimals: number = 6): string {
  return ethers.parseUnits(amount, decimals).toString();
} 