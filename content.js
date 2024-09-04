let selecting = false;
let highlightedElement = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === 'toggleSelection') {
    toggleSelection();
    sendResponse({ success: true, message: 'Selection toggled' });
  }
  return true;
});

function toggleSelection() {
  selecting = !selecting;
  console.log('Selection toggled:', selecting);
  document.body.style.cursor = selecting ? 'crosshair' : 'default';
}

document.addEventListener('mouseover', function (e) {
  if (selecting) {
    if (highlightedElement) {
      highlightedElement.style.outline = '';
    }
    highlightedElement = e.target;
    highlightedElement.style.outline = '2px solid #ff0000';
  }
});

document.addEventListener('mouseout', function (e) {
  if (selecting && e.target === highlightedElement) {
    highlightedElement.style.outline = '';
    highlightedElement = null;
  }
});

document.addEventListener('click', function (e) {
  if (selecting) {
    e.preventDefault();
    e.stopPropagation();
    selecting = false;
    document.body.style.cursor = 'default';
    const element = e.target;
    if (highlightedElement) {
      highlightedElement.style.outline = '';
      highlightedElement = null;
    }
    const selector = generateSelector(element);
    console.log('Element selected:', selector);
    const copiedText = element.innerText;
    copyToClipboard(copiedText);
    
    // Send the copied text to the background script
    chrome.runtime.sendMessage({ action: 'elementSelected', content: copiedText });
  }
});

function generateSelector(element) {
  if (element.id) {
    return '#' + CSS.escape(element.id);
  }

  let path = [];
  while (element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();
    if (element.className) {
      const classes = element.className
        .split(/\s+/)
        .filter((c) => c.length > 0)
        .map((c) => '.' + CSS.escape(c))
        .join('');
      selector += classes;
    }

    let sibling = element;
    let nth = 1;
    while ((sibling = sibling.previousElementSibling)) {
      if (sibling.nodeName.toLowerCase() === selector.split('.')[0]) nth++;
    }

    if (nth > 1) selector += `:nth-of-type(${nth})`;

    path.unshift(selector);

    if (
      element.parentNode.id ||
      (element.parentNode.className &&
        element.parentNode.classList.length === 1)
    ) {
      break;
    }

    element = element.parentNode;
  }

  if (element.parentNode.id) {
    path.unshift('#' + CSS.escape(element.parentNode.id));
  } else if (
    element.parentNode.className &&
    element.parentNode.classList.length === 1
  ) {
    path.unshift('.' + CSS.escape(element.parentNode.classList[0]));
  }

  return path.join(' > ');
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log('Content copied to clipboard');
    })
    .catch((err) => {
      console.error('Failed to copy content: ', err);
    });
}

console.log('Content script loaded');

// Keyboard shortcut listener for Ctrl+Shift+X
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.shiftKey && (e.key === 'X' || e.key === 'x')) {
    console.log('Ctrl+Shift+X pressed in content script');
    toggleSelection();
  }
});
