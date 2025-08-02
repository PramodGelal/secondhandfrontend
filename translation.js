
  // ------------------- Translation Function -------------------
  function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.innerText = i18next.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = i18next.t(key);
    });
  }

  // ------------------- DOM Loaded Main Logic -------------------
  document.addEventListener('DOMContentLoaded', async () => {
    // Initialize i18next
    i18next.init({
      lng: localStorage.getItem('selectedLanguage') || 'en',
      debug: false,
      resources: {
        en: {
          translation: {
            site: {
              logo: "SecondHand",
              signIn: "Sign in",
              searchPlaceholder: "Search items",
              categoryAll: "All",
              categoryElectronics: "Electronics",
              categoryBooks: "Books",
              categoryClothing: "Clothing",
              home: "☰ Home",
              categories: "Categories",
              sell: "Sell",
              support: "Support",
              footerTitle: "SecondHand",
              emailLabel: "Email",
              contactLabel: "Contact",
              copyright: "© 2025 SecondHand Market. All rights reserved.",
              buyNow: "Buy Now",
              next: "Next",
              all: "All",
              inStock: "in stock",
              outOfStock: "Out of stock"
            }
          }
        },
        np: {
          translation: {
            site: {
              logo: "सेकेन्डह्याण्ड",
              signIn: "लगइन गर्नुहोस्",
              searchPlaceholder: "सामान खोज्नुहोस्",
              categoryAll: "सबै",
              categoryElectronics: "इलेक्ट्रोनिक्स",
              categoryBooks: "किताबहरू",
              categoryClothing: "लुगाफाटा",
              home: "☰ गृहपृष्ठ",
              categories: "श्रेणीहरू",
              sell: "बेच्नुहोस्",
              support: "सहयोग",
              footerTitle: "सेकेन्डह्याण्ड",
              emailLabel: "इमेल",
              contactLabel: "सम्पर्क",
              copyright: "© २०२५ सेकेन्डह्याण्ड बजार। सर्वाधिकार सुरक्षित।",
              buyNow: "अहिले किन्नुहोस्",
              next: "अर्को",
              all: "सबै",
              inStock: "स्टकमा उपलब्ध",
              outOfStock: "स्टक सकियो"
            }
          }
        }
      }
    }, function (err, t) {
      updateContent();
      loadItems();
      document.getElementById('languageSelect').value = i18next.language;
    });

    // Language switcher
    document.getElementById('languageSelect').addEventListener('change', (e) => {
      const selectedLang = e.target.value;
      localStorage.setItem('selectedLanguage', selectedLang);
      i18next.changeLanguage(selectedLang, () => {
        updateContent();
        renderAllCategories(groupItemsByCategory(allItems));
      });
    });
  });
