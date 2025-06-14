export const CONTRACTS = {
  base: '0x...',  // Set after deployment
  arbitrum: '0x...',
  optimism: '0x...'
};

export const USDC_ADDRESSES = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'
};

export const RPC_URLS = {
  base: 'https://mainnet.base.org',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  optimism: 'https://mainnet.optimism.io'
};

export const CONTRACT_ABI = [
  "function payAndCall(tuple(string modelId, bytes32 inputHash, uint256 amount, uint256 deadline, bytes smartWalletSig, uint8 v, bytes32 r, bytes32 s) payment)",
  "function registerModel(string modelId, string endpoint, uint256 price, address token)",
  "function depositBalance(address token, uint256 amount)",
  "function withdraw(address token)",
  "function withdrawBalance(address token, uint256 amount)",
  "function getBalance(address user, address token) view returns (uint256)",
  "function getUserBalance(address user, address token) view returns (uint256)",
  "function getModel(string modelId) view returns (tuple(address owner, string endpoint, uint256 price, address token, bool active, uint256 totalCalls, uint256 totalRevenue))",
  "function verifyAPIPayment(bytes32 paymentHash, address expectedPayer, uint256 expectedAmount, string memory apiEndpoint) view returns (bool)",
  "event PaymentProcessed(string indexed modelId, address indexed payer, address indexed payee, uint256 amount, bytes32 inputHash)",
  "event ModelRegistered(string indexed modelId, address indexed owner, uint256 price)",
  "event EarningsWithdrawn(address indexed user, address indexed token, uint256 amount)"
];

export function getContractAddress(chain: 'base' | 'arbitrum' | 'optimism'): string {
  const address = CONTRACTS[chain];
  if (!address || address === '0x...') {
    throw new Error(`Contract not deployed on ${chain}`);
  }
  return address;
}

export function getUSDCAddress(chain: 'base' | 'arbitrum' | 'optimism'): string {
  return USDC_ADDRESSES[chain];
}

export function getRPCUrl(chain: 'base' | 'arbitrum' | 'optimism'): string {
  return RPC_URLS[chain];
} 