document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusText = document.getElementById('statusText');
  const locateButton = document.getElementById('locateButton');
  const openSidePanelButton = document.getElementById('openSidePanel');
  const darkModeToggle = document.getElementById('darkModeToggle');

  // Load initial state
  chrome.storage.local.get(['enabled', 'darkMode'], function(result) {
    console.log('Initial state loaded:', result);
    toggleSwitch.checked = result.enabled || false;
    statusText.textContent = result.enabled ? 'Enabled' : 'Disabled';
    
    // Set initial dark mode state
    if (result.darkMode) {
      document.body.classList.add('dark-mode');
      darkModeToggle.checked = true;
    }
  });

  // Toggle switch listener
  toggleSwitch.addEventListener('change', function() {
    const newState = toggleSwitch.checked;
    chrome.storage.local.set({enabled: newState}, function() {
      statusText.textContent = newState ? 'Enabled' : 'Disabled';
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: newState ? "enable" : "disable"});
      });
    });
  });

  // Locate button listener
  locateButton.addEventListener('click', function() {
    console.log('Locate button clicked');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "toggleSelection"}, function(response) {
        console.log('Response from content script:', response);
      });
    });
    window.close(); // Close the popup after clicking
  });

  // Open Side Panel button listener
  openSidePanelButton.addEventListener('click', function() {
    console.log('Open Side Panel button clicked');
    chrome.runtime.sendMessage({action: "openSidePanel"}, function(response) {
      console.log('Response from background:', response);
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
      } else if (response && response.success) {
        console.log('Side panel opened successfully');
        window.close(); // Close the popup after successful opening
      }
    });
  });

  // Dark mode toggle listener
  darkModeToggle.addEventListener('change', function() {
    document.body.classList.toggle('dark-mode');
    chrome.storage.local.set({darkMode: darkModeToggle.checked});
  });
});