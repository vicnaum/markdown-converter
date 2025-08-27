/**
 * Content Processing Utilities
 * Functions for analyzing and filtering HTML elements to extract meaningful content
 */

/**
 * Checks if an element is visible in the DOM
 * @param {Element} element - The DOM element to check
 * @returns {boolean} - True if element is visible, false otherwise
 */
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

/**
 * Checks if an element contains real content (not just empty containers)
 * @param {Element} element - The DOM element to check
 * @param {number} depth - Current recursion depth (for safety)
 * @returns {boolean} - True if element has real content, false otherwise
 */
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

/**
 * Determines if an element should be processed for markdown conversion
 * @param {Element} element - The DOM element to check
 * @returns {boolean} - True if element should be processed, false otherwise
 */
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

/**
 * Removes repetitive content from markdown text
 * @param {string} markdown - The markdown text to clean
 * @returns {string} - Cleaned markdown without repetitive content
 */
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

/**
 * Cleans up markdown text by normalizing whitespace and formatting
 * @param {string} markdown - The markdown text to clean
 * @returns {string} - Cleaned and normalized markdown
 */
function cleanupMarkdown(markdown) {
  if (!markdown) return '';
  
  let cleaned = markdown
    .replace(/[ \t]+/g, ' ')                 // Normalize spaces and tabs (but not newlines)
    .replace(/\n\s*\n\s*\n+/g, '\n\n')      // Limit consecutive newlines to max 2
    .replace(/([^\n])\n(#+ )/g, '$1\n\n$2') // Ensure spacing before headings
    .replace(/(#+ [^\n]*)\n([^\n])/g, '$1\n\n$2') // Ensure spacing after headings
    .replace(/([^\n])\n(- )/g, '$1\n\n$2')  // Ensure spacing before lists
    .replace(/(- [^\n]*)\n([^\n])/g, '$1\n\n$2') // Ensure spacing after lists
    .replace(/^\n+/, '')                     // Remove leading newlines
    .replace(/\n+$/, '\n')                   // Remove trailing newlines
    .replace(/\n\s*\n\s*\n+/g, '\n\n')      // Final cleanup of excessive newlines
    .replace(/\n\s+(\d+)\s+\n/g, '\n$1\n')  // Clean up spacing around numbers
    .replace(/\n\s+([A-Z][a-z]+)\s+\n/g, '\n$1\n') // Clean up spacing around text
    .replace(/\n +/g, '\n')                  // Remove leading spaces from lines (but preserve newlines)
    .trim();                                  // Trim leading/trailing whitespace
  
  cleaned = removeRepetitiveContent(cleaned);
  return cleaned;
}

/**
 * Creates a mock DOM element for testing purposes
 * @param {string} tagName - The HTML tag name
 * @param {Object} attributes - Object with attribute key-value pairs
 * @param {string} textContent - Text content for the element
 * @param {Array} children - Array of child elements
 * @returns {Element} - Mock DOM element
 */
function createMockElement(tagName, attributes = {}, textContent = '', children = []) {
  const element = document.createElement(tagName);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  // Set text content
  if (textContent) {
    element.textContent = textContent;
  }
  
  // Add children
  children.forEach(child => {
    element.appendChild(child);
  });
  
  return element;
}

// Export all functions
module.exports = {
  isElementVisible,
  hasRealContent,
  shouldProcessElement,
  removeRepetitiveContent,
  cleanupMarkdown,
  createMockElement
};
