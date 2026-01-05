/**
 * Docusaurus plugin to inject lightbox functionality
 * This plugin injects a script tag that automatically wraps images with lightbox functionality
 */

module.exports = function(context, options) {
  return {
    name: 'lightbox-plugin',
    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: 'script',
            innerHTML: `
(function() {
  
  let lightboxCounter = 0;

  function processImages(images) {
    Array.from(images).forEach((img) => {
      if (img.parentElement && (
        img.parentElement.classList.contains('image-lightbox-wrapper') ||
        (img.parentElement.tagName === 'A' && img.parentElement.href && img.parentElement.href.includes('#lightbox-'))
      )) {
        return;
      }

      const width = img.naturalWidth || img.width || img.offsetWidth;
      const height = img.naturalHeight || img.height || img.offsetHeight;
      if (width < 50 && height < 50) {
        return;
      }

      if (img.closest('pre') || 
          img.closest('.code-block') || 
          img.closest('nav') || 
          img.closest('header') ||
          img.closest('footer') ||
          img.closest('.navbar') ||
          img.closest('.lightbox-overlay')) {
        return;
      }

      if (img.classList.contains('image-lightbox') && img.parentElement && img.parentElement.tagName === 'A') {
        return;
      }

      lightboxCounter++;
      const lightboxId = 'lightbox-auto-' + Date.now() + '-' + lightboxCounter;
      
      const link = document.createElement('a');
      link.href = 'javascript:void(0)';
      link.className = 'image-lightbox-wrapper';
      link.style.textDecoration = 'none';
      link.style.display = 'inline-block';
      link.style.cursor = 'zoom-in';
      
      if (!img.classList.contains('image-lightbox')) {
        img.className = (img.className ? img.className + ' ' : '') + 'image-lightbox';
      }
      
      img.parentNode.insertBefore(link, img);
      link.appendChild(img);
      
      const overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.id = lightboxId;
      
      const closeLightbox = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
        // Remove hash if present to clear :target state
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        // Force remove active class
        overlay.classList.remove('active');
        // Force hide with inline styles (override CSS)
        overlay.style.setProperty('display', 'none', 'important');
        overlay.style.setProperty('visibility', 'hidden', 'important');
        overlay.style.setProperty('opacity', '0', 'important');
        overlay.style.setProperty('pointer-events', 'none', 'important');
        overlay.style.setProperty('z-index', '-1', 'important');
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.overflowX = '';
        document.body.style.overflowY = '';
      };
      
      // Close on overlay background click (but not on image or close button)
      overlay.addEventListener('click', (e) => {
        // Only close if clicking directly on the overlay background
        if (e.target === overlay) {
          closeLightbox(e);
        }
      });
      
      const closeBtn = document.createElement('span');
      closeBtn.className = 'lightbox-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeLightbox(e);
      });
      // Ensure close button is clickable
      closeBtn.style.pointerEvents = 'auto';
      closeBtn.style.position = 'relative';
      closeBtn.style.zIndex = '10001';
      overlay.appendChild(closeBtn);
      
      const lightboxImg = document.createElement('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
      lightboxImg.className = 'lightbox-content';
      lightboxImg.addEventListener('click', (e) => e.stopPropagation());
      overlay.appendChild(lightboxImg);
      
      document.body.appendChild(overlay);
      
      const openLightbox = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
        overlay.classList.add('active');
        overlay.style.display = 'flex';
        overlay.style.visibility = 'visible';
        overlay.style.opacity = '1';
        overlay.style.zIndex = '99999';
        document.body.style.overflow = 'hidden';
        // Don't set hash - we use active class instead to avoid :target CSS conflicts
        return false;
      };
      
      link.onclick = openLightbox;
      link.addEventListener('click', openLightbox, true);
      link.addEventListener('click', openLightbox, false);
      
      img.onclick = (e) => {
        return openLightbox(e);
      };
      img.style.pointerEvents = 'auto';
      img.style.cursor = 'zoom-in';
    });
  }

  function initLightbox() {
    const articleContent = document.querySelector('article') || 
                          document.querySelector('.markdown') || 
                          document.querySelector('main article') ||
                          document.querySelector('[class*="markdown"]') ||
                          document.querySelector('main');
    
    if (!articleContent) {
      const allImages = document.querySelectorAll('body img:not(.lightbox-content):not(.lightbox-close):not(nav img):not(header img):not(footer img)');
      processImages(allImages);
      return;
    }

    const images = articleContent.querySelectorAll('img:not(.lightbox-content):not(.lightbox-close)');
    processImages(images);
  }


  // Global handlers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeOverlay = document.querySelector('.lightbox-overlay.active');
      if (activeOverlay) {
        activeOverlay.classList.remove('active');
        activeOverlay.style.display = 'none';
        activeOverlay.style.visibility = 'hidden';
        activeOverlay.style.opacity = '0';
        activeOverlay.style.pointerEvents = 'none';
        document.body.style.overflow = '';
        if (window.location.hash) {
          history.pushState('', document.title, window.location.pathname + window.location.search);
        }
      }
    }
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash && hash.startsWith('lightbox-')) {
      const overlay = document.getElementById(hash);
      if (overlay) {
        overlay.classList.add('active');
        overlay.style.display = 'flex';
        overlay.style.visibility = 'visible';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
        document.body.style.overflow = 'hidden';
      }
    } else {
      // Close all active overlays
      document.querySelectorAll('.lightbox-overlay.active').forEach((overlay) => {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
        overlay.style.visibility = 'hidden';
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
      });
      document.body.style.overflow = '';
    }
  });
  
  // MutationObserver for dynamic content
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
      setTimeout(initLightbox, 100);
    }
  });
  
  const targetNode = document.querySelector('main') || document.body;
  if (targetNode) {
    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
  }

  // Docusaurus route changes
  if (window.docusaurus && window.docusaurus.router) {
    window.docusaurus.router.listen(() => {
      setTimeout(initLightbox, 100);
      setTimeout(initLightbox, 300);
      setTimeout(initLightbox, 600);
    });
  }

  // Periodic check for unwrapped images
  setInterval(() => {
    const unwrappedImages = document.querySelectorAll('img:not(.lightbox-content):not(.lightbox-close):not(.image-lightbox)');
    if (unwrappedImages.length > 0) {
      const articleContent = document.querySelector('article') || document.querySelector('.markdown') || document.querySelector('main');
      if (articleContent) {
        const articleImages = articleContent.querySelectorAll('img:not(.lightbox-content):not(.lightbox-close):not(.image-lightbox)');
        if (articleImages.length > 0) {
          processImages(articleImages);
        }
      }
    }
  }, 2000);
  
  // Initialize when DOM is ready
  function initializeLightbox() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initLightbox, 100);
        setTimeout(initLightbox, 500);
      });
    } else {
      setTimeout(initLightbox, 100);
      setTimeout(initLightbox, 500);
    }
    
    window.addEventListener('load', function() {
      setTimeout(initLightbox, 100);
      setTimeout(initLightbox, 500);
    });
  }
  
  initializeLightbox();
})();
            `,
          },
        ],
      };
    },
  };
};
