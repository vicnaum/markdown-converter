// Content script for processing web pages
// Utility functions for content processing
function isElementVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  
  if (element.hidden) return false;
  
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }
  
  const hiddenClasses = ['hidden', 'invisible', 'collapsed', 'collapsed-content'];
  if (hiddenClasses.some(cls => element.classList.contains(cls))) {
    return false;
  }
  
  return true;
}

function hasRealContent(element, depth = 0) {
  if (!element) return false;
  if (depth > 10) return false; // Safety check for infinite recursion
  
  // Check if this element itself has meaningful content
  const hasText = element.textContent.trim().length > 0;
  const hasImages = element.querySelectorAll('img').length > 0;
  const hasLinks = element.querySelectorAll('a').length > 0;
  const hasLists = element.querySelectorAll('ul, ol').length > 0;
  const hasTables = element.querySelectorAll('table').length > 0;
  const hasHeadings = element.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
  
  if (hasText || hasImages || hasLinks || hasLists || hasTables || hasHeadings) {
    return true;
  }
  
  // Check children recursively
  const children = element.children;
  if (children.length === 0) {
    return hasText;
  }
  
  for (const child of children) {
    if (hasRealContent(child, depth + 1)) {
      return true;
    }
  }
  
  return false;
}

function shouldProcessElement(element) {
  if (!element) return false;
  if (!isElementVisible(element)) return false;
  if (!hasRealContent(element)) return false;
  
  // Check for meaningful content types
  const text = element.textContent.trim();
  const hasText = text.length > 0;
  const hasImages = element.querySelectorAll('img').length > 0;
  const hasLinks = element.querySelectorAll('a').length > 0;
  const hasLists = element.querySelectorAll('ul, ol').length > 0;
  const hasTables = element.querySelectorAll('table').length > 0;
  const hasHeadings = element.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
  
  return hasText || hasImages || hasLinks || hasLists || hasTables || hasHeadings;
}

function removeRepetitiveContent(markdown) {
  if (!markdown) return '';
  
  const lines = markdown.split('\n');
  const uniqueLines = [];
  const seenLines = new Set();
  let lastWasEmpty = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Handle empty lines - normalize consecutive empty lines to just one
    if (!trimmedLine) {
      if (!lastWasEmpty) {
        uniqueLines.push(line);
        lastWasEmpty = true;
      }
      continue;
    }
    
    // Reset empty line flag for non-empty lines
    lastWasEmpty = false;
    
    // For non-empty lines, check if we've seen this content before
    if (!seenLines.has(trimmedLine)) {
      uniqueLines.push(line);
      seenLines.add(trimmedLine);
    }
  }
  
  return uniqueLines.join('\n');
}

