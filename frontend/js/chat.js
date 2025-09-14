// ===== CHAT ÉQUIPE MODULE =====
window.chat = {
    data: {
        messages: [],
        users: [],
        isConnected: false
    },
    currentUser: null,

    async load() {
        try {
            this.currentUser = app.state.currentUser;
            this.loadMessages();
            this.updateStatus();
            this.render();
        } catch (error) {
            console.error('Error loading chat:', error);
            app.showMessage('Erreur lors du chargement du chat', 'error');
            this.render();
        }
    },

    loadMessages() {
        // Load messages from localStorage (simulated)
        this.data.messages = JSON.parse(localStorage.getItem('h2eaux_chat_messages') || '[]');
        
        // Add some default messages if empty
        if (this.data.messages.length === 0) {
            this.data.messages = [
                {
                    id: '1',
                    user: 'admin',
                    message: 'Bienvenue dans le chat d\'équipe H2EAUX GESTION !',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    type: 'system'
                },
                {
                    id: '2',
                    user: 'employe1',
                    message: 'Bonjour, j\'ai terminé l\'installation chez Mme Martin.',
                    timestamp: new Date(Date.now() - 1800000).toISOString(),
                    type: 'message'
                }
            ];
            this.saveMessages();
        }
    },

    saveMessages() {
        localStorage.setItem('h2eaux_chat_messages', JSON.stringify(this.data.messages));
    },

    render() {
        this.renderMessages();
    },

    renderMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        if (this.data.messages.length === 0) {
            container.innerHTML = `
                <div class="chat-empty">
                    <div class="chat-empty-icon">💬</div>
                    <p>Aucun message</p>
                    <small>Commencez la conversation avec votre équipe</small>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.messages.map(msg => this.renderMessage(msg)).join('');
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    },

    renderMessage(message) {
        const isCurrentUser = message.user === this.currentUser?.username;
        const messageClass = isCurrentUser ? 'message-sent' : 'message-received';
        const timestamp = new Date(message.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (message.type === 'system') {
            return `
                <div class="message-system">
                    <div class="message-content">${message.message}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
        }

        return `
            <div class="message-item ${messageClass}">
                <div class="message-header">
                    <span class="message-user">${message.user}</span>
                    <span class="message-time">${timestamp}</span>
                </div>
                <div class="message-content">${this.formatMessage(message.message)}</div>
            </div>
        `;
    },

    formatMessage(message) {
        // Basic message formatting
        return message
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    },

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        const newMessage = {
            id: Date.now().toString(),
            user: this.currentUser?.username || 'Anonyme',
            message: message,
            timestamp: new Date().toISOString(),
            type: 'message'
        };

        this.data.messages.push(newMessage);
        this.saveMessages();
        
        input.value = '';
        this.renderMessages();

        // Simulate response from other user (for demo)
        if (message.toLowerCase().includes('bonjour') || message.toLowerCase().includes('salut')) {
            setTimeout(() => {
                this.simulateResponse('Salut ! Comment ça va ?');
            }, 2000);
        }
    },

    simulateResponse(responseText) {
        const otherUser = this.currentUser?.username === 'admin' ? 'employe1' : 'admin';
        
        const response = {
            id: Date.now().toString(),
            user: otherUser,
            message: responseText,
            timestamp: new Date().toISOString(),
            type: 'message'
        };

        this.data.messages.push(response);
        this.saveMessages();
        this.renderMessages();
    },

    handleKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    },

    updateStatus() {
        const statusIndicator = document.getElementById('chatStatus');
        const statusText = document.getElementById('chatStatusText');
        
        if (statusIndicator && statusText) {
            // Simulate connection status
            this.data.isConnected = true;
            
            if (this.data.isConnected) {
                statusIndicator.className = 'status-indicator online';
                statusText.textContent = 'En ligne';
            } else {
                statusIndicator.className = 'status-indicator offline';
                statusText.textContent = 'Hors ligne';
            }
        }
    },

    // Simulated real-time functionality
    startPolling() {
        setInterval(() => {
            // In a real implementation, this would poll the server for new messages
            this.checkForNewMessages();
        }, 5000);
    },

    checkForNewMessages() {
        // Placeholder for real-time message checking
        // In a real implementation, this would make an API call
    },

    // Utility methods
    addSystemMessage(message) {
        const systemMessage = {
            id: Date.now().toString(),
            user: 'system',
            message: message,
            timestamp: new Date().toISOString(),
            type: 'system'
        };

        this.data.messages.push(systemMessage);
        this.saveMessages();
        this.renderMessages();
    },

    clearChat() {
        if (confirm('Effacer tout l\'historique du chat ?')) {
            this.data.messages = [];
            this.saveMessages();
            this.renderMessages();
            app.showMessage('Historique du chat effacé', 'success');
        }
    }
};