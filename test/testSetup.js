/**
 * Test Setup File
 * Configures the testing environment for Jest with jsdom
 */

// Polyfill missing Web APIs for Node.js environment
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Wait for DOM to be ready before setting up mocks
beforeAll(() => {
  // Mock window.getComputedStyle for testing
  Object.defineProperty(window, 'getComputedStyle', {
    value: (element) => {
      return {
        display: element.style.display || 'block',
        visibility: element.style.visibility || 'visible',
        opacity: element.style.opacity || '1'
      };
    }
  });

  // Mock getBoundingClientRect for testing
  Element.prototype.getBoundingClientRect = function() {
    return {
      width: this.style.width ? parseInt(this.style.width) : 100,
      height: this.style.height ? parseInt(this.style.height) : 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100
    };
  };
});
