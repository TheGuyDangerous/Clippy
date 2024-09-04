chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);

  if (command === 'copy-content') {
    console.log('Executing copy-content command');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'copyContent' });
    });
  }

  if (command === '_execute_side_panel') {
    console.log('Executing _execute_side_panel command');
    openSidePanel();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  if (request.action === 'openSidePanel') {
    openSidePanel();
    sendResponse({ success: true });
  } else if (request.action === 'resetElements') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'resetElements' });
    });
    sendResponse({ success: true });
  } else if (request.action === 'pasteFromClipboard') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: () => {
            return navigator.clipboard
              .readText()
              .then((text) => ({ success: true, text: text }))
              .catch((err) => ({ success: false, error: err.message }));
          },
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else if (results && results[0] && results[0].result) {
            sendResponse(results[0].result);
          } else {
            sendResponse({ success: false, error: 'Unknown error' });
          }
        }
      );
    });
    return true; // Indicates that the response is sent asynchronously
  } else if (request.action === 'elementSelected') {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        const chatRef = firebase.database().ref('chats/' + user.uid);
        chatRef.push({
          sender: user.email,
          text: request.content,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
        }).then(() => {
          console.log('Content added to database');
          // Remove this line as it's no longer needed
          // chrome.runtime.sendMessage({ action: 'updateChat', content: request.content });
        }).catch((error) => {
          console.error('Error adding content to database:', error);
        });
      } else {
        console.error('User not authenticated');
      }
    });
  }
  return true; // Indicates that the response is sent asynchronously for all cases
});

function openSidePanel() {
  console.log('Attempting to open side panel');
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.sidePanel
      .open({ tabId: tabs[0].id })
      .then(() => {
        console.log('Side panel opened successfully');
      })
      .catch((error) => {
        console.error('Error opening side panel:', error);
      });
  });
}

console.log('Background script loaded');

// Add this to check if commands are registered
chrome.commands.getAll((commands) => {
  console.log('Registered commands:', commands);
});

// Add this to check if sidePanel API is available
console.log('Is sidePanel available:', !!chrome.sidePanel);
console.log(
  'Is sidePanel.open available:',
  !!(chrome.sidePanel && chrome.sidePanel.open)
);

// Add these imports at the top of the file
importScripts('firebase-app.js');
importScripts('firebase-auth.js');
importScripts('firebase-database.js');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

firebase.initializeApp(firebaseConfig);
