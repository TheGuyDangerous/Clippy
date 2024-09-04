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

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  const errorElement = document.getElementById('error');

  console.log('DOM content loaded, setting up event listeners');

  function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      console.log('Login attempt with email:', email);
      try {
        const userCredential = await firebase
          .auth()
          .signInWithEmailAndPassword(email, password);
        console.log('Login successful:', userCredential.user);
        showChatPage(userCredential.user);
      } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = 'Login failed: ' + error.message;
      }
    });
  }

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      console.log('User is signed in:', user);
      showChatPage(user);
    } else {
      console.log('User is signed out');
      showLoginPage();
    }
  });

  function showLoginPage() {
    console.log('Showing login page');
    root.innerHTML = `
            <h1>Clippy Login</h1>
            <form id="loginForm">
                <input type="email" id="email" placeholder="Email" required>
                <input type="password" id="password" placeholder="Password" required>
                <button type="submit">Sign In</button>
            </form>
            <p id="error"></p>
        `;
    setupLoginForm();
  }

  function showChatPage(user) {
    console.log('Showing chat page for user:', user.email);
    root.innerHTML = `
      <div class="chat-container">
          <div class="header">
              <h1>Chat</h1>
              <span class="user-email">${user.email}</span>
              <div>
                  <button id="locate" class="icon-button" title="Locate Element">🔍</button>
                  <button id="reset" class="icon-button" title="Reset Chat">🔄</button>
                  <button id="logout" class="icon-button" title="Logout">🚪</button>
              </div>
          </div>
          <div id="chat-messages"></div>
          <form id="chat-form">
              <div class="input-container">
                  <textarea id="message-input" placeholder="Type your message..." required></textarea>
                  <button type="button" id="paste-button" title="Paste from clipboard">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                      </svg>
                  </button>
                  <button type="submit" id="send-button"></button>
              </div>
          </form>
      </div>
    `;
    setupChatFunctionality(user);
    document.getElementById('logout').addEventListener('click', () => {
      console.log('Logout button clicked');
      firebase
        .auth()
        .signOut()
        .then(() => {
          console.log('User signed out successfully');
        })
        .catch((error) => {
          console.error('Error signing out:', error);
        });
    });
    document.getElementById('reset').addEventListener('click', () => {
      resetChatData(user);
    });
    document.getElementById('locate').addEventListener('click', () => {
      console.log('Locate button clicked');
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleSelection' });
      });
    });
  }

  const initialUser = firebase.auth().currentUser;
  console.log('Initial auth state:', initialUser ? 'Signed in' : 'Signed out');
  console.log('Sidepanel script loaded and executed');
  console.log('Firebase Auth initialized:', !!firebase.auth());
  setupLoginForm();
});

function setupChatFunctionality(user) {
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const chatMessages = document.getElementById('chat-messages');
  const pasteButton = document.getElementById('paste-button');

  const chatRef = firebase.database().ref('chats/' + user.uid);

  // Modify this listener to handle both database updates and background script messages
  chatRef.on('child_added', (snapshot) => {
    const message = snapshot.val();
    const messageElement = createMessageElement(message.text, message.sender);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // Remove this listener as we'll handle all updates through the Firebase listener
  // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //   if (request.action === 'updateChat') {
  //     const messageElement = createMessageElement(request.content, user.email);
  //     chatMessages.appendChild(messageElement);
  //     chatMessages.scrollTop = chatMessages.scrollHeight;
  //   }
  // });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const messageText = messageInput.value.trim();
    if (messageText) {
      chatRef.push({
        sender: user.email,
        text: messageText,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      });
      messageInput.value = '';
      messageInput.style.height = 'auto';
    }
  });

  messageInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
  });

  messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  if (pasteButton) {
    pasteButton.addEventListener('click', () => {
      console.log('Paste button clicked');
      navigator.clipboard
        .readText()
        .then((text) => {
          console.log('Pasting text:', text);
          messageInput.value += text || '';
          messageInput.dispatchEvent(new Event('input'));
        })
        .catch((err) => {
          console.error('Failed to read clipboard contents:', err);
        });
    });
  } else {
    console.error('Paste button not found');
  }

  // Add this listener to handle messages from the background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateChat') {
      const messageElement = createMessageElement(request.content, user.email);
      chatMessages.appendChild(messageElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });
}

// Add this helper function to create message elements
function createMessageElement(text, sender) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message-container');
  messageElement.classList.add('user-message');

  const formattedText = text.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');

  messageElement.innerHTML = `
    <div class="message-content">${formattedText}</div>
    <div class="message-footer">
      <button class="copy-button" title="Copy message">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  `;

  const copyButton = messageElement.querySelector('.copy-button');
  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log('Message copied to clipboard');
        copyButton.classList.add('copied');
        setTimeout(() => {
          copyButton.classList.remove('copied');
        }, 2000);
      })
      .catch((err) => {
        console.error('Failed to copy message: ', err);
      });
  });

  return messageElement;
}

function resetChatData(user) {
  const chatRef = firebase.database().ref('chats/' + user.uid);
  chatRef
    .remove()
    .then(() => {
      console.log('Chat data reset successfully');
      document.getElementById('chat-messages').innerHTML = '';
    })
    .catch((error) => {
      console.error('Error resetting chat data:', error);
    });
}
