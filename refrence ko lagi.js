let ws;
let currentRecipient = null;
let email_buyer;

// WebSocket Connection
function connect(username) {
  if (!username) {
    alert("Please enter your username");
    return;
  }
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log("WebSocket already connected");
    return;
  }

  ws = new WebSocket('ws://localhost:9090/chat?username=' + username);

  ws.onopen = () => appendMessage("🟢 Connected as " + username, 'system');
  ws.onmessage = (event) => {
    const data = event.data;
    if (data.includes('|')) {
      const [sender, message] = data.split('|');
      const align = sender === email_buyer ? 'right' : 'left';
      const label = sender === email_buyer ? "You" : sender;
      appendMessage(`${label}: ${message}`, align);
    } else {
      appendMessage(data, 'system');
    }
  };
  ws.onclose = () => appendMessage("🔴 Disconnected", 'system');
  ws.onerror = (err) => console.error("WebSocket error:", err);
}

// Send Message
function sendMessage() {
  const messageInput = document.getElementById('message');
  const message = messageInput.value.trim();

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("WebSocket not connected");
    return;
  }
  if (!currentRecipient) {
    alert("No seller selected");
    return;
  }
  if (!message) {
    alert("Please enter a message");
    return;
  }

  ws.send(currentRecipient + "|" + message);
  appendMessage(`You: ${message}`, 'right');
  messageInput.value = '';
}

// Display message with bubble + sender label
function appendMessage(msg, align = 'left') {
  const chat = document.getElementById('chat');
  if (!chat) return;

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = align === 'right' ? 'flex-end' : (align === 'left' ? 'flex-start' : 'center');
  wrapper.style.margin = "5px 0";

  const senderLabel = document.createElement("div");
  senderLabel.textContent = msg.split(":")[0];
  senderLabel.style.fontSize = "12px";
  senderLabel.style.fontWeight = "bold";
  senderLabel.style.marginBottom = "2px";
  senderLabel.style.color = "#444";

  const bubble = document.createElement("div");
  bubble.textContent = msg.split(":").slice(1).join(":").trim();

  bubble.style.maxWidth = "70%";
  bubble.style.padding = "10px";
  bubble.style.borderRadius = "12px";
  bubble.style.wordWrap = "break-word";
  bubble.style.whiteSpace = "pre-wrap";
  bubble.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
  bubble.style.fontSize = "14px";

  if (align === 'right') {
    bubble.style.backgroundColor = "#dcf8c6";
  } else if (align === 'left') {
    bubble.style.backgroundColor = "#f1f0f0";
  } else {
    bubble.style.backgroundColor = "#e0e0e0";
    bubble.style.fontStyle = "italic";
    senderLabel.style.display = "none";
  }

  wrapper.appendChild(senderLabel);
  wrapper.appendChild(bubble);
  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;
}

// Load chat interface on messageBtn click
document.getElementById("messageBtn").addEventListener("click", () => {
  const box = document.getElementById("messageBox");
  box.style.display = (box.style.display === "none") ? "block" : "none";
  const loginMode= localStorage.getItem('mode');
  const userDataRaw = localStorage.getItem('user_data');
  try {
    const userData = JSON.parse(userDataRaw);
    email_buyer = userData.email;
  } catch {
    email_buyer = userDataRaw;
  }

  document.getElementById('chatname').textContent = email_buyer || 'Your Messages';
  connect(email_buyer);

fetch(`http://localhost:8080/api98/payments98/search98/by-seller98?sellerEmail=${encodeURIComponent(email_buyer)}`)
  .then(response => response.json())
  .then(data => {
    console.log("Received data:", data); // 👈 Check field names

    const groupedBySeller = data.reduce((acc, payment) => {
      // Try both camelCase and snake_case
      const seller = payment.sellerEmail || payment.seller_email || 'Unknown Seller';
      if (!acc[seller]) acc[seller] = [];
      acc[seller].push(payment);
      return acc;
    }, {});

      const area = document.getElementById("messagesArea");
      area.innerHTML = "";

      for (const [seller, payments] of Object.entries(groupedBySeller)) {
        const loginByName = localStorage.getItem("user_data");
        if (!(loginByName == seller)) {
          const sellerPreviewDiv = document.createElement("div");
          sellerPreviewDiv.style.border = "1px solid #ccc";
          sellerPreviewDiv.style.padding = "10px";
          sellerPreviewDiv.style.marginBottom = "15px";
          sellerPreviewDiv.style.borderRadius = "8px";
          sellerPreviewDiv.style.backgroundColor = "#f0f0f0";
          sellerPreviewDiv.style.cursor = "pointer";

          const loginMode = localStorage.getItem("mode");
          const sellerHeader = document.createElement("h4");

          if (loginMode == "user") {
            sellerHeader.textContent = `Seller: ${seller}`;
          } else if (loginMode == "seller") {
            sellerHeader.textContent = `Buyer: ${seller}`;
          }

          sellerPreviewDiv.appendChild(sellerHeader);
          sellerPreviewDiv.addEventListener("click", () => {
            currentRecipient = seller;
            openFullChatView(seller, payments);
          });

          area.appendChild(sellerPreviewDiv);
        }
      }
    })
    .catch(error => {
      console.error('Error fetching payments:', error);
    });
});

