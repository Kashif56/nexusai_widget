/**
 * AI Chatbot Widget
 * An embeddable chatbot widget for any website
 */
(function() {
    // Configuration options with defaults
    const config = {
        // Static configuration (not modifiable by website owners)
        apiEndpoint: 'https://a1b1-39-47-51-227.ngrok-free.app/chat/api/chat/',
        chatbotAccentColor: '#4a6cf7',
        position: 'right',
        width: '400px',
        height: '600px',
        fontSize: '14px',
        autoOpenForExistingSession: true,
        
        // Required configuration from website owners
        chatbot_id: null, // Must be provided by the website owner
        botName: null,    // Must be provided by the website owner
        initialMessage: null, // Must be provided by the website owner
        
        // Optional configuration
        botAvatar: 'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=600',
        sessionKey: null  // Will be auto-generated if not provided
    };

    // Generate a unique session key
    function generateSessionKey() {
        const timestamp = new Date().getTime();
        const randomPart = Math.random().toString(36).substring(2, 10);
        return `session_${timestamp}_${randomPart}`;
    }

    // Merge user configuration with defaults
    function mergeConfig(userConfig) {
        // Only allow changing specific properties
        const allowedProperties = ['chatbot_id', 'botName', 'initialMessage', 'botAvatar', 'sessionKey'];
        
        for (const key in userConfig) {
            if (config.hasOwnProperty(key) && allowedProperties.includes(key)) {
                config[key] = userConfig[key];
            }
        }
        
        // Validate required configuration
        if (!config.chatbot_id) {
            console.error('ChatbotWidget Error: chatbot_id is required');
            return false;
        }
        
        if (!config.botName) {
            console.error('ChatbotWidget Error: botName is required');
            return false;
        }
        
        if (!config.initialMessage) {
            console.error('ChatbotWidget Error: initialMessage is required');
            return false;
        }
        
        // Generate a session key if not provided
        if (!config.sessionKey) {
            config.sessionKey = generateSessionKey();
        }
        
        return true;
    }

    // Create and inject styles
    function injectStyles() {
        const styleElement = document.createElement('style');
        styleElement.id = 'chatbot-widget-styles';
        
        styleElement.innerHTML = `
            #chatbot-widget {
                position: fixed;
                bottom: 20px;
                ${config.position === 'right' ? 'right: 20px;' : 'left: 20px;'}
                z-index: 9999;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: ${config.fontSize};
            }

            #chat-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: ${config.chatbotAccentColor};
                color: white;
                border: none;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                position: relative;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                z-index: 10;
                overflow: hidden;
            }

            #chat-button:hover {
                transform: scale(1.08);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
                background-color: ${adjustColor(config.chatbotAccentColor, -20)};
            }
            
            #chat-button:active {
                transform: scale(0.95);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
            }

            .chat-icon {
                position: absolute;
                transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                color: white;
            }

            .close-icon {
                position: absolute;
                opacity: 0;
                transform: rotate(-90deg) scale(0.5);
                transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                color: white;
            }

            #chat-button.open .chat-icon {
                opacity: 0;
                transform: rotate(90deg) scale(0.5);
            }

            #chat-button.open .close-icon {
                opacity: 1;
                transform: rotate(0deg) scale(1);
            }

            @keyframes pulse {
                0% {
                    box-shadow: 0 0 0 0 ${hexToRgba(config.chatbotAccentColor, 0.4)};
                }
                70% {
                    box-shadow: 0 0 0 15px ${hexToRgba(config.chatbotAccentColor, 0)};
                }
                100% {
                    box-shadow: 0 0 0 0 ${hexToRgba(config.chatbotAccentColor, 0)};
                }
            }

            #chat-button:not(.open) {
                animation: pulse 2s infinite;
            }

            #chat-modal {
                position: absolute;
                bottom: 80px;
                ${config.position === 'right' ? 'right: 0;' : 'left: 0;'}
                width: ${config.width};
                height: ${config.height};
                background-color: white;
                border-radius: 16px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                pointer-events: none;
                z-index: 999;
            }

            #chat-modal.open {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: all;
            }

            .chat-header {
                background-color: ${config.chatbotAccentColor};
                color: white;
                padding: 18px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                position: relative;
                z-index: 1;
            }

            .chat-title {
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: bold;
                font-size: 16px;
            }

            .bot-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid rgba(255, 255, 255, 0.8);
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }

            #minimize-button {
                background: transparent;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s ease;
            }

            #minimize-button:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }

            .chat-messages {
                flex: 1;
                padding: 24px 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 16px;
                background-color: #f8f9fa;
                scroll-behavior: smooth;
            }

            .message {
                display: flex;
                flex-direction: column;
                max-width: 75%;
                margin-bottom: 10px;
                transition: all 0.3s ease;
                animation: message-fade-in 0.3s ease;
            }
            
            @keyframes message-fade-in {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .user-message {
                align-self: flex-end;
            }

            .bot-message {
                align-self: flex-start;
            }

            .message-content {
                padding: 12px 16px;
                border-radius: 18px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                position: relative;
                line-height: 1.5;
                word-wrap: break-word;
            }

            .user-message .message-content {
                background-color: ${config.chatbotAccentColor};
                color: white;
                border-bottom-right-radius: 4px;
                margin-right: 8px;
            }
            
            .user-message .message-content::after {
                content: '';
                position: absolute;
                bottom: 0;
                right: -10px;
                width: 16px;
                height: 16px;
                background-color: ${config.chatbotAccentColor};
                clip-path: polygon(0 0, 0% 100%, 100% 100%);
            }

            .bot-message .message-content {
                background-color: white;
                color: #333;
                border-bottom-left-radius: 4px;
                margin-left: 8px;
            }
            
            .bot-message .message-content::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: -10px;
                width: 16px;
                height: 16px;
                background-color: white;
                clip-path: polygon(100% 0, 0% 100%, 100% 100%);
            }
            
            .timestamp {
                font-size: 10px;
                margin-top: 4px;
                opacity: 0.7;
                align-self: flex-end;
            }
            
            .user-message .timestamp {
                color: #666;
                padding-right: 8px;
            }
            
            .bot-message .timestamp {
                color: #666;
                padding-left: 8px;
            }

            /* Typing indicator styles */
            .typing-indicator {
                align-self: flex-start;
                background-color: white;
                padding: 12px 20px;
                border-radius: 18px;
                border-bottom-left-radius: 4px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                margin-top: 5px;
                position: relative;
                animation: message-fade-in 0.3s ease;
            }

            .typing-indicator span {
                height: 8px;
                width: 8px;
                float: left;
                margin: 0 1px;
                background-color: #9E9EA1;
                display: block;
                border-radius: 50%;
                opacity: 0.4;
            }

            .typing-indicator span:nth-of-type(1) {
                animation: 1s blink infinite 0.3333s;
            }

            .typing-indicator span:nth-of-type(2) {
                animation: 1s blink infinite 0.6666s;
            }

            .typing-indicator span:nth-of-type(3) {
                animation: 1s blink infinite 0.9999s;
            }
            
            .typing-indicator:before {
                content: '';
                position: absolute;
                bottom: -2px;
                left: -7px;
                width: 12px;
                height: 12px;
                background-color: white;
                border-radius: 50%;
                z-index: -1;
            }

            @keyframes blink {
                0% {
                    opacity: 0.4;
                    transform: translateY(0);
                }
                50% {
                    opacity: 1;
                    transform: translateY(-3px);
                }
                100% {
                    opacity: 0.4;
                    transform: translateY(0);
                }
            }

            .chat-input-container {
                display: flex;
                padding: 18px;
                border-top: 1px solid #eee;
                background-color: white;
                position: relative;
            }

            #chat-input {
                flex: 1;
                border: 1px solid #ddd;
                border-radius: 20px;
                padding: 14px 18px;
                resize: none;
                outline: none;
                max-height: 120px;
                font-size: 15px;
                transition: border-color 0.3s ease;
            }
            
            #chat-input:focus {
                border-color: ${config.chatbotAccentColor};
                box-shadow: 0 0 0 2px ${hexToRgba(config.chatbotAccentColor, 0.2)};
            }

            #send-button {
                margin-left: 10px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: ${config.chatbotAccentColor};
                color: white;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 5px ${hexToRgba(config.chatbotAccentColor, 0.3)};
            }

            #send-button:hover {
                background-color: ${adjustColor(config.chatbotAccentColor, -20)};
                transform: scale(1.05);
            }
            
            #send-button:active {
                transform: scale(0.95);
            }

            #send-button:disabled {
                background-color: #ccc;
                cursor: not-allowed;
                box-shadow: none;
            }

            @media (max-width: 480px) {
                #chat-modal {
                    width: calc(100vw - 40px);
                    height: 80vh;
                    bottom: 80px;
                }
                
                .message {
                    max-width: 85%;
                }
            }
            
            /* Dark mode detection */
            @media (prefers-color-scheme: dark) {
                .bot-message .message-content {
                    background-color: #2a2a2a;
                    color: #f0f0f0;
                }
                
                .bot-message .message-content::after {
                    background-color: #2a2a2a;
                }
                
                .typing-indicator {
                    background-color: #2a2a2a;
                }
                
                .typing-indicator:before {
                    background-color: #2a2a2a;
                }
                
                .chat-messages {
                    background-color: #1a1a1a;
                }
                
                .chat-input-container {
                    background-color: #2a2a2a;
                    border-top: 1px solid #444;
                }
                
                #chat-input {
                    background-color: #333;
                    color: #f0f0f0;
                    border-color: #555;
                }
                
                .timestamp {
                    color: #aaa;
                }
            }

            .loading-indicator {
                padding: 10px;
                text-align: center;
                color: #888;
                font-size: 12px;
                margin: 15px 0;
                animation: fade-in 0.5s ease;
            }
            
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        
        document.head.appendChild(styleElement);
    }

    // Create widget DOM structure
    function createWidgetDOM() {
        // Add Font Awesome if not present
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(fontAwesome);
        }
        
        // Create widget container
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'chatbot-widget';
        
        // Chat button
        const chatButton = document.createElement('button');
        chatButton.id = 'chat-button';
        chatButton.innerHTML = `
            <i class="fa-solid fa-comment chat-icon"></i>
            <i class="fa-solid fa-times close-icon"></i>
        `;
        
        // Chat modal
        const chatModal = document.createElement('div');
        chatModal.id = 'chat-modal';
        
        // Chat header
        const chatHeader = document.createElement('div');
        chatHeader.className = 'chat-header';
        
        const chatTitle = document.createElement('div');
        chatTitle.className = 'chat-title';
        chatTitle.innerHTML = `
            <img src="${config.botAvatar}" alt="Bot Avatar" class="bot-avatar">
            <span>${config.botName}</span>
        `;
        
        const minimizeButton = document.createElement('button');
        minimizeButton.id = 'minimize-button';
        minimizeButton.innerHTML = '<i class="fa-solid fa-minus"></i>';
        
        chatHeader.appendChild(chatTitle);
        chatHeader.appendChild(minimizeButton);
        
        // Chat messages
        const chatMessages = document.createElement('div');
        chatMessages.className = 'chat-messages';
        chatMessages.id = 'chat-messages';
        
        // Initial message is now handled by loadPreviousMessages
        
        // Chat input
        const chatInputContainer = document.createElement('div');
        chatInputContainer.className = 'chat-input-container';
        
        const chatInput = document.createElement('textarea');
        chatInput.id = 'chat-input';
        chatInput.placeholder = 'Type your message...';
        chatInput.rows = 1;
        
        const sendButton = document.createElement('button');
        sendButton.id = 'send-button';
        sendButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        
        chatInputContainer.appendChild(chatInput);
        chatInputContainer.appendChild(sendButton);
        
        // Assemble modal
        chatModal.appendChild(chatHeader);
        chatModal.appendChild(chatMessages);
        chatModal.appendChild(chatInputContainer);
        
        // Assemble widget
        widgetContainer.appendChild(chatButton);
        widgetContainer.appendChild(chatModal);
        
        // Add to DOM
        document.body.appendChild(widgetContainer);
    }

    // Initialize event listeners
    function initEventListeners() {
        const chatButton = document.getElementById('chat-button');
        const chatModal = document.getElementById('chat-modal');
        const minimizeButton = document.getElementById('minimize-button');
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-button');
        const chatMessages = document.getElementById('chat-messages');
        
        if (!chatButton) console.error('Chat button element not found!');
        if (!chatModal) console.error('Chat modal element not found!');
        if (!minimizeButton) console.error('Minimize button element not found!');
        if (!chatInput) console.error('Chat input element not found!');
        if (!sendButton) console.error('Send button element not found!');
        if (!chatMessages) console.error('Chat messages element not found!');
        
        let isOpen = false;
        
        // Toggle chat
        function toggleChat() {
            isOpen = !isOpen;
            chatButton.classList.toggle('open', isOpen);
            chatModal.classList.toggle('open', isOpen);
            
            if (isOpen) {
                chatInput.focus();
                
                // Show initial message when opening the chat
                if (chatMessages.children.length === 0 && config.initialMessage) {
                    addMessage(config.initialMessage, 'bot');
                }
            } else {
            }
        }
        
        // Show typing indicator
        function showTypingIndicator() {
            // Remove any existing typing indicator first
            hideTypingIndicator();
            
            // Create a new typing indicator
            const typingIndicator = document.createElement('div');
            typingIndicator.id = 'typing-indicator';
            typingIndicator.className = 'typing-indicator';
            typingIndicator.style.opacity = '0';
            typingIndicator.style.transition = 'opacity 0.3s ease';
            typingIndicator.innerHTML = `
                <span></span>
                <span></span>
                <span></span>
            `;
            
            // Add it to the chat messages
            chatMessages.appendChild(typingIndicator);
            
            // Add a subtle delay before showing to make it feel more natural
            setTimeout(() => {
                typingIndicator.style.opacity = '1';
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 300);
        }
        
        // Hide typing indicator
        function hideTypingIndicator() {
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.style.opacity = '0';
                setTimeout(() => {
                    if (typingIndicator.parentNode) {
                        typingIndicator.parentNode.removeChild(typingIndicator);
                    }
                }, 300);
            }
        }
        
        // Send message
        function sendMessage() {
            const message = chatInput.value.trim();
            
            if (message === '') {
                return;
            }
            
            addMessage(message, 'user');
            
            // Clear input
            chatInput.value = '';
            chatInput.style.height = 'auto';
            
            // Show typing indicator
            showTypingIndicator();
            
            // Call API
            callChatbotAPI(message);
        }
        
        // Add message to chat
        function addMessage(text, sender, timestamp = null) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', `${sender}-message`);
            
            const messageContent = document.createElement('div');
            messageContent.classList.add('message-content');
            
            const paragraph = document.createElement('p');
            paragraph.textContent = text;
            
            // Create timestamp
            const timestampElement = document.createElement('div');
            timestampElement.classList.add('timestamp');
            
            // Use provided timestamp or current time
            const msgTime = timestamp || new Date();
            const timeStr = msgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            timestampElement.textContent = timeStr;
            
            messageContent.appendChild(paragraph);
            messageElement.appendChild(messageContent);
            messageElement.appendChild(timestampElement);
            
            // Initially hide the message
            messageElement.style.opacity = '0';
            
            chatMessages.appendChild(messageElement);
            
            // Reveal with animation after a small delay
            setTimeout(() => {
                messageElement.style.opacity = '1';
            }, 50);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // Call chatbot API
        async function callChatbotAPI(message) {
            try {
                // Use businessId from config with session key
                const payload = {
                    message: message,
                    chatbot_id: config.chatbot_id,
                    session_key: config.sessionKey
                };
                
                // API URL from config
                const url = config.apiEndpoint;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                
                const data = await response.json();
                
                // Hide typing indicator
                hideTypingIndicator();
                
                // Process the response
                processResponse(data);
            } catch (error) {
                console.error('Error calling chatbot API:', error);
                
                // Hide typing indicator
                hideTypingIndicator();
                
                // Simplified error message
                addMessage(`Sorry, I encountered an error: ${error.message}. Please try again later.`, 'bot');
            }
        }
        
        // Process API response
        function processResponse(data) {
            // Check if the response has a role of 'tool' and skip displaying it
            if (data.role === 'tool') {
                return;
            }
            
            if (data.response) {
                addMessage(data.response, 'bot');
            } else if (data.reply) {
                addMessage(data.reply, 'bot');
            } else if (data.message) {
                addMessage(data.message, 'bot');
            } else if (data.answer) {
                addMessage(data.answer, 'bot');
            } else if (data.text) {
                addMessage(data.text, 'bot');
            } else if (data.content) {
                addMessage(data.content, 'bot');
            } else if (typeof data === 'string') {
                addMessage(data, 'bot');
            } else {
                // If none of the expected fields are found, try to stringify the response
                const responseText = JSON.stringify(data);
                addMessage(responseText === '{}' ? 'Received empty response from server.' : responseText, 'bot');
            }
        }
        
        // Event listeners
        chatButton.addEventListener('click', function(e) {
            toggleChat();
        });
        
        minimizeButton.addEventListener('click', function(e) {
            toggleChat();
        });
        
        sendButton.addEventListener('click', function(e) {
            sendMessage();
        });
        
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Auto-resize textarea
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight > 100 ? 100 : chatInput.scrollHeight) + 'px';
        });
    }

    // Helper function to adjust color brightness
    function adjustColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, color => 
            ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
        );
    }

    // Helper function to convert hex to rgba
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Initialize widget
    function initChatbotWidget(userConfig = {}) {
        // Try to restore previous session from localStorage
        const storedSessionKey = localStorage.getItem('chatbotSessionKey');
        if (storedSessionKey && !userConfig.sessionKey) {
            userConfig.sessionKey = storedSessionKey;
        }
        
        // Merge configurations
        const isValidConfig = mergeConfig(userConfig);
        
        // If configuration is invalid, don't proceed
        if (!isValidConfig) {
            console.error('ChatbotWidget initialization failed: Invalid configuration');
            return;
        }
        
        // Store session key for future visits
        localStorage.setItem('chatbotSessionKey', config.sessionKey);
        
        // Create widget
        injectStyles();
        createWidgetDOM();
        initEventListeners();
    }

    // Expose to window
    window.ChatbotWidget = {
        init: initChatbotWidget,
        updateConfig: function(userConfig = {}) {
            // Get the current configuration
            const isValidConfig = mergeConfig(userConfig);
            
            // If configuration is invalid, don't proceed
            if (!isValidConfig) {
                console.error('ChatbotWidget configuration update failed: Invalid configuration');
                return false;
            }
            
            // Update bot name and avatar in UI if provided
            if (userConfig.botName) {
                const botNameEl = document.querySelector('.chat-title span');
                if (botNameEl) {
                    botNameEl.textContent = config.botName;
                } else {
                    console.warn('Chatbot Widget: Bot name element not found in DOM');
                }
            }
            
            if (userConfig.botAvatar) {
                const botAvatarEl = document.querySelector('.bot-avatar');
                if (botAvatarEl) {
                    botAvatarEl.src = config.botAvatar;
                } else {
                    console.warn('Chatbot Widget: Bot avatar element not found in DOM');
                }
            }
            
            // Store updated session key
            localStorage.setItem('chatbotSessionKey', config.sessionKey);
            
            return true;
        }
    };
})();

// Usage example:
// ChatbotWidget.init({
//     Chatbot_id: 'BUS-1143',        // Required: Your business ID
//     botName: 'Sarah',              // Required: Name of your chatbot assistant
//     initialMessage: 'Hi there! How can I help you today?', // Required: First message shown to users
//     botAvatar: 'https://example.com/your-bot-avatar.jpg'   // Optional: URL to bot's avatar image
// }); 
