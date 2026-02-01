/**
 * Unlock Popup UI Controller
 */

let cachedEndpoints = null;
let currentTab = 'wallet';

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  setupEventListeners();
  setupTabs();
  await checkOnboarding();
});

async function loadConfig() {
  const config = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
  
  if (config) {
    document.getElementById('starter-credits').textContent = `$${config.starterCredits}`;
    document.getElementById('daily-spent').textContent = `$${config.dailyCap.spent}`;
    document.getElementById('daily-cap').textContent = `$${config.dailyCap.limit}`;
    document.getElementById('auto-pay').checked = config.autoPayEnabled;
    document.getElementById('max-transaction').value = config.maxPerTransaction;
    
    renderReceipts(config.receipts);
  }
}

function renderReceipts(receipts) {
  const list = document.getElementById('receipts-list');
  
  if (!receipts || receipts.length === 0) {
    list.innerHTML = '<div class="empty-state">No unlocks yet. Browse the web!</div>';
    return;
  }
  
  const recent = receipts.slice(-5).reverse();
  
  list.innerHTML = recent.map(receipt => {
    const url = new URL(receipt.url).hostname;
    const date = new Date(receipt.timestamp).toLocaleString();
    
    return `
      <div class="receipt-item">
        <div class="receipt-url">${url}</div>
        <div class="receipt-meta">
          <span>${date}</span>
          <span class="receipt-amount">$${receipt.amount}</span>
        </div>
      </div>
    `;
  }).join('');
}

function setupEventListeners() {
  document.getElementById('auto-pay').addEventListener('change', async (e) => {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_CONFIG',
      updates: { autoPayEnabled: e.target.checked }
    });
  });
  
  document.getElementById('max-transaction').addEventListener('change', async (e) => {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_CONFIG',
      updates: { maxPerTransaction: e.target.value }
    });
  });
  
  document.getElementById('manage-wallet')?.addEventListener('click', openWalletModal);
  
  document.getElementById('view-all').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://unlock.xyz/receipts' });
  });
  
  document.getElementById('retry-bazaar')?.addEventListener('click', () => {
    loadBazaarEndpoints(true);
  });
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
      
      currentTab = targetTab;
      
      if (targetTab === 'discovery' && !cachedEndpoints) {
        loadBazaarEndpoints();
      }
    });
  });
}

async function loadBazaarEndpoints(forceRefresh = false) {
  const loadingEl = document.getElementById('bazaar-loading');
  const errorEl = document.getElementById('bazaar-error');
  const listEl = document.getElementById('endpoints-list');
  
  if (cachedEndpoints && !forceRefresh) {
    renderEndpoints(cachedEndpoints);
    return;
  }
  
  loadingEl.style.display = 'block';
  errorEl.style.display = 'none';
  listEl.innerHTML = '';
  
  try {
    const endpoints = await fetchBazaarEndpoints();
    cachedEndpoints = endpoints;
    
    loadingEl.style.display = 'none';
    renderEndpoints(endpoints);
  } catch (error) {
    console.error('Failed to load Bazaar endpoints:', error);
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
  }
}

async function fetchBazaarEndpoints() {
  const response = await chrome.runtime.sendMessage({ type: 'FETCH_BAZAAR' });
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  return response.endpoints || [];
}

