const routes = {
  '/': { title: 'Dashboard', render: renderDashboard },
  '/dashboard': { title: 'Dashboard', render: renderDashboard },
  '/saved': { title: 'Saved', render: renderSaved },
  '/digest': { title: 'Digest', render: renderPlaceholder },
  '/settings': { title: 'Settings', render: renderPlaceholder },
  '/proof': { title: 'Proof', render: renderPlaceholder }
};

const appRoot = document.getElementById('app-root');
const navLinks = document.querySelectorAll('.nav-link');
const menuToggle = document.getElementById('mobile-menu-btn');
const navMenu = document.getElementById('nav-menu');

// Modal Elements
const jobModal = document.getElementById('job-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalDetails = document.getElementById('modal-details');

// Local Storage Helper
function getSavedJobIds() {
  return JSON.parse(localStorage.getItem('savedJobIds') || '[]');
}

function toggleSaveJob(id) {
  let savedIds = getSavedJobIds();
  if (savedIds.includes(id)) {
    savedIds = savedIds.filter(savedId => savedId !== id);
  } else {
    savedIds.push(id);
  }
  localStorage.setItem('savedJobIds', JSON.stringify(savedIds));
  // Render current view to reflect changes (e.g. changing "Save" to "Saved")
  renderPage(location.pathname);
}

// Global job state (to hold filtering)
let currentJobs = [...jobData];

// Render Methods
function renderPlaceholder(route) {
  appRoot.innerHTML = `
    <div class="text-container">
      <h1>${route.title}</h1>
      <p>This section will be built in the next step.</p>
    </div>
  `;
}

function renderJobCard(job, isSaved) {
  return `
    <div class="job-card">
      <div class="job-header">
        <h3 class="job-title">${job.title}</h3>
        <div class="job-company">${job.company}</div>
      </div>
      
      <div class="job-meta">
        <span class="job-badge">${job.location} • ${job.mode}</span>
        <span class="job-badge">Exp: ${job.experience}</span>
        <span class="job-badge">${job.salaryRange}</span>
        <span class="job-badge">${job.source}</span>
        <span class="job-badge" style="color: var(--accent);">${job.postedDaysAgo === 0 ? 'Today' : job.postedDaysAgo + ' days ago'}</span>
      </div>

      <div class="job-actions">
        <button class="btn btn-secondary action-view" data-id="${job.id}">View</button>
        <button class="btn btn-secondary action-save" data-id="${job.id}">${isSaved ? 'Unsave' : 'Save'}</button>
        <a href="${job.applyUrl}" target="_blank" class="btn btn-primary" rel="noopener noreferrer">Apply</a>
      </div>
    </div>
  `;
}

function handleFilters() {
  const q = document.getElementById('filter-keyword').value.toLowerCase();
  const loc = document.getElementById('filter-location').value;
  const mode = document.getElementById('filter-mode').value;
  const exp = document.getElementById('filter-exp').value;
  const src = document.getElementById('filter-source').value;
  const sort = document.getElementById('filter-sort').value;

  currentJobs = jobData.filter(job => {
    const matchKeyword = job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q);
    const matchLoc = loc === '' || job.location === loc || (loc === 'Other' && !['Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Mumbai', 'Delhi NCR', 'Remote'].includes(job.location));
    const matchMode = mode === '' || job.mode === mode;
    const matchExp = exp === '' || job.experience === exp;
    const matchSrc = src === '' || job.source === src;

    return matchKeyword && matchLoc && matchMode && matchExp && matchSrc;
  });

  if (sort === 'latest') {
    currentJobs.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  } else if (sort === 'oldest') {
    currentJobs.sort((a, b) => b.postedDaysAgo - a.postedDaysAgo);
  }

  renderJobList();
}

