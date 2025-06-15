
// ToyParty Interactive Features
class ToyParty {
  constructor() {
    this.init();
  }

  init() {
    console.log('🎉 ToyParty initialized!');
    this.addInteractivity();
    this.loadContent();
  }

  addInteractivity() {
    // Add click effects to features
    document.querySelectorAll('.feature').forEach(feature => {
      feature.addEventListener('click', () => {
        feature.style.transform = 'scale(1.05)';
        setTimeout(() => {
          feature.style.transform = 'scale(1)';
        }, 200);
      });
    });

    // Add dynamic status updates
    this.updateStatus();
  }

  updateStatus() {
    const statusEl = document.querySelector('.status');
    const statuses = [
      '✅ LIVE & DEPLOYED!',
      '🚀 READY TO PARTY!',
      '⚡ SUPER FAST!',
      '🎊 PARTY MODE ON!'
    ];
    
    let index = 0;
    setInterval(() => {
      statusEl.textContent = statuses[index];
      index = (index + 1) % statuses.length;
    }, 3000);
  }

  loadContent() {
    // Simulate loading additional content
    setTimeout(() => {
      console.log('🎮 ToyParty features loaded!');
    }, 1000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ToyParty();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToyParty;
}
