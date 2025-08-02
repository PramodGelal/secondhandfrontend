// Configuration
const API_BASE_URL = 'http://localhost:8080';
const WS_URL = 'http://localhost:8080/ws';
const CURRENT_USER_ID = 1; // Replace with actual user ID from your auth system
let currentReceiverId = null;
let currentItemId = null;
let stompClient = null;

// DOM Elements
const conversationList = document.getElementById('conversationList');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const unreadCount = document.getElementById('unreadCount');
const typingIndicator = document.getElementById('typingIndicator');

// Initialize the application
function init() {
    connectWebSocket();
    loadConversations();
    setupEventListeners();
}

// Connect to WebSocket
function connectWebSocket() {
    const socket = new SockJS(WS_URL);
    stompClient = Stomp.over(socket);
    
    stompClient.connect({}, function(frame) {
        console.log('Connected to WebSocket');
        
        // Subscribe to personal messages
        stompClient.subscribe(`/user/queue/messages`, function(message) {
            const newMessage = JSON.parse(message.body);
            appendMessage(newMessage, false);
            scrollToBottom();
            updateUnreadCount();
        });
        
        // Subscribe to typing notifications
        stompClient.subscribe(`/user/queue/typing`, function(notification) {
            const data = JSON.parse(notification.body);
            if (data.senderId === currentReceiverId && data.isTyping) {
                typingIndicator.style.visibility = 'visible';
                setTimeout(() => {
                    typingIndicator.style.visibility = 'hidden';
                }, 2000);
            }
        });
    });
}

// Load conversation list
async function loadConversations() {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/messages/conversations?userId=${CURRENT_USER_ID}`);
        renderConversationList(response.data);
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

// Render conversation list
function renderConversationList(conversations) {
    conversationList.innerHTML = '';
    
    conversations.forEach(convo => {
        const convoElement = document.createElement('button');
        convoElement.className = `list-group-item list-group-item-action d-flex justify-content-between align-items-center ${convo.hasUnread ? 'unread' : ''}`;
        
        convoElement.innerHTML = `
            <div>
                <strong>${convo.otherUser.fullname}</strong>
                <p class="mb-0 text-truncate" style="max-width: 200px;">${convo.lastMessage?.content || 'No messages yet'}</p>
            </div>
            <div class="d-flex flex-column align-items-end">
                <small class="text-muted">${formatTime(convo.lastMessage?.timestamp)}</small>
                ${convo.unreadCount > 0 ? `<span class="badge bg-danger rounded-pill">${convo.unreadCount}</span>` : ''}
            </div>
        `;
        
        convoElement.addEventListener('click', () => {
            openConversation(convo.otherUser.id, convo.item?.id);
        });
        
        conversationList.appendChild(convoElement);
    });
}

// Open a conversation
async function openConversation(receiverId, itemId = null) {
    currentReceiverId = receiverId;
    currentItemId = itemId;
    
    try {
        const response = await axios.get(`${API_BASE_URL}/api/messages/conversation?user1Id=${CURRENT_USER_ID}&user2Id=${receiverId}&itemId=${itemId || ''}`);
        renderMessages(response.data);
        
        // Mark messages as read
        const unreadMessages = response.data.filter(m => !m.isRead && m.receiver.id === CURRENT_USER_ID);
        if (unreadMessages.length > 0) {
            const messageIds = unreadMessages.map(m => m.id);
            await axios.post(`${API_BASE_URL}/api/messages/mark-read`, messageIds);
            updateUnreadCount();
        }
    } catch (error) {
        console.error('Error loading conversation:', error);
    }
}

// Render messages in the chat area
function renderMessages(messages) {
    messagesContainer.innerHTML = '<div id="typingIndicator" class="text-muted mb-2"><small>Typing...</small></div>';
    
    messages.forEach(message => {
        appendMessage(message, message.sender.id === CURRENT_USER_ID);
    });
    
    scrollToBottom();
}

// Append a single message to the chat area
function appendMessage(message, isSent) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    
    messageElement.innerHTML = `
        <div>${message.content}</div>
        <div class="message-time d-flex justify-content-between">
            <span>${formatTime(message.timestamp)}</span>
            ${!isSent && !message.isRead ? '<span class="badge bg-primary rounded-pill unread-badge">new</span>' : ''}
        </div>
    `;
    
    messagesContainer.insertBefore(messageElement, typingIndicator);
}

// Send a message
async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentReceiverId) return;
    
    try {
        const response = await axios.post(`${API_BASE_URL}/api/messages`, {
            senderId: CURRENT_USER_ID,
            receiverId: currentReceiverId,
            itemId: currentItemId,
            content: content
        });
        
        messageInput.value = '';
        appendMessage(response.data, true);
        scrollToBottom();
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Update unread message count
async function updateUnreadCount() {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/messages/unread-count?userId=${CURRENT_USER_ID}`);
        unreadCount.textContent = response.data;
    } catch (error) {
        console.error('Error updating unread count:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Typing indicator
    let typingTimeout;
    messageInput.addEventListener('input', function() {
        if (!currentReceiverId) return;
        
        // Send typing notification
        stompClient.send("/app/typing", {}, 
            JSON.stringify({
                senderId: CURRENT_USER_ID,
                receiverId: currentReceiverId,
                isTyping: true
            })
        );
        
        // Clear previous timeout
        clearTimeout(typingTimeout);
        
        // Set timeout to send "stopped typing" after 2 seconds of inactivity
        typingTimeout = setTimeout(() => {
            stompClient.send("/app/typing", {}, 
                JSON.stringify({
                    senderId: CURRENT_USER_ID,
                    receiverId: currentReceiverId,
                    isTyping: false
                })
            );
        }, 2000);
    });
}

// Helper function to format time
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Helper function to scroll to bottom of messages
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);