function renderJobList() {
  const container = document.getElementById('jobs-container');
  const savedIds = getSavedJobIds();

  if (currentJobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Mathing Jobs</h3>
        <p>No jobs match your search. Try adjusting the filters.</p>
      </div>`;
  } else {
    container.innerHTML = `
      <div class="jobs-grid">
        ${currentJobs.map(job => renderJobCard(job, savedIds.includes(job.id))).join('')}
      </div>
    `;
  }
}

function renderDashboard(route) {
  // Reset filtering data
  currentJobs = [...jobData];

  appRoot.innerHTML = `
    <div class="text-container">
      <h1>${route.title}</h1>
      <p>Discover realistic job opportunities tailored to your preferences.</p>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group" style="flex: 2;">
        <label class="filter-label">Search</label>
        <input type="text" id="filter-keyword" class="filter-input" placeholder="Keyword or Company">
      </div>
      <div class="filter-group">
        <label class="filter-label">Location</label>
        <select id="filter-location" class="filter-select">
          <option value="">Any</option>
          <option value="Bangalore">Bangalore</option>
          <option value="Hyderabad">Hyderabad</option>
          <option value="Pune">Pune</option>
          <option value="Chennai">Chennai</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Delhi NCR">Delhi NCR</option>
          <option value="Remote">Remote</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Mode</label>
        <select id="filter-mode" class="filter-select">
          <option value="">Any</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Onsite">Onsite</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Experience</label>
        <select id="filter-exp" class="filter-select">
          <option value="">Any</option>
          <option value="Fresher">Fresher</option>
          <option value="0-1">0-1 Years</option>
          <option value="1-3">1-3 Years</option>
          <option value="3-5">3-5 Years</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Source</label>
        <select id="filter-source" class="filter-select">
          <option value="">Any</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Naukri">Naukri</option>
          <option value="Indeed">Indeed</option>
          <option value="Wellfound">Wellfound</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Sort</label>
        <select id="filter-sort" class="filter-select">
          <option value="latest">Latest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>

    <div id="jobs-container"></div>
  `;

  // Attach filter event listeners
  document.getElementById('filter-keyword').addEventListener('input', handleFilters);
  document.getElementById('filter-location').addEventListener('change', handleFilters);
  document.getElementById('filter-mode').addEventListener('change', handleFilters);
  document.getElementById('filter-exp').addEventListener('change', handleFilters);
  document.getElementById('filter-source').addEventListener('change', handleFilters);
  document.getElementById('filter-sort').addEventListener('change', handleFilters);

  renderJobList();
}

function renderSaved(route) {
  const savedIds = getSavedJobIds();
  const savedJobs = jobData.filter(j => savedIds.includes(j.id));

  appRoot.innerHTML = `
    <div class="text-container">
      <h1>${route.title}</h1>
      <p>Review and act continuously on your manually saved opportunities.</p>
    </div>
    <div id="jobs-container"></div>
  `;

  const container = document.getElementById('jobs-container');

  if (savedJobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Saved Jobs</h3>
        <p>You haven't saved any opportunities yet. Explore the Dashboard to get started.</p>
      </div>`;
  } else {
    container.innerHTML = `
      <div class="jobs-grid">
        ${savedJobs.map(job => renderJobCard(job, true)).join('')}
      </div>
    `;
  }
}

// Core router logic
function renderPage(path) {
  let routeParams = routes[path];

  // Implicitly handle unknown routes to 404 setup
  if (!routeParams) {
    appRoot.innerHTML = `
        <div class="text-container">
        <h1>Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        </div>
    `;
  } else {
    routeParams.render(routeParams);
  }

  updateActiveLink(path);
}

// Active navigation handler
function updateActiveLink(path) {
  navLinks.forEach(link => {
    link.classList.remove('active');
    const linkPath = link.getAttribute('href');
    if (linkPath === path || (path === '/' && linkPath === '/dashboard')) {
      link.classList.add('active');
    }
  });
}

function navigateTo(url) {
  history.pushState(null, null, url);
  renderPage(location.pathname);
}

// Modal handling logic
function openModal(id) {
  const job = jobData.find(j => j.id === id);
  if (!job) return;

  const savedIds = getSavedJobIds();
  const isSaved = savedIds.includes(job.id);

  modalDetails.innerHTML = `
    <h2 style="margin-bottom: var(--space-8); line-height: 1.2;">${job.title}</h2>
    <div style="font-weight: 600; font-size: 18px; color: var(--text-muted); margin-bottom: var(--space-24);">${job.company}</div>
    
    <div class="job-meta">
      <span class="job-badge">${job.location} • ${job.mode}</span>
      <span class="job-badge">Exp: ${job.experience}</span>
      <span class="job-badge">${job.salaryRange}</span>
      <span class="job-badge">${job.postedDaysAgo === 0 ? 'Today' : job.postedDaysAgo + ' days ago'}</span>
    </div>

    <div class="modal-body">
      <h4>Description</h4>
      <p style="margin-top: var(--space-8); white-space: pre-line; color: var(--text);">${job.description}</p>
      
      <h4 style="margin-top: var(--space-24);">Required Skills</h4>
      <div class="modal-skills">
        ${job.skills.map(skill => `<span class="job-badge">${skill}</span>`).join('')}
      </div>
    </div>
    
    <div class="job-actions" style="margin-top: var(--space-40);">
        <button class="btn btn-secondary action-save" data-id="${job.id}">${isSaved ? 'Unsave' : 'Save'}</button>
        <a href="${job.applyUrl}" target="_blank" class="btn btn-primary" rel="noopener noreferrer">Apply Now</a>
    </div>
  `;
  jobModal.classList.add('open');
}

function closeModal() {
  jobModal.classList.remove('open');
}

// Global Event Delegation for Dynamic Elements
document.addEventListener('click', e => {
  // Navigation intercepter
  if (e.target.matches('[data-route]')) {
    e.preventDefault();
    const url = e.target.getAttribute('href');
    navigateTo(url);
    navMenu.classList.remove('open');
  }

  // Job Action: View
  if (e.target.matches('.action-view')) {
    const id = e.target.getAttribute('data-id');
    openModal(id);
  }

  // Job Action: Save
  if (e.target.matches('.action-save')) {
    const id = e.target.getAttribute('data-id');
    toggleSaveJob(id);

    // If modal is open, re-render it to update the button status inside modal as well
    if (jobModal.classList.contains('open')) {
      openModal(id);
    }
  }
});

// Modal close events
modalCloseBtn.addEventListener('click', closeModal);
jobModal.addEventListener('click', e => {
  if (e.target === jobModal) closeModal();
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
