document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('status-text');
    const serverName = document.getElementById('server-name');
    const playerCount = document.getElementById('player-count');
    const playerList = document.getElementById('player-list');
    const version = document.getElementById('version');
    const ping = document.getElementById('ping');
    const motd = document.getElementById('motd');
    const serverInput = document.getElementById('server-input');
    const checkButton = document.getElementById('check-button');
    const ipAddress = document.getElementById('ip-address');
    const copyButtons = document.querySelectorAll('.copy-btn');
    const favButton = document.querySelector('.fav-btn');
    const shareButton = document.querySelector('.share-btn');
    const quickLinks = document.querySelectorAll('.quick-links a');
    const historyList = document.querySelector('.history-list');

    // Server history array
    let serverHistory = JSON.parse(localStorage.getItem('serverHistory')) || [];
    
    // Initialize the app
    function init() {
        renderHistory();
        loadLastServer();
        setupEventListeners();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        checkButton.addEventListener('click', checkServer);
        serverInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkServer();
        });
        
        copyButtons.forEach(btn => {
            btn.addEventListener('click', copyToClipboard);
        });
        
        favButton.addEventListener('click', toggleFavorite);
        shareButton.addEventListener('click', shareServer);
        
        quickLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const ip = link.getAttribute('data-ip');
                serverInput.value = ip;
                checkServer();
            });
        });
        
        // History item click
        historyList.addEventListener('click', (e) => {
            const historyItem = e.target.closest('.history-item');
            if (historyItem) {
                const serverName = historyItem.querySelector('.history-name').textContent;
                serverInput.value = serverName;
                checkServer();
            }
        });
    }
    
    // Load last checked server from localStorage
    function loadLastServer() {
        if (serverHistory.length > 0) {
            serverInput.value = serverHistory[0].ip;
            checkServer();
        }
    }
    
    // Render server history
    function renderHistory() {
        historyList.innerHTML = '';
        
        serverHistory.slice(0, 5).forEach(server => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            historyItem.innerHTML = `
                <span class="history-name">${server.ip}</span>
                <span class="history-status ${server.online ? 'online' : 'offline'}">
                    ${server.online ? 'Online' : 'Offline'}
                </span>
            `;
            
            historyList.appendChild(historyItem);
        });
    }
    
    // Check server status
    async function checkServer() {
        const address = serverInput.value.trim();
        if (!address) return;
        
        // Reset UI
        resetStatusUI();
        
        try {
            const startTime = performance.now();
            const response = await fetch(`https://api.mcsrvstat.us/2/${address}`);
            const pingTime = Math.round(performance.now() - startTime);
            const data = await response.json();
            
            // Update server history
            updateServerHistory(address, data.online);
            
            if (data.online) {
                showOnlineStatus(data, pingTime);
            } else {
                showOfflineStatus();
            }
        } catch (error) {
            console.error('Error fetching server status:', error);
            showErrorStatus();
        }
    }
    
    // Reset status UI
    function resetStatusUI() {
        statusDot.className = 'status-dot pulse';
        statusText.textContent = 'Ellenőrzés...';
        statusText.style.color = '';
        serverName.textContent = '-';
        playerCount.textContent = '-/-';
        playerList.innerHTML = '';
        version.textContent = '-';
        ping.textContent = '-';
        motd.textContent = '-';
        ipAddress.textContent = '-';
    }
    
    // Show online status
    function showOnlineStatus(data, pingTime) {
        statusDot.className = 'status-dot online';
        statusText.textContent = 'Online';
        statusText.style.color = 'var(--primary)';
        
        serverName.textContent = data.hostname || serverInput.value;
        playerCount.textContent = `${data.players?.online || 0}/${data.players?.max || 0}`;
        version.textContent = data.version || 'Ismeretlen';
        ping.textContent = `${pingTime}ms`;
        motd.textContent = data.motd?.clean?.join('\n') || 'Nincs üzenet';
        ipAddress.textContent = `${data.ip || serverInput.value}:${data.port || '25565'}`;
        
        // Player list
        if (data.players?.list) {
            playerList.innerHTML = '';
            data.players.list.forEach(player => {
                const playerElement = document.createElement('div');
                playerElement.textContent = player;
                playerList.appendChild(playerElement);
            });
        }
    }
    
    // Show offline status
    function showOfflineStatus() {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Offline';
        statusText.style.color = 'var(--error)';
        serverName.textContent = serverInput.value;
    }
    
    // Show error status
    function showErrorStatus() {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Hiba';
        statusText.style.color = 'var(--error)';
    }
    
    // Update server history
    function updateServerHistory(ip, isOnline) {
        // Remove if already exists
        serverHistory = serverHistory.filter(server => server.ip !== ip);
        
        // Add to beginning
        serverHistory.unshift({ ip, online: isOnline });
        
        // Keep only last 10 items
        serverHistory = serverHistory.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('serverHistory', JSON.stringify(serverHistory));
        
        // Update UI
        renderHistory();
    }
    
    // Copy to clipboard
    function copyToClipboard(e) {
        const targetId = e.currentTarget.getAttribute('data-target');
        const text = document.getElementById(targetId).textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            const originalText = e.currentTarget.innerHTML;
            e.currentTarget.innerHTML = '<i class="fas fa-check"></i> Másolva!';
            
            setTimeout(() => {
                e.currentTarget.innerHTML = originalText;
            }, 2000);
        });
    }
    
    // Toggle favorite
    function toggleFavorite() {
        favButton.classList.toggle('active');
        
        if (favButton.classList.contains('active')) {
            favButton.innerHTML = '<i class="fas fa-star"></i> Kedvenc';
        } else {
            favButton.innerHTML = '<i class="far fa-star"></i> Kedvenc';
        }
    }
    
    // Share server
    function shareServer() {
        if (navigator.share) {
            navigator.share({
                title: `Minecraft szerver státusz: ${serverName.textContent}`,
                text: `Nézd meg a ${serverName.textContent} Minecraft szerver státuszát!`,
                url: window.location.href
            }).catch(err => {
                console.log('Error sharing:', err);
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            const shareUrl = `${window.location.origin}?server=${encodeURIComponent(serverInput.value)}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                const originalText = shareButton.innerHTML;
                shareButton.innerHTML = '<i class="fas fa-check"></i> Link másolva!';
                
                setTimeout(() => {
                    shareButton.innerHTML = originalText;
                }, 2000);
            });
        }
    }
    
    // Initialize the app
    init();
});