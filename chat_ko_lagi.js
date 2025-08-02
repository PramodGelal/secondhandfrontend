let ws;
let currentRecipient = null;
let email_buyer;

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

function sendMessage() {
  const messageInput = document.getElementById('message');
  const message = messageInput.value.trim();

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("WebSocket not connected");
    return;
  }
  if (!currentRecipient) {
    alert("No user selected");
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

function appendMessage(msg, align = 'left') {
  const chat = document.getElementById('chat');
  if (!chat) return;

  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: ${align === 'right' ? 'flex-end' : (align === 'left' ? 'flex-start' : 'center')};
    margin: 10px 0;
    padding: 0 10px;
  `;

  const senderLabel = document.createElement("div");
  senderLabel.textContent = msg.split(":")[0];
  senderLabel.style.cssText = `
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
    color: #555;
    font-family: 'Poppins', sans-serif;
  `;

  const bubble = document.createElement("div");
  bubble.textContent = msg.split(":").slice(1).join(":").trim();
  bubble.style.cssText = `
    max-width: 80%;
    padding: 14px 18px;
    border-radius: 20px;
    font-size: 15px;
    line-height: 1.6;
    font-family: 'Poppins', sans-serif;
    word-wrap: break-word;
    white-space: pre-wrap;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    border: 1px solid #e0e0e0;
  `;

  if (align === 'right') {
    bubble.style.background = "linear-gradient(to right, #4facfe, #00f2fe)";
    bubble.style.color = "#fff";
  } else if (align === 'left') {
    bubble.style.background = "linear-gradient(to right, #f5f7fa, #c3cfe2)";
    bubble.style.color = "#000";
  } else {
    bubble.style.alignSelf = "flex-start";
    bubble.style.background = "linear-gradient(to right, #f5f7fa, #c3cfe2)";
    bubble.style.color = "#000";
  }

  wrapper.appendChild(senderLabel);
  wrapper.appendChild(bubble);
  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;
}

document.getElementById("messageBtn").addEventListener("click", () => {
  const box = document.getElementById("messageBox");
  box.style.display = (box.style.display === "none") ? "block" : "none";

  const loginMode = localStorage.getItem('mode');
  email_buyer = localStorage.getItem('user_data');
  console.log("mode",loginMode);
  console.log("login by",email_buyer);

  document.getElementById('chatname').textContent = email_buyer || 'Your Messages';
  connect(email_buyer);

  const fetchUrl = loginMode === "user"
    ? `${BASE_URL}/api98/payments98/search98/by-payer98?payerEmail=${encodeURIComponent(email_buyer)}`
    : `${BASE_URL}/api98/payments98/search98/by-seller98?sellerEmail=${encodeURIComponent(email_buyer)}`;

  fetch(fetchUrl)
    .then(response => response.json())
    .then(data => {
      const grouped = data.reduce((acc, payment) => {
        console.log("data yesto xa ",data);
        const counterpart = loginMode === "user"
          ? (payment.sellerEmail || payment.seller_email || 'Unknown Seller')
          : (payment.payerEmail || 'Unknown Buyer');

        if (!acc[counterpart]) acc[counterpart] = [];
        acc[counterpart].push(payment);
        return acc;
      }, {});

      const area = document.getElementById("messagesArea");
      area.innerHTML = "";

      for (const [counterpart, payments] of Object.entries(grouped)) {
        if (counterpart === email_buyer) continue;

        const previewDiv = document.createElement("div");
        previewDiv.style.cssText = `
          border: 1px solid #ddd;
          padding: 16px;
          margin-bottom: 16px;
          border-radius: 12px;
          background-color: #ffffff;
          cursor: pointer;
          transition: background-color 0.2s ease;
        `;
        previewDiv.onmouseover = () => previewDiv.style.backgroundColor = "#f9f9f9";
        previewDiv.onmouseout = () => previewDiv.style.backgroundColor = "#ffffff";

        const header = document.createElement("h4");
        header.textContent = loginMode === "user"
          ? `Seller: ${counterpart}`
          : `Buyer: ${counterpart}`;
        header.style.margin = "0";
        header.style.fontFamily = "'Poppins', sans-serif";

        previewDiv.appendChild(header);
        previewDiv.addEventListener("click", () => {
          currentRecipient = counterpart;
          openFullChatView(counterpart, payments);
        });

        area.appendChild(previewDiv);
      }
    })
    .catch(error => {
      console.error('Error fetching payments:', error);
    });
});

function openFullChatView(counterpart, payments) {
  const area = document.getElementById("messagesArea");
  area.innerHTML = "";

  const backBtn = document.createElement("button");
  backBtn.textContent = "⬅ Back";
  backBtn.style.cssText = `
    margin-bottom: 10px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background-color: #4a90e2;
    cursor: pointer;
    font-size: 14px;
    font-family: 'Poppins', sans-serif;
  `;
  backBtn.onclick = () => {
    document.getElementById("messageBtn").click();
    setTimeout(() => {
      document.getElementById("messageBtn").click();
    }, 0);
  };
  area.appendChild(backBtn);

  const chatHeader = document.createElement("h3");
  chatHeader.textContent = `Chat with ${counterpart}`;
 chatHeader.style.cssText = `
  font-family: 'Poppins', sans-serif;
  margin-bottom: 16px;
  color: #4a90e2; /* a vibrant blue */
  font-weight: 700;
  font-size: 0.9rem;
  text-shadow: 1px 1px 3px rgba(74, 144, 226, 0.5);
  letter-spacing: 0.05em;
`;

  area.appendChild(chatHeader);

  payments.forEach(payment => {
    const msgDiv = document.createElement("div");
    msgDiv.style.cssText = `
      margin-bottom: 12px;
      padding: 12px 16px;
      background-color: #ffffff;
      border-radius: 10px;
      border: 1px solid #ddd;
      font-family: 'Segoe UI', sans-serif;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    `;
    msgDiv.innerHTML = `
      <strong>Item:</strong> ${payment.item_name || 'N/A'}<br/>
      <strong>Amount:</strong> Rs ${payment.amount}<br/>
      <strong>Date:</strong> ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'N/A'}
    `;
    area.appendChild(msgDiv);
  });

  const chatBox = document.createElement("div");
  chatBox.innerHTML = `
    <div id="chat" style="display: flex; flex-direction: column; max-height: 320px; overflow-y: auto; padding: 16px; background: #fefefe; border-radius: 12px; border: 1px solid #ccc; margin-bottom: 16px;"></div>
    <div style="display: flex; gap: 10px;">
      <input type="text" id="message" placeholder="Type a message..." style="flex: 1; padding: 14px 16px; border-radius: 12px; border: 1px solid #ccc; font-size: 15px; font-family: 'Poppins', sans-serif;" />
      <button id="sendBtn" style="padding: 4px px; border: none; border-radius: 12px; background-color: #007bff; color: white; font-weight: 600; font-family: 'Poppins', sans-serif; cursor: pointer;">
        Send
      </button>
    </div>
  `;
  chatBox.style.cssText = `
    max-width: 680px;
    margin: 20px auto;
    border: 1px solid #ddd;
    border-radius: 16px;
    padding: 24px;
    background-color: #ffffff;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
    font-family: 'Poppins', sans-serif;
  `;
  area.appendChild(chatBox);

  fetch(`http://localhost:9090/chat/conversation?user1=${encodeURIComponent(email_buyer)}&user2=${encodeURIComponent(counterpart)}`)
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

  document.getElementById("sendBtn").onclick = sendMessage;
  document.getElementById("message").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  appendMessage(`👤 Chatting with ${counterpart}`, 'system');
}