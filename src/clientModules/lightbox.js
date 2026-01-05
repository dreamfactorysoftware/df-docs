/**
 * Auto-lightbox for images in Docusaurus documentation
 * Automatically wraps images in markdown content with lightbox functionality
 */

console.log('[Lightbox] Client module file loaded');

// Generate unique ID for each image
let lightboxCounter = 0;

function processImages(images) {
  Array.from(images).forEach((img) => {
    // Skip if already wrapped in a lightbox link
    if (img.parentElement && (
      img.parentElement.classList.contains('image-lightbox-wrapper') ||
      (img.parentElement.tagName === 'A' && img.parentElement.href && img.parentElement.href.includes('#lightbox-'))
    )) {
      return;
    }

    // Skip very small images (likely icons)
    const width = img.naturalWidth || img.width || img.offsetWidth;
    const height = img.naturalHeight || img.height || img.offsetHeight;
    if (width < 50 && height < 50) {
      return;
    }

    // Skip images in code blocks, navbars, footers, or other special containers
    if (img.closest('pre') || 
        img.closest('.code-block') || 
        img.closest('nav') || 
        img.closest('header') ||
        img.closest('footer') ||
        img.closest('.navbar') ||
        img.closest('.lightbox-overlay')) {
      return;
    }

    // Skip if image is already part of a manually created lightbox
    if (img.classList.contains('image-lightbox') && img.parentElement && img.parentElement.tagName === 'A') {
      return;
    }

    lightboxCounter++;
    const lightboxId = `lightbox-auto-${Date.now()}-${lightboxCounter}`;
    
    // Create wrapper link
    const link = document.createElement('a');
    link.href = 'javascript:void(0)';
    link.className = 'image-lightbox-wrapper';
    link.style.textDecoration = 'none';
    link.style.display = 'inline-block';
    link.style.cursor = 'zoom-in';
    
    // Add lightbox class to image if not already present
    if (!img.classList.contains('image-lightbox')) {
      img.className = (img.className ? img.className + ' ' : '') + 'image-lightbox';
    }
    
    // Wrap image in link
    img.parentNode.insertBefore(link, img);
    link.appendChild(img);
    
    // Create lightbox overlay
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.id = lightboxId;
    
    // Close handler
    const closeLightbox = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      overlay.classList.remove('active');
      overlay.style.display = 'none';
      document.body.style.overflow = '';
      if (window.location.hash === `#${lightboxId}`) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
    };
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('lightbox-close')) {
        closeLightbox(e);
      }
    });
    
    // Create close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeLightbox);
    overlay.appendChild(closeBtn);
    
    // Create lightbox image
    const lightboxImg = document.createElement('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || '';
    lightboxImg.className = 'lightbox-content';
    lightboxImg.addEventListener('click', (e) => e.stopPropagation());
    overlay.appendChild(lightboxImg);
    
    // Add overlay to body
    document.body.appendChild(overlay);
    
    // Function to open lightbox
    const openLightbox = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
      console.log('[Lightbox] Opening lightbox', lightboxId);
      overlay.classList.add('active');
      overlay.style.display = 'flex';
      overlay.style.visibility = 'visible';
      overlay.style.opacity = '1';
      overlay.style.zIndex = '99999';
      document.body.style.overflow = 'hidden';
      window.location.hash = lightboxId;
      console.log('[Lightbox] Overlay should be visible now');
      return false;
    };
    
    // Use onclick for more reliable event handling
    link.onclick = (e) => {
      console.log('[Lightbox] Link onclick fired');
      return openLightbox(e);
    };
    
    // Also add event listeners as backup
    link.addEventListener('click', (e) => {
      console.log('[Lightbox] Link addEventListener click fired');
      openLightbox(e);
    }, true);
    
    link.addEventListener('click', (e) => {
      console.log('[Lightbox] Link addEventListener bubble click fired');
      openLightbox(e);
    }, false);
    
    // Add to image as well
    img.onclick = (e) => {
      console.log('[Lightbox] Direct image onclick');
      return openLightbox(e);
    };
    img.style.pointerEvents = 'auto';
    img.style.cursor = 'zoom-in';
    
    console.log(`[Lightbox] Wrapped image with ID: ${lightboxId}, src: ${img.src}`);
  });
}