function renderEndpoints(endpoints) {
  const listEl = document.getElementById('endpoints-list');
  
  if (!endpoints || endpoints.length === 0) {
    listEl.innerHTML = '<div class="empty-endpoints">No endpoints available yet. Check back soon!</div>';
    return;
  }
  
  listEl.innerHTML = endpoints.map((endpoint, index) => {
    const priceDisplay = formatPrice(endpoint.price);
    const network = endpoint.network || 'base-sepolia';
    
    return `
      <div class="endpoint-card" data-index="${index}">
        <div class="endpoint-header">
          <div>
            <div class="endpoint-name">${escapeHtml(endpoint.name || 'Unnamed Endpoint')}</div>
            <div class="endpoint-url">${escapeHtml(endpoint.url)}</div>
          </div>
          <div class="endpoint-price">${priceDisplay}</div>
        </div>
        
        <div class="endpoint-description">
          ${escapeHtml(endpoint.description || 'No description available')}
        </div>
        
        <div class="endpoint-meta">
          <div class="endpoint-meta-item">
            <span>🌐</span>
            <span>${network}</span>
          </div>
          ${endpoint.category ? `
            <div class="endpoint-meta-item">
              <span>📁</span>
              <span>${escapeHtml(endpoint.category)}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="endpoint-actions">
          <button class="btn-test" data-url="${escapeHtml(endpoint.url)}" data-index="${index}">
            Test Endpoint
          </button>
          <button class="btn-copy" data-url="${escapeHtml(endpoint.url)}">
            Copy URL
          </button>
        </div>
        
        <div id="result-${index}" class="endpoint-result" style="display: none;"></div>
      </div>
    `;
  }).join('');
  
  document.querySelectorAll('.btn-test').forEach(btn => {
    btn.addEventListener('click', (e) => testEndpoint(e.target.dataset.url, e.target.dataset.index));
  });
  
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', (e) => copyToClipboard(e.target.dataset.url));
  });
}

async function testEndpoint(url, index) {
  const btn = document.querySelector(`.btn-test[data-index="${index}"]`);
  const resultEl = document.getElementById(`result-${index}`);
  
  btn.disabled = true;
  btn.textContent = 'Testing...';
  resultEl.style.display = 'block';
  resultEl.className = 'endpoint-result';
  resultEl.textContent = 'Sending request...';
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TEST_ENDPOINT',
      url: url
    });
    
    if (response.success) {
      resultEl.className = 'endpoint-result success';
      resultEl.textContent = `✓ Success! Cost: $${response.cost || '0.00'}\n\nResponse preview:\n${JSON.stringify(response.preview, null, 2).substring(0, 200)}...`;
      
      await chrome.runtime.sendMessage({
        type: 'TRACK_DISCOVERY_USAGE',
        url: url,
        cost: response.cost
      });
    } else {
      resultEl.className = 'endpoint-result error';
      resultEl.textContent = `✗ Error: ${response.error || 'Unknown error'}`;
    }
  } catch (error) {
    resultEl.className = 'endpoint-result error';
    resultEl.textContent = `✗ Failed: ${error.message}`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Test Endpoint';
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('URL copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a1a;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 13px;
    z-index: 10000;
    animation: slideUp 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function formatPrice(price) {
  if (typeof price === 'string' && price.startsWith('$')) {
    return price;
  }
  
  if (typeof price === 'number') {
    return `$${price.toFixed(2)}`;
  }
  
  const parsed = parseFloat(price);
  if (!isNaN(parsed)) {
    return `$${parsed.toFixed(2)}`;
  }
  
  return price || 'Price varies';
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Onboarding Flow
let currentSlide = 1;
const totalSlides = 3;

async function checkOnboarding() {
  const result = await chrome.storage.local.get('onboardingCompleted');
  
  if (!result.onboardingCompleted) {
    showOnboarding();
  }
}

function showOnboarding() {
  const modal = document.getElementById('onboarding-modal');
  modal.style.display = 'flex';
  currentSlide = 1;
  goToSlide(1);
  setupOnboardingListeners();
}

function setupOnboardingListeners() {
  document.getElementById('onboarding-skip')?.addEventListener('click', completeOnboarding);
  document.getElementById('onboarding-next')?.addEventListener('click', nextSlide);
  document.getElementById('onboarding-demo')?.addEventListener('click', openDemoSite);
  
  // Dot navigation
  document.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      const targetSlide = parseInt(e.target.dataset.slide);
      if (targetSlide) {
        goToSlide(targetSlide);
      }
    });
  });
}

function nextSlide() {
  if (currentSlide < totalSlides) {
    currentSlide++;
    goToSlide(currentSlide);
  }
}

function goToSlide(slideNum) {
  currentSlide = slideNum;
  
  // Update slides
  document.querySelectorAll('.onboarding-slide').forEach(slide => {
    slide.classList.remove('active');
  });
  document.querySelector(`.onboarding-slide[data-slide="${slideNum}"]`)?.classList.add('active');
  
  // Update dots
  document.querySelectorAll('.dot').forEach(dot => {
    dot.classList.remove('active');
  });
  document.querySelector(`.dot[data-slide="${slideNum}"]`)?.classList.add('active');
  
  // Update buttons
  const nextBtn = document.getElementById('onboarding-next');
  const demoBtn = document.getElementById('onboarding-demo');
  
  if (slideNum === totalSlides) {
    nextBtn.style.display = 'none';
    demoBtn.style.display = 'block';
  } else {
    nextBtn.style.display = 'block';
    demoBtn.style.display = 'none';
  }
}

function completeOnboarding() {
  chrome.storage.local.set({ onboardingCompleted: true });
  document.getElementById('onboarding-modal').style.display = 'none';
}

function openDemoSite() {
  completeOnboarding();
  chrome.tabs.create({ url: 'http://localhost:3000' });
}

// Wallet Management
let currentNetwork = 'base-sepolia';

function openWalletModal() {
  document.getElementById('wallet-modal').style.display = 'flex';
  setupWalletListeners();
  updateWalletUI();
}

function closeWalletModal() {
  document.getElementById('wallet-modal').style.display = 'none';
}

function setupWalletListeners() {
  document.getElementById('close-wallet-modal')?.addEventListener('click', closeWalletModal);
  
  // Network selector
  document.querySelectorAll('.network-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const network = e.currentTarget.dataset.network;
      switchNetwork(network);
    });
  });
  
  // Wallet providers
  document.querySelectorAll('.provider-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const provider = e.currentTarget.dataset.provider;
      connectWallet(provider);
    });
  });
  
  // Funding buttons
  document.getElementById('get-test-usdc')?.addEventListener('click', openTestnetFaucet);
  document.getElementById('bridge-testnet')?.addEventListener('click', openTestnetBridge);
  document.getElementById('buy-usdc-coinbase')?.addEventListener('click', openCoinbaseBuy);
  document.getElementById('bridge-mainnet')?.addEventListener('click', openMainnetBridge);
}

function switchNetwork(network) {
  currentNetwork = network;
  
  // Update UI
  document.querySelectorAll('.network-option').forEach(opt => {
    opt.classList.remove('active');
    if (opt.dataset.network === network) {
      opt.classList.add('active');
    }
  });
  
  // Show appropriate funding options
  if (network === 'base-sepolia') {
    document.getElementById('funding-testnet').style.display = 'flex';
    document.getElementById('funding-mainnet').style.display = 'none';
  } else {
    document.getElementById('funding-testnet').style.display = 'none';
    document.getElementById('funding-mainnet').style.display = 'flex';
  }
  
  // Update config
  chrome.runtime.sendMessage({
    type: 'UPDATE_CONFIG',
    updates: { network: network }
  });
  
  showToast(`Switched to ${network === 'base-sepolia' ? 'Base Sepolia (Testnet)' : 'Base (Mainnet)'}`);
}

async function connectWallet(provider) {
  const statusEl = document.getElementById('wallet-status');
  const statusText = statusEl.querySelector('.status-text');
  const addressEl = document.getElementById('wallet-address');
  
  statusText.textContent = `Connecting to ${provider}...`;
  
  try {
    let address = null;
    
    if (provider === 'metamask') {
      address = await connectMetaMask();
    } else if (provider === 'coinbase') {
      address = await connectCoinbaseWallet();
    } else if (provider === 'generated') {
      address = await generateWallet();
    }
    
    if (address) {
      statusEl.classList.add('connected');
      statusText.textContent = `Connected via ${provider}`;
      addressEl.textContent = address;
      addressEl.style.display = 'block';
      
      // Update balance
      await updateWalletBalance(address);
      
      showToast(`✓ Wallet connected: ${address.substring(0, 6)}...${address.substring(38)}`);
    }
  } catch (error) {
    statusText.textContent = 'Connection failed';
    showToast(`✗ Failed to connect: ${error.message}`);
  }
}

async function connectMetaMask() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask not installed. Please install MetaMask browser extension.');
  }
  
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}

async function connectCoinbaseWallet() {
  // Placeholder for Coinbase Wallet SDK integration
  throw new Error('Coinbase Wallet integration coming soon. Use MetaMask or Generate Wallet for now.');
}

async function generateWallet() {
  const response = await chrome.runtime.sendMessage({ type: 'GENERATE_WALLET' });
  if (response.error) {
    throw new Error(response.error);
  }
  return response.address;
}

async function updateWalletBalance(address) {
  // For now, show starter credits
  // TODO: Query actual USDC balance on-chain
  const config = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
  const balanceEl = document.getElementById('wallet-balance');
  balanceEl.textContent = `$${config.starterCredits}`;
}

function updateWalletUI() {
  // Update with current wallet state
  chrome.runtime.sendMessage({ type: 'GET_WALLET_STATUS' }).then(status => {
    if (status && status.address) {
      const statusEl = document.getElementById('wallet-status');
      const addressEl = document.getElementById('wallet-address');
      
      statusEl.classList.add('connected');
      statusEl.querySelector('.status-text').textContent = `Connected via ${status.provider || 'wallet'}`;
      addressEl.textContent = status.address;
      addressEl.style.display = 'block';
    }
  });
}

// External links for funding
function openTestnetFaucet() {
  chrome.tabs.create({ 
    url: 'https://www.coinbase.com/faucets/base-sepolia-faucet'
  });
}

function openTestnetBridge() {
  chrome.tabs.create({ 
    url: 'https://bridge.base.org/deposit?chainId=84532'
  });
}

function openCoinbaseBuy() {
  chrome.tabs.create({ 
    url: 'https://www.coinbase.com/price/usd-coin'
  });
}

function openMainnetBridge() {
  chrome.tabs.create({ 
    url: 'https://bridge.base.org/deposit'
  });
}

