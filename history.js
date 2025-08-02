
  const backendUrl = "http://localhost:8080/orders";

  document.getElementById('historyBtn').addEventListener('click', async () => {
    const userEmail = localStorage.getItem('user_data');
    if (!userEmail) {
      alert('Please log in to view your history.');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/history/${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch history.');

      const history = await response.json();
      const list = document.getElementById('historyList');
      list.innerHTML = ''; // clear previous

      if (history.length === 0) {
        list.innerHTML = '<p>No purchase or selling history found.</p>';
      } else {
        history.forEach(order => {
          const div = document.createElement('div');
          div.style.border = "1px solid #ddd";
          div.style.borderRadius = "8px";
          div.style.padding = "12px";
          div.style.marginBottom = "12px";
          div.style.backgroundColor = "#f9f9f9";

          div.innerHTML = `
            <strong>Item:</strong> ${order.itemTitle}<br>
            <strong>Quantity:</strong> ${order.itemQuantity}<br>
            <strong>Price (Each):</strong> NPR ${order.itemPrice}<br>
            <strong>Total:</strong> NPR ${order.itemPrice * order.itemQuantity}<br>
            <strong>Buyer:</strong> ${order.email}<br>
            <strong>Seller:</strong> ${order.sellerEmail}<br>
            <strong>Order Date:</strong> ${order.orderDate || 'N/A'}<br>
            <strong>Delivered:</strong> <span id="delivered-status-${order.id}">${order.delivered ? 'Yes' : 'No'}</span><br><br>

            <button onclick="updateDeliveryStatus(${order.id}, true)">Mark as Delivered</button>
            <button onclick="updateDeliveryStatus(${order.id}, false)">Mark as Not Delivered</button>
            <br><br>
            <textarea id="reportText-${order.id}" placeholder="Write a report..." rows="2" style="width: 100%;"></textarea>
            <button onclick="submitReport(${order.id})" style="margin-top: 6px;">Submit Report</button>
            <div id="reportMessage-${order.id}" style="color: green; margin-top: 5px;"></div>
          `;
          list.appendChild(div);
        });
      }

      document.getElementById('historyContainer').style.display = 'block';

    } catch (err) {
      console.error(err);
      alert('Error loading history. Please try again later.');
    }
  });

  document.getElementById('closeHistoryBtn').addEventListener('click', () => {
    document.getElementById('historyContainer').style.display = 'none';
  });

  async function updateDeliveryStatus(orderId, delivered) {
    try {
      const response = await fetch(`${backendUrl}/${orderId}/delivered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivered })
      });

      if (!response.ok) {
        const text = await response.text();
        alert("Failed to update delivery: " + text);
        return;
      }

      document.getElementById(`delivered-status-${orderId}`).textContent = delivered ? 'Yes' : 'No';
      alert(`Order marked as ${delivered ? 'Delivered' : 'Not Delivered'}.`);
    } catch (err) {
      alert("Error updating delivery status: " + err.message);
    }
  }

  async function submitReport(orderId) {
    const reportTextArea = document.getElementById(`reportText-${orderId}`);
    const reportText = reportTextArea.value.trim();
    const msgEl = document.getElementById(`reportMessage-${orderId}`);
    msgEl.textContent = '';

    if (!reportText) {
      msgEl.style.color = 'red';
      msgEl.textContent = 'Report text is required.';
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/${orderId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: reportText
      });

      const text = await response.text();
      msgEl.style.color = response.ok ? 'green' : 'red';
      msgEl.textContent = text || (response.ok ? 'Report submitted.' : 'Failed to submit report.');
      if (response.ok) reportTextArea.value = '';
    } catch (err) {
      msgEl.style.color = 'red';
      msgEl.textContent = 'Error: ' + err.message;
    }
  }