function initLightbox() {
  console.log('[Lightbox] initLightbox called');
  
  // Try multiple selectors to find content area
  const articleContent = document.querySelector('article') || 
                        document.querySelector('.markdown') || 
                        document.querySelector('main article') ||
                        document.querySelector('[class*="markdown"]') ||
                        document.querySelector('main');
  
  if (!articleContent) {
    console.log('[Lightbox] No article content found, trying document body');
    const allImages = document.querySelectorAll('body img:not(.lightbox-content):not(.lightbox-close):not(nav img):not(header img):not(footer img)');
    console.log(`[Lightbox] Found ${allImages.length} images in body to process`);
    processImages(allImages);
    return;
  }

  const images = articleContent.querySelectorAll('img:not(.lightbox-content):not(.lightbox-close)');
  
  console.log(`[Lightbox] Found ${images.length} images in article to process`);
  processImages(images);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedInit = debounce(initLightbox, 100);

// Expose test function to window for debugging
window.testLightbox = function() {
  console.log('[Lightbox] Testing lightbox setup...');
  const wrappers = document.querySelectorAll('.image-lightbox-wrapper');
  console.log(`[Lightbox] Found ${wrappers.length} wrapped images`);
  const overlays = document.querySelectorAll('.lightbox-overlay');
  console.log(`[Lightbox] Found ${overlays.length} overlay elements in DOM`);
  return { wrappers: wrappers.length, overlays: overlays.length };
};

// Global handlers for Escape key and hash changes
if (typeof window !== 'undefined') {
  console.log('[Lightbox] Setting up global handlers');
  
  // Handle Escape key globally
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeOverlay = document.querySelector('.lightbox-overlay.active');
      if (activeOverlay) {
        activeOverlay.classList.remove('active');
        activeOverlay.style.display = 'none';
        document.body.style.overflow = '';
        if (window.location.hash) {
          history.pushState('', document.title, window.location.pathname + window.location.search);
        }
      }
    }
  });

  // Handle hash changes (back button, etc.)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash && hash.startsWith('lightbox-')) {
      const overlay = document.getElementById(hash);
      if (overlay) {
        overlay.classList.add('active');
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.querySelectorAll('.lightbox-overlay.active').forEach((overlay) => {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
      });
      document.body.style.overflow = '';
    }
  });
}

// Initialize on page load
if (typeof window !== 'undefined') {
  console.log('[Lightbox] Client module executing - window is defined');
  
  function runInit() {
    console.log('[Lightbox] Running initLightbox');
    setTimeout(initLightbox, 50);
    setTimeout(initLightbox, 200);
    setTimeout(initLightbox, 500);
  }

  if (document.readyState === 'loading') {
    console.log('[Lightbox] Document is loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', runInit);
  } else {
    console.log('[Lightbox] Document already loaded, running init immediately');
    runInit();
  }

  window.addEventListener('load', () => {
    console.log('[Lightbox] Window load event fired');
    setTimeout(initLightbox, 100);
    setTimeout(initLightbox, 500);
  });
  
  // Use MutationObserver to detect content changes
  const observer = new MutationObserver((mutations) => {
    let shouldInit = false;
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && (node.tagName === 'IMG' || (node.querySelector && node.querySelector('img')))) {
            shouldInit = true;
          }
        });
      }
    });
    if (shouldInit) {
      console.log('[Lightbox] MutationObserver detected new images');
      debouncedInit();
    }
  });
  
  // Observe changes to the main content
  const targetNode = document.querySelector('main') || document.body;
  if (targetNode) {
    console.log('[Lightbox] Setting up MutationObserver on', targetNode);
    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
  }

  // Handle Docusaurus route changes
  if (window.docusaurus && window.docusaurus.router) {
    console.log('[Lightbox] Docusaurus router found, setting up listener');
    window.docusaurus.router.listen(() => {
      console.log('[Lightbox] Docusaurus route changed');
      setTimeout(initLightbox, 100);
      setTimeout(initLightbox, 300);
      setTimeout(initLightbox, 600);
    });
  }
  
  // Periodic check for new images (fallback)
  setInterval(() => {
    const unwrappedImages = document.querySelectorAll('img:not(.lightbox-content):not(.lightbox-close):not(.image-lightbox)');
    if (unwrappedImages.length > 0) {
      const articleContent = document.querySelector('article') || document.querySelector('.markdown') || document.querySelector('main');
      if (articleContent) {
        const articleImages = articleContent.querySelectorAll('img:not(.lightbox-content):not(.lightbox-close):not(.image-lightbox)');
        if (articleImages.length > 0) {
          console.log(`[Lightbox] Periodic check found ${articleImages.length} unwrapped images, re-initializing`);
          processImages(articleImages);
        }
      }
    }
  }, 2000);
}

console.log('[Lightbox] Client module execution complete');
