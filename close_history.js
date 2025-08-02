const backendUrl = "http://localhost:8080/orders";
const itemApiUrl = "http://localhost:8080/api/items";

document.getElementById('historyBtn').addEventListener('click', async () => {
  const userEmail = localStorage.getItem('user_data');
  if (!userEmail) {
    alert('Please log in to view your history.');
    return;
  }

  try {
    const response = await fetch(`${backendUrl}/history/${encodeURIComponent(userEmail)}`);
    if (!response.ok) throw new Error('Failed to fetch history.');

    const history = await response.json();
    const list = document.getElementById('historyList');
    list.innerHTML = '';

    if (history.length === 0) {
      list.innerHTML = '<p style="font-style: italic; color: #555;">No order history found.</p>';
      return;
    }

    for (const order of history) {
      // Fetch full item info by itemId
      let imageUrl = '';
      try {
        const itemRes = await fetch(`${itemApiUrl}/${order.itemId}`);
        if (itemRes.ok) {
          const item = await itemRes.json();
          imageUrl = item.imageUrl || '';
        }
      } catch (err) {
        console.warn(`Failed to fetch item for ID ${order.itemId}`);
      }

      const div = document.createElement('div');
      div.dataset.orderId = order.id;
      // Inline styles for the container
      div.style.background = "#fff";
      div.style.border = "1px solid #ddd";
      div.style.borderRadius = "10px";
      div.style.padding = "16px";
      div.style.marginBottom = "16px";
      div.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";
      div.style.display = "flex";
      div.style.gap = "16px";
      div.style.alignItems = "flex-start";
      div.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      div.style.color = "#333";

      div.innerHTML = `
        ${imageUrl ? `<img src="${imageUrl}" alt="Item Image" style="width: 120px; height: auto; border-radius: 8px; object-fit: cover; flex-shrink: 0;">` : ''}
        <div style="flex: 1;">
          <h3 style="margin-top: 0; margin-bottom: 10px; color: #2d98da; font-weight: 700;">${order.itemTitle}</h3>
          <p style="margin: 4px 0;"><strong>Order ID:</strong> ${order.id}</p>
          <p style="margin: 4px 0;"><strong>Buyer:</strong> ${order.name} (${order.email})</p>
          <p style="margin: 4px 0;"><strong>Phone:</strong> ${order.phone}</p>
          <p style="margin: 4px 0;"><strong>Shipping Address:</strong> ${order.address}</p>
          <p style="margin: 4px 0;"><strong>Seller:</strong> ${order.sellerEmail}</p>
          <p style="margin: 4px 0;"><strong>Order Date:</strong> ${order.orderDate}</p>
          <p style="margin: 4px 0;"><strong>Quantity:</strong> 1}</p>
          <p style="margin: 4px 0;"><strong>Price (Each):</strong> NPR ${order.itemPrice}</p>
          <p style="margin: 4px 0 12px 0;"><strong>Total:</strong> NPR ${order.itemPrice * 1}</p>
          <p style="margin: 4px 0;"><strong>Delivered:</strong> <span id="delivered-status-${order.id}" style="color: ${order.delivered ? '#44bd32' : '#e84118'};">${order.delivered ? 'Yes' : 'No'}</span></p>
          <p style="margin: 4px 0 10px 0;"><strong>Shipping Status:</strong> ${order.shippingStatus}</p>

          <div style="margin-top: 10px;">
            <button class="btn-delivered btn-delivered-true" data-status="true" style="background-color: #44bd32; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-right: 12px; box-shadow: 0 2px 6px rgba(68,189,50,0.4); transition: background-color 0.3s;">Mark as Delivered</button>
            <button class="btn-delivered btn-delivered-false" data-status="false" style="background-color: #e1b12c; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 6px rgba(225,177,44,0.4); transition: background-color 0.3s;">Mark as Not Delivered</button>
          </div>

          <textarea id="reportText-${order.id}" placeholder="Write a report..." rows="3" style="width: 100%; margin-top: 16px; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-family: inherit; font-size: 14px; resize: vertical;"></textarea>
          <button class="btn-report" style="margin-top: 8px; background-color: #273c75; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(39,60,117,0.6); transition: background-color 0.3s;">Submit Report</button>
          <div id="reportMessage-${order.id}" style="margin-top: 6px; font-weight: 600; min-height: 20px;"></div>
        </div>
      `;
      list.appendChild(div);

      // Fetch existing report and admin response for this order
      try {
        const reportRes = await fetch(`${backendUrl}/${order.id}/report`);
        if (reportRes.ok) {
          const reportData = await reportRes.json();
          if (reportData) {
            // Set the report textarea value to existing buyer report message
            const reportTextArea = div.querySelector(`#reportText-${order.id}`);
            reportTextArea.value = reportData.reportMessage || '';

            // Remove existing admin response container if any, to avoid duplicates
            const existingResponseDiv = div.querySelector('.admin-response');
            if (existingResponseDiv) existingResponseDiv.remove();

            // Add a section to show the admin's response below the report textarea
            const submitBtn = div.querySelector('.btn-report');
            const adminResponse = reportData.adminResponse || '';

            const adminResponseHtml = adminResponse
              ? `<p style="margin-top: 8px; color: #273c75; font-weight: 700;">Admin Response:</p>
                 <p style="background-color: #f0f4ff; padding: 10px; border-radius: 6px; border: 1px solid #ccc;">${adminResponse}</p>`
              : `<p style="margin-top: 8px; font-style: italic; color: #888;">No response from admin yet.</p>`;

            const adminResponseDiv = document.createElement('div');
            adminResponseDiv.className = 'admin-response';
            adminResponseDiv.innerHTML = adminResponseHtml;

            submitBtn.insertAdjacentElement('afterend', adminResponseDiv);
          }
        }
      } catch (e) {
        console.warn(`Failed to load report for order ${order.id}`, e);
      }
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

// Event delegation for delivery buttons & report buttons
document.getElementById('historyList').addEventListener('click', event => {
  const target = event.target;
  const orderDiv = target.closest('div[data-order-id]');
  if (!orderDiv) return;

  const orderId = orderDiv.dataset.orderId;

  if (target.classList.contains('btn-delivered')) {
    const delivered = target.dataset.status === 'true';
    updateDeliveryStatus(orderId, delivered);
  } else if (target.classList.contains('btn-report')) {
    submitReport(orderId);
  }
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

    const statusSpan = document.getElementById(`delivered-status-${orderId}`);
    statusSpan.textContent = delivered ? 'Yes' : 'No';
    statusSpan.style.color = delivered ? '#44bd32' : '#e84118';
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

    // Refresh admin response after successful submission
    if (response.ok) {
      // Re-fetch report to update admin response
      try {
        const reportRes = await fetch(`${backendUrl}/${orderId}/report`);
        if (reportRes.ok) {
          const reportData = await reportRes.json();
          const div = document.querySelector(`div[data-order-id="${orderId}"]`);
          if (reportData && div) {
            // Remove old admin response
            const existingResponseDiv = div.querySelector('.admin-response');
            if (existingResponseDiv) existingResponseDiv.remove();

            const submitBtn = div.querySelector('.btn-report');
            const adminResponse = reportData.adminResponse || '';
            const adminResponseHtml = adminResponse
              ? `<p style="margin-top: 8px; color: #273c75; font-weight: 700;">Admin Response:</p>
                 <p style="background-color: #f0f4ff; padding: 10px; border-radius: 6px; border: 1px solid #ccc;">${adminResponse}</p>`
              : `<p style="margin-top: 8px; font-style: italic; color: #888;">No response from admin yet.</p>`;

            const adminResponseDiv = document.createElement('div');
            adminResponseDiv.className = 'admin-response';
            adminResponseDiv.innerHTML = adminResponseHtml;

            submitBtn.insertAdjacentElement('afterend', adminResponseDiv);
          }
        }
      } catch (e) {
        console.warn(`Failed to refresh report for order ${orderId}`, e);
      }
    }
  } catch (err) {
    msgEl.style.color = 'red';
    msgEl.textContent = 'Error: ' + err.message;
  }
}
