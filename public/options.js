// Save options to chrome.storage
function save_options() {
  const defaultFolder = document.getElementById('defaultFolder').value;
  const autoSkip = document.getElementById('autoSkip').checked;
  
  chrome.storage.local.set({
    preferredFolderId: defaultFolder,
    autoSkipDuplicates: autoSkip
  }, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.style.display = 'block';
    setTimeout(() => {
      status.style.display = 'none';
    }, 1500);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.local.get({
    preferredFolderId: '1',
    autoSkipDuplicates: true
  }, (items) => {
    document.getElementById('defaultFolder').value = items.preferredFolderId;
    document.getElementById('autoSkip').checked = items.autoSkipDuplicates;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
