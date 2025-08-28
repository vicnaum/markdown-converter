// Module-level state for storing conversion results
let lastMarkdown = null;
let lastFilename = null;

document.addEventListener('DOMContentLoaded', function() {
  const convertBtn = document.getElementById('convertBtn');
  const status = document.getElementById('status');
  const progress = document.getElementById('progress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const result = document.getElementById('result');
  const resultText = document.getElementById('resultText');
  const downloadBtn = document.getElementById('downloadBtn');
  const copyBtn = document.getElementById('copyBtn');

  // Convert button click handler
  convertBtn.addEventListener('click', async function() {
    try {
      // Update UI state
      convertBtn.disabled = true;
      status.innerHTML = '<p>Converting page...</p>';
      progress.style.display = 'block';
      result.style.display = 'none';
      
      // Simulate progress
      let progressValue = 0;
      const progressInterval = setInterval(() => {
        progressValue += 10;
        progressFill.style.width = progressValue + '%';
        if (progressValue >= 100) {
          clearInterval(progressInterval);
        }
      }, 200);

      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'convertToMarkdown'
      });

             if (response.success) {
         // Show success result
         resultText.textContent = `Successfully converted "${response.title}" to Markdown`;
         result.style.display = 'block';
         status.innerHTML = '<p>Conversion complete!</p>';
         
         // Store the markdown content for download and copy
         window.markdownContent = response.markdown;
         window.filename = response.filename;
         lastMarkdown = response.markdown;
         lastFilename = response.filename;
         
         // Enable action buttons
         downloadBtn.disabled = false;
         copyBtn.disabled = false;
       } else {
         throw new Error(response.error || 'Conversion failed');
       }

    } catch (error) {
      console.error('Conversion error:', error);
      status.innerHTML = `<p style="color: #e74c3c;">Error: ${error.message}</p>`;
    } finally {
      // Reset UI state
      convertBtn.disabled = false;
      progress.style.display = 'none';
      progressFill.style.width = '0%';
    }
  });

  // Download button click handler
  downloadBtn.addEventListener('click', function() {
    if (window.markdownContent && window.filename) {
      const blob = new Blob([window.markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      chrome.downloads.download({
        url: url,
        filename: window.filename,
        saveAs: true
      });
    }
  });

  // Copy button click handler
  copyBtn.addEventListener('click', async function() {
    if (!lastMarkdown) return;
    try {
      await navigator.clipboard.writeText(lastMarkdown);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy to Clipboard'), 1200);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
      copyBtn.textContent = 'Copy failed';
      setTimeout(() => (copyBtn.textContent = 'Copy to Clipboard'), 1500);
    }
  });
});