const routes = {
  '/': { title: 'Dashboard' },
  '/dashboard': { title: 'Dashboard' },
  '/saved': { title: 'Saved' },
  '/digest': { title: 'Digest' },
  '/settings': { title: 'Settings' },
  '/proof': { title: 'Proof' }
};

const appRoot = document.getElementById('app-root');
const navLinks = document.querySelectorAll('.nav-link');
const menuToggle = document.getElementById('mobile-menu-btn');
const navMenu = document.getElementById('nav-menu');

// Core router logic
function renderPage(path) {
  let title = 'Page Not Found';
  let subtext = 'The page you are looking for does not exist.';

  // If path is missing from routes, it falls into 404 block automatically
  const route = routes[path];

  if (route) {
    title = route.title;
    subtext = 'This section will be built in the next step.';
  }

  // Inject content strictly matching design setup requirements
  appRoot.innerHTML = `
    <div class="text-container">
      <h1>${title}</h1>
      <p>${subtext}</p>
    </div>
  `;

  updateActiveLink(path);
}

// Active navigation handler
function updateActiveLink(path) {
  navLinks.forEach(link => {
    link.classList.remove('active');
    
    // Exact match or fallback mapping
    const linkPath = link.getAttribute('href');
    if (linkPath === path || (path === '/' && linkPath === '/dashboard')) {
      link.classList.add('active');
    }
  });
}

// Navigation executor without reloading
function navigateTo(url) {
  history.pushState(null, null, url);
  renderPage(location.pathname);
}

// Intercept routing clicks globally
document.addEventListener('click', e => {
  if (e.target.matches('[data-route]')) {
    e.preventDefault();
    const url = e.target.getAttribute('href');
    navigateTo(url);
    
    // Automatically close mobile menu upon navigation
    navMenu.classList.remove('open');
  }
});

// React to browser Forward/Back buttons
window.addEventListener('popstate', () => {
  renderPage(location.pathname);
});

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
});

// Execute initial load
document.addEventListener('DOMContentLoaded', () => {
  renderPage(location.pathname);
});
