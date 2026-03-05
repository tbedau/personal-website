// Simplified Lightbox Script with zoom in/out effect
document.addEventListener('DOMContentLoaded', function() {
    // Remove any existing lightboxes first to prevent duplicates
    const existingLightboxes = document.querySelectorAll('.lightbox');
    existingLightboxes.forEach(box => box.remove());
    
    // Find all content images with links
    const imageLinks = document.querySelectorAll('.article-content a:has(img), .project-image-link');
    
    // Create lightbox elements
    let lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.style.display = 'none';
    
    const lightboxImg = document.createElement('img');
    lightboxImg.className = 'lightbox-img';
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
    
    // Add elements to DOM
    lightbox.appendChild(lightboxImg);
    lightbox.appendChild(closeBtn);
    document.body.appendChild(lightbox);
    
    // Function to close lightbox
    function closeLightbox() {
      lightbox.classList.remove('active');
      setTimeout(() => {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
      }, 300); // Wait for fade-out animation
    }
    
    // Close lightbox when clicking close button or background
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(event) {
      if (event.target === lightbox || event.target === lightboxImg) {
        closeLightbox();
      }
    });
    
    // Close with escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && lightbox.style.display !== 'none') {
        closeLightbox();
      }
    });
    
    // Add click event to all image links
    imageLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent default link behavior
        const imgSrc = this.getAttribute('href');
        lightboxImg.src = imgSrc;
        
        // Show lightbox with animation
        lightbox.style.display = 'flex';
        setTimeout(() => {
          lightbox.classList.add('active');
        }, 10);
        
        document.body.style.overflow = 'hidden'; // Prevent scrolling
      });
    });
  });