// Show chat and history
function openFullChatView(seller, payments) {
  const area = document.getElementById("messagesArea");
  area.innerHTML = "";

  const backBtn = document.createElement("button");
  backBtn.textContent = "⬅ Back";
  backBtn.style.marginBottom = "10px";
  backBtn.style.padding = "6px 12px";
  backBtn.style.border = "none";
  backBtn.style.borderRadius = "6px";
  backBtn.style.backgroundColor = "#ddd";
  backBtn.style.cursor = "pointer";
  backBtn.onclick = () => document.getElementById("messageBtn").click();
  area.appendChild(backBtn);

  const chatHeader = document.createElement("h3");
  chatHeader.textContent = `Chat with ${seller}`;
  area.appendChild(chatHeader);

  payments.forEach(payment => {
    const msgDiv = document.createElement("div");
    msgDiv.style.marginBottom = "8px";
    msgDiv.style.padding = "6px 10px";
    msgDiv.style.backgroundColor = "#ffffff";
    msgDiv.style.borderRadius = "5px";
    msgDiv.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
    msgDiv.innerHTML = `
      <strong>Item:</strong> ${payment.item_name || 'N/A'}<br/>
      <strong>Amount:</strong> Rs ${payment.amount}<br/>
      <strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleString()}
    `;
    area.appendChild(msgDiv);
  });

  const chatBox = document.createElement("div");
  chatBox.style.maxWidth = "600px";
  chatBox.style.margin = "20px auto";
  chatBox.style.border = "1px solid #ccc";
  chatBox.style.borderRadius = "10px";
  chatBox.style.padding = "15px";
  chatBox.style.backgroundColor = "#f9f9f9";
  chatBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
  chatBox.style.fontFamily = "'Segoe UI', sans-serif";

  chatBox.innerHTML = `
    <div id="chat" style="display: flex; flex-direction: column; max-height: 300px; overflow-y: auto; padding: 10px; background: #fff; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 10px;"></div>
    <div style="display: flex; gap: 10px;">
      <input type="text" id="message" placeholder="Type your message..."
        style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 14px;" />
      <button id="sendBtn"
        style="padding: 10px 10px; border: none; border-radius: 8px; background-color: #007bff; color: white; font-weight: bold; cursor: pointer;">
        Send
      </button>
    </div>
  `;
  area.appendChild(chatBox);

  fetch(`http://localhost:9090/chat/conversation?user1=${encodeURIComponent(email_buyer)}&user2=${encodeURIComponent(seller)}`)
    .then(res => res.json())
    .then(messages => {
      messages.forEach(msg => {
        const label = msg.sender === email_buyer ? "You" : msg.sender;
        appendMessage(`${label}: ${msg.content}`, msg.sender === email_buyer ? 'right' : 'left');
      });
    })
    .catch(error => {
      console.error("Error fetching messages:", error);
    });

  document.getElementById("sendBtn").addEventListener("click", sendMessage);
  appendMessage(`👤 Chatting with ${seller}`, 'system');
}