function cleanupMarkdown(markdown) {
  if (!markdown) return '';
  
  let cleaned = markdown
    .replace(/[ \t]+/g, ' ')                 // Normalize spaces and tabs (but not newlines)
    .replace(/\n\s*\n\s*\n+/g, '\n\n')      // Limit consecutive newlines to max 2
    .trim()                                  // Trim leading/trailing whitespace
    .replace(/([^\n])\n(#+ )/g, '$1\n\n$2') // Ensure spacing before headings
    .replace(/(#+ [^\n]*)\n([^\n])/g, '$1\n\n$2') // Ensure spacing after headings
    .replace(/([^\n])\n(- )/g, '$1\n\n$2')  // Ensure spacing before lists
    .replace(/(- [^\n]*)\n([^\n])/g, '$1\n\n$2') // Ensure spacing after lists
    .replace(/^\n+/, '')                     // Remove leading newlines
    .replace(/\n+$/, '\n')                   // Remove trailing newlines
    .replace(/\n\s*\n\s*\n+/g, '\n\n')      // Final cleanup of excessive newlines
    .replace(/\n\s+(\d+)\s+\n/g, '\n$1\n')  // Clean up spacing around numbers
    .replace(/\n\s+([A-Z][a-z]+)\s+\n/g, '\n$1\n') // Clean up spacing around text
    .replace(/\n +/g, '\n');                 // Remove leading spaces from lines (but preserve newlines)
  
  cleaned = removeRepetitiveContent(cleaned);
  return cleaned;
}

class PageProcessor {
  constructor() {
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'convertToMarkdown') {
        this.convertToMarkdown()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
      }
    });
  }

  async convertToMarkdown() {
    try {
      // Extract page content
      const title = this.extractTitle();
      const content = this.extractMainContent();
      
      // Convert to markdown
      const markdown = this.convertElementToMarkdown(content);
      
      // Clean up the markdown
      const cleanMarkdown = cleanupMarkdown(markdown);
      
      // Generate filename
      const filename = this.generateFilename(title);
      
      return {
        success: true,
        title: title,
        markdown: cleanMarkdown,
        filename: filename
      };
    } catch (error) {
      throw new Error(`Failed to convert page: ${error.message}`);
    }
  }

  extractTitle() {
    const titleElement = document.querySelector('title') || 
                         document.querySelector('h1') || 
                         document.querySelector('h2');
    return titleElement ? titleElement.textContent.trim() : 'Untitled Page';
  }

  extractMainContent() {
    // Remove non-content elements first
    this.removeNonContentElements();

    // Try to find main content area
    const selectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      '#main'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && shouldProcessElement(element)) {
        return element;
      }
    }

    // Fallback to body if no main content found
    return this.findContentInBody();
  }

  findContentInBody() {
    // If no main content area found, look for the most content-rich section
    const body = document.body;
    
    // Look for sections with substantial content
    const contentSections = body.querySelectorAll('section, div, article');
    let bestContent = body;
    let maxContentLength = 0;
    
    for (const section of contentSections) {
      const contentLength = this.getContentLength(section);
      if (contentLength > maxContentLength && shouldProcessElement(section)) {
        maxContentLength = contentLength;
        bestContent = section;
      }
    }
    
    return bestContent;
  }

  getContentLength(element) {
    if (!element) return 0;
    
    // Count meaningful text content
    const text = element.textContent.trim();
    const textLength = text.length;
    
    // Bonus for elements with structured content
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    const paragraphs = element.querySelectorAll('p').length;
    const lists = element.querySelectorAll('ul, ol').length;
    
    return textLength + (headings * 100) + (paragraphs * 50) + (lists * 30);
  }

  removeNonContentElements() {
    // Elements to remove that typically don't contain main content
    const selectorsToRemove = [
      'nav', 'header', 'footer', 'aside', '.sidebar', '.navigation', '.menu', '.breadcrumb', '.pagination',
      '.social-share', '.comments', '.advertisement', '.ads', '[class*="ad-"]', '[id*="ad-"]'
    ];

    selectorsToRemove.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el && el.parentNode) {
          el.remove();
        }
      });
    });
  }

  convertElementToMarkdown(element) {
    if (!element) return '';
    
    let markdown = '';
    
    // Process child nodes
    for (const node of element.childNodes) {
      const result = this.processNode(node);
      if (result) {
        markdown += result;
      }
    }
    
    return markdown;
  }

  processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      // Only return non-empty text nodes
      return text ? text + ' ' : '';
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      // Skip elements that typically don't contain meaningful content
      if (this.shouldSkipElement(node, tagName)) {
        return '';
      }
      
      switch (tagName) {
        case 'h1':
          return `# ${node.textContent.trim()}\n\n`;
        case 'h2':
          return `## ${node.textContent.trim()}\n\n`;
        case 'h3':
          return `### ${node.textContent.trim()}\n\n`;
        case 'h4':
          return `#### ${node.textContent.trim()}\n\n`;
        case 'h5':
          return `##### ${node.textContent.trim()}\n\n`;
        case 'h6':
          return `###### ${node.textContent.trim()}\n\n`;
        case 'p':
          const pText = node.textContent.trim();
          return pText ? `${pText}\n\n` : '';
        case 'br':
          return '\n';
        case 'ul':
        case 'ol':
          return this.processList(node);
        case 'li':
          const liText = node.textContent.trim();
          return liText ? `- ${liText}\n` : '';
        case 'strong':
        case 'b':
          const strongText = node.textContent.trim();
          return strongText ? `**${strongText}**` : '';
        case 'em':
        case 'i':
          const emText = node.textContent.trim();
          return emText ? `*${emText}*` : '';
        case 'code':
          const codeText = node.textContent.trim();
          return codeText ? `\`${codeText}\`` : '';
        case 'pre':
          const preText = node.textContent.trim();
          return preText ? `\`\`\`\n${preText}\n\`\`\`\n\n` : '';
        case 'a':
          const href = node.getAttribute('href');
          const linkText = node.textContent.trim();
          if (href && linkText) {
            return `[${linkText}](${href})`;
          } else if (linkText) {
            return linkText;
          }
          return '';
        case 'img':
          const alt = node.getAttribute('alt') || '';
          const src = node.getAttribute('src') || '';
          return src ? `![${alt}](${src})` : '';
        case 'div':
        case 'section':
        case 'article':
        case 'span': // Process span elements that might contain important content
          if (shouldProcessElement(node)) { // Use new validation
            let result = '';
            for (const child of node.childNodes) {
              const childResult = this.processNode(child);
              if (childResult) {
                result += childResult;
              }
            }
            return result;
          }
          return '';
        default:
          // Recursively process child nodes
          if (shouldProcessElement(node)) {
            let result = '';
            for (const child of node.childNodes) {
              const childResult = this.processNode(child);
              if (childResult) {
                result += childResult;
              }
            }
            return result;
          }
          return '';
      }
    }
    
    return '';
  }

  shouldSkipElement(element, tagName) {
    // Skip elements that are not meant to be processed
    if (!shouldProcessElement(element)) {
      return true;
    }
    
    const skipSelectors = ['script', 'style', 'noscript', 'meta', 'link', 'iframe', 'embed', 'object'];
    return skipSelectors.includes(tagName);
  }

  processList(listElement) {
    if (!shouldProcessElement(listElement)) {
      return '';
    }
    
    let markdown = '\n';
    const items = listElement.querySelectorAll('li');
    
    for (const item of items) {
      const itemText = item.textContent.trim();
      if (itemText) {
        markdown += `- ${itemText}\n`;
      }
    }
    
    return markdown + '\n';
  }

  generateFilename(title) {
    const sanitizedTitle = title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${sanitizedTitle}-${timestamp}.md`;
  }
}

// Initialize the page processor
new PageProcessor();