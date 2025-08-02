const BASE_URL = "https://secondhandnab-production.up.railway.app";
    //${BASE_URL}
      async function loadItems() {
        try {
          const res = await fetch(`${BASE_URL}/api/items`, {
            method: 'GET',
            credentials: 'include'
          });
          allItems = await res.json();
          // Ensure each item has a quantity property (default to 1 if not provided)
          allItems = allItems.map(item => ({
            ...item,
            quantity: item.quantity !== undefined ? item.quantity : 1
          }));
          renderAllCategories(groupItemsByCategory(allItems));
        } catch (err) {
          console.error('Error loading items:', err);
          document.getElementById('itemContainerGrouped').innerHTML = '<p style="color:red;">Failed to load items.</p>';
        }
      }