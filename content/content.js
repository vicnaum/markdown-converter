// Content script for processing web pages
// Runs in isolated world when injected by popup

class PageProcessor {
  convertToMarkdown() {
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

function makeFilename(doc = document) {
  const t = (doc.title || 'page').trim().toLowerCase()
    .replace(/[^\w\-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const iso = new Date().toISOString().slice(0,10);
  return `${t || 'page'}-${iso}.md`;
}

// SINGLE, STABLE EXPORT:
// Popup will call this via a separate executeScript({ func })
window.__mdc_convert = () => {
  const proc = new PageProcessor();
  const result = proc.convertToMarkdown();
  return { 
    markdown: result.markdown, 
    filename: result.filename,
    title: result.title
  };
};