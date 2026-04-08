chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openSidePanel",
    title: "Open Bookmark Importer",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openSidePanel") {
    // Membuka side panel di tab saat ini
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Izinkan side panel terbuka saat ikon ekstensi diklik (opsional, ganti popup)
// Jika Anda ingin tetap menggunakan popup, biarkan 'default_popup' di manifest.
// Tapi Side Panel memberikan UX yang lebih baik untuk proses impor yang lama.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
