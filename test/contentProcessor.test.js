/**
 * Unit Tests for Content Processing Utilities
 * Following TDD principles - tests written before implementation
 */

// Load the utility functions into the global scope for testing
require('../utils/contentProcessor.js');

// The functions are now available globally in the test environment
const {
  isElementVisible,
  hasRealContent,
  shouldProcessElement,
  removeRepetitiveContent,
  cleanupMarkdown,
  createMockElement
} = global;

// Mock DOM environment for testing
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

describe('Content Processing Utilities', () => {
  
  describe('createMockElement', () => {
    test('should create a basic element with tag name', () => {
      const element = createMockElement('div');
      expect(element.tagName.toLowerCase()).toBe('div');
    });

    test('should create element with attributes', () => {
      const element = createMockElement('div', { class: 'test', id: 'test-id' });
      expect(element.getAttribute('class')).toBe('test');
      expect(element.getAttribute('id')).toBe('test-id');
    });

    test('should create element with text content', () => {
      const element = createMockElement('p', {}, 'Hello World');
      expect(element.textContent).toBe('Hello World');
    });

    test('should create element with children', () => {
      const child1 = createMockElement('span', {}, 'Child 1');
      const child2 = createMockElement('span', {}, 'Child 2');
      const parent = createMockElement('div', {}, '', [child1, child2]);
      
      expect(parent.children.length).toBe(2);
      expect(parent.children[0].textContent).toBe('Child 1');
      expect(parent.children[1].textContent).toBe('Child 2');
    });
  });

  describe('isElementVisible', () => {
    test('should return false for null element', () => {
      expect(isElementVisible(null)).toBe(false);
    });

    test('should return false for undefined element', () => {
      expect(isElementVisible(undefined)).toBe(false);
    });

    test('should return false for element with display: none', () => {
      const element = createMockElement('div');
      element.style.display = 'none';
      expect(isElementVisible(element)).toBe(false);
    });

    test('should return false for element with visibility: hidden', () => {
      const element = createMockElement('div');
      element.style.visibility = 'hidden';
      expect(isElementVisible(element)).toBe(false);
    });

    test('should return false for element with opacity: 0', () => {
      const element = createMockElement('div');
      element.style.opacity = '0';
      expect(isElementVisible(element)).toBe(false);
    });

    test('should return false for element with hidden attribute', () => {
      const element = createMockElement('div');
      element.hidden = true;
      expect(isElementVisible(element)).toBe(false);
    });

    test('should return false for element with zero dimensions', () => {
      const element = createMockElement('div');
      // Mock getBoundingClientRect to return zero dimensions
      element.getBoundingClientRect = () => ({ width: 0, height: 0 });
      expect(isElementVisible(element)).toBe(false);
    });

    test('should return false for element with hidden CSS class', () => {
      const element = createMockElement('div');
      element.classList.add('hidden');
      expect(isElementVisible(element)).toBe(false);
    });

    test('should return false for element with invisible CSS class', () => {
      const element = createMockElement('div');
      element.classList.add('invisible');
      expect(isElementVisible(element)).toBe(false);
    });

    test('should return true for visible element', () => {
      const element = createMockElement('div');
      element.style.display = 'block';
      element.style.visibility = 'visible';
      element.style.opacity = '1';
      element.getBoundingClientRect = () => ({ width: 100, height: 100 });
      expect(isElementVisible(element)).toBe(true);
    });
  });

  describe('hasRealContent', () => {
    test('should return false for null element', () => {
      expect(hasRealContent(null)).toBe(false);
    });

    test('should return false for undefined element', () => {
      expect(hasRealContent(undefined)).toBe(false);
    });

    test('should return false when depth exceeds safety limit', () => {
      const element = createMockElement('div');
      expect(hasRealContent(element, 11)).toBe(false);
    });

    test('should return true for element with text content and no children', () => {
      const element = createMockElement('p', {}, 'This is some text');
      expect(hasRealContent(element)).toBe(true);
    });

    test('should return false for element with no text and no children', () => {
      const element = createMockElement('div');
      expect(hasRealContent(element)).toBe(false);
    });

    test('should return false for element with only whitespace text', () => {
      const element = createMockElement('div', {}, '   \n\t  ');
      expect(hasRealContent(element)).toBe(false);
    });

    test('should return true for element with children that have content', () => {
      const child = createMockElement('p', {}, 'Child content');
      const parent = createMockElement('div', {}, '', [child]);
      expect(hasRealContent(parent)).toBe(true);
    });

    test('should return false for element with children that have no content', () => {
      const child = createMockElement('div');
      const parent = createMockElement('div', {}, '', [child]);
      expect(hasRealContent(parent)).toBe(false);
    });

    test('should handle deeply nested content correctly', () => {
      const deepChild = createMockElement('p', {}, 'Deep content');
      const level3 = createMockElement('div', {}, '', [deepChild]);
      const level2 = createMockElement('div', {}, '', [level3]);
      const level1 = createMockElement('div', {}, '', [level2]);
      const root = createMockElement('div', {}, '', [level1]);
      
      expect(hasRealContent(root)).toBe(true);
    });

    test('should return false for element with only empty nested containers', () => {
      const emptyChild = createMockElement('div');
      const level3 = createMockElement('div', {}, '', [emptyChild]);
      const level2 = createMockElement('div', {}, '', [level3]);
      const level1 = createMockElement('div', {}, '', [level2]);
      const root = createMockElement('div', {}, '', [level1]);
      
      expect(hasRealContent(root)).toBe(false);
    });
  });

  describe('shouldProcessElement', () => {
    test('should return false for null element', () => {
      expect(shouldProcessElement(null)).toBe(false);
    });

    test('should return false for invisible element', () => {
      const element = createMockElement('div');
      element.style.display = 'none';
      expect(shouldProcessElement(element)).toBe(false);
    });

    test('should return false for element with no real content', () => {
      const element = createMockElement('div');
      expect(shouldProcessElement(element)).toBe(false);
    });

    test('should return true for element with text content', () => {
      const element = createMockElement('p', {}, 'This is some text');
      expect(shouldProcessElement(element)).toBe(true);
    });

    test('should return true for element with images', () => {
      const element = createMockElement('div');
      const img = createMockElement('img');
      element.appendChild(img);
      expect(shouldProcessElement(element)).toBe(true);
    });

    test('should return true for element with links', () => {
      const element = createMockElement('div');
      const link = createMockElement('a', { href: '#' }, 'Link text');
      element.appendChild(link);
      expect(shouldProcessElement(element)).toBe(true);
    });

    test('should return true for element with lists', () => {
      const element = createMockElement('div');
      const ul = createMockElement('ul');
      const li = createMockElement('li', {}, 'List item');
      ul.appendChild(li);
      element.appendChild(ul);
      expect(shouldProcessElement(element)).toBe(true);
    });

    test('should return true for element with headings', () => {
      const element = createMockElement('div');
      const h1 = createMockElement('h1', {}, 'Heading');
      element.appendChild(h1);
      expect(shouldProcessElement(element)).toBe(true);
    });
  });

  describe('removeRepetitiveContent', () => {
    test('should return empty string for null input', () => {
      expect(removeRepetitiveContent(null)).toBe('');
    });

    test('should return empty string for undefined input', () => {
      expect(removeRepetitiveContent(undefined)).toBe('');
    });

    test('should return empty string for empty string', () => {
      expect(removeRepetitiveContent('')).toBe('');
    });

    test('should return same string for single line', () => {
      const input = 'Single line of text';
      expect(removeRepetitiveContent(input)).toBe(input);
    });

    test('should remove duplicate lines', () => {
      const input = 'Line 1\nLine 2\nLine 1\nLine 3';
      const expected = 'Line 1\nLine 2\nLine 3';
      expect(removeRepetitiveContent(input)).toBe(expected);
    });

    test('should remove duplicate lines with different whitespace', () => {
      const input = 'Line 1\n  Line 2  \nLine 1\nLine 3';
      const expected = 'Line 1\n  Line 2  \nLine 3';
      expect(removeRepetitiveContent(input)).toBe(expected);
    });

    test('should preserve 1 empty line between content', () => {
      const input = 'Line 1\n\n\nLine 2\n\nLine 1\nLine 3';
      const expected = 'Line 1\n\nLine 2\n\nLine 3';
      expect(removeRepetitiveContent(input)).toBe(expected);
    });

    test('should handle complex repetitive patterns', () => {
      const input = 'Header\nContent\nHeader\nMore content\nHeader\nFooter';
      const expected = 'Header\nContent\nMore content\nFooter';
      expect(removeRepetitiveContent(input)).toBe(expected);
    });
  });

  describe('cleanupMarkdown', () => {
    test('should return empty string for null input', () => {
      expect(cleanupMarkdown(null)).toBe('');
    });

    test('should return empty string for undefined input', () => {
      expect(cleanupMarkdown(undefined)).toBe('');
    });

    test('should return empty string for empty string', () => {
      expect(cleanupMarkdown('')).toBe('');
    });

    test('should normalize excessive whitespace', () => {
      const input = 'Text    with    multiple    spaces';
      const expected = 'Text with multiple spaces';
      expect(cleanupMarkdown(input)).toBe(expected);
    });

    test('should limit consecutive newlines to maximum 2', () => {
      const input = 'Line 1\n\n\n\nLine 2\n\n\n\n\nLine 3';
      const expected = 'Line 1\n\nLine 2\n\nLine 3';
      expect(cleanupMarkdown(input)).toBe(expected);
    });

    test('should trim leading and trailing whitespace', () => {
      const input = '  \n  Content with whitespace  \n  ';
      const expected = 'Content with whitespace';
      expect(cleanupMarkdown(input)).toBe(expected);
    });

    test('should ensure proper spacing around headings', () => {
      const input = 'Text\n# Heading\nMore text';
      const expected = 'Text\n\n# Heading\n\nMore text';
      expect(cleanupMarkdown(input)).toBe(expected);
    });

    test('should ensure proper spacing around lists', () => {
      const input = 'Text\n- List item\nMore text';
      const expected = 'Text\n\n- List item\n\nMore text';
      expect(cleanupMarkdown(input)).toBe(expected);
    });

    test('should clean up excessive spacing around numbers', () => {
      const input = 'Text\n  123  \nMore text';
      const expected = 'Text\n123\nMore text';
      expect(cleanupMarkdown(input)).toBe(expected);
    });

    test('should clean up excessive spacing around text', () => {
      const input = 'Text\n  Word  \nMore text';
      const expected = 'Text\nWord\nMore text';
      expect(cleanupMarkdown(input)).toBe(expected);
    });

    test('should handle complex markdown cleanup', () => {
      const input = `
        # Title
        
        
        Paragraph with    multiple    spaces
        
        
        - List item
        
        
        ## Subtitle
        
        
        More content
      `;
      const expected = '# Title\n\nParagraph with multiple spaces\n\n- List item\n\n## Subtitle\n\nMore content';
      expect(cleanupMarkdown(input)).toBe(expected);
    });
  });
});
