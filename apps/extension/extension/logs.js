/**
 * Unlock Debug Logs Viewer
 */

async function loadLogs() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_LOGS' });
  const logs = response.logs || [];
  
  const container = document.getElementById('logs');
  
  if (logs.length === 0) {
    container.innerHTML = '<div class="empty-state">No logs yet. Try using the extension!</div>';
    return;
  }
  
  // Reverse to show newest first
  const reversed = [...logs].reverse();
  
  container.innerHTML = reversed.map(log => {
    const dataStr = log.data ? JSON.stringify(log.data, null, 2) : '';
    
    return `
      <div class="log-entry ${log.level}">
        <div class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</div>
        <div class="log-message">[${log.level.toUpperCase()}] ${log.message}</div>
        ${dataStr ? `<div class="log-data">${dataStr}</div>` : ''}
      </div>
    `;
  }).join('');
}

document.getElementById('refresh').addEventListener('click', loadLogs);

document.getElementById('clear').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'CLEAR_LOGS' });
  await loadLogs();
});

document.getElementById('back').addEventListener('click', () => {
  window.location.href = 'popup.html';
});

// Auto-refresh every 2 seconds
setInterval(loadLogs, 2000);

// Initial load
loadLogs();

