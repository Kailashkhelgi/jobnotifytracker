const routes = {
  '/': { title: 'Dashboard', render: renderDashboard },
  '/dashboard': { title: 'Dashboard', render: renderDashboard },
  '/saved': { title: 'Saved', render: renderSaved },
  '/digest': { title: 'Digest', render: renderDigest },
  '/settings': { title: 'Settings', render: renderSettings },
  '/proof': { title: 'Proof', render: renderPlaceholder }
};

const appRoot = document.getElementById('app-root');
const navLinks = document.querySelectorAll('.nav-link');
const menuToggle = document.getElementById('mobile-menu-btn');
const navMenu = document.getElementById('nav-menu');

const jobModal = document.getElementById('job-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalDetails = document.getElementById('modal-details');

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
  renderPage(location.pathname);
}

function getPreferences() {
  const prefs = localStorage.getItem('jobTrackerPreferences');
  return prefs ? JSON.parse(prefs) : null;
}

function savePreferences(prefs) {
  localStorage.setItem('jobTrackerPreferences', JSON.stringify(prefs));
}

function calculateScore(job, prefs) {
  if (!prefs) return 0;
  let score = 0;

  if (prefs.roleKeywords && prefs.roleKeywords.trim() !== '') {
    const keywords = prefs.roleKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    const title = job.title.toLowerCase();
    if (keywords.some(k => title.includes(k))) score += 25;

    const desc = job.description.toLowerCase();
    if (keywords.some(k => desc.includes(k))) score += 15;
  }

  if (prefs.preferredLocations && prefs.preferredLocations.length> 0) {
    if (prefs.preferredLocations.includes(job.location)) score += 15;
  }

  if (prefs.preferredMode && prefs.preferredMode.length> 0) {
    if (prefs.preferredMode.includes(job.mode)) score += 10;
  }

  if (prefs.experienceLevel && job.experience === prefs.experienceLevel) {
    score += 10;
  }

  if (prefs.skills && prefs.skills.trim() !== '') {
    const userSkills = prefs.skills.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    const jobSkills = job.skills.map(s => s.toLowerCase());
    if (userSkills.some(s => jobSkills.includes(s))) score += 15;
  }

  if (job.postedDaysAgo <= 2) score += 5;

  if (job.source.toLowerCase() === 'linkedin') score += 5;

  return Math.min(score, 100);
}

// Global job state
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

function renderDigest(route) {
  const prefs = getPreferences();
  if (!prefs) {
    appRoot.innerHTML = `
      <div class="text-container">
        <h1>${route.title}</h1>
        <div class="banner" style="margin-top: var(--space-24);">Set preferences to generate a personalized digest.</div>
      </div>
    `;
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const digestKey = `jobTrackerDigest_${todayStr}`;

  const buildUI = () => {
    let digestJobs = JSON.parse(localStorage.getItem(digestKey));

    if (!digestJobs) {
      appRoot.innerHTML = `
        <div class="text-container">
          <h1>${route.title}</h1>
          <p style="margin: 0;">Demo Mode: Daily 9AM trigger simulated manually.</p>
          <button id="generate-digest-btn" class="btn btn-primary" style="margin-top: var(--space-24);">Generate Today's 9AM Digest (Simulated)</button>
        </div>
      `;
      document.getElementById('generate-digest-btn').addEventListener('click', () => {
        jobData.forEach(job => {
          job.matchScore = calculateScore(job, prefs);
        });

        let potentialJobs = jobData.filter(j => j.matchScore>= (prefs.minMatchScore || 40));
        potentialJobs.sort((a, b) => {
          if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
          return a.postedDaysAgo - b.postedDaysAgo;
        });

        const top10 = potentialJobs.slice(0, 10);
        localStorage.setItem(digestKey, JSON.stringify(top10));
        buildUI();
      });
      return;
    }

    if (digestJobs.length === 0) {
      appRoot.innerHTML = `
        <div class="text-container">
          <h1>${route.title}</h1>
          <div class="empty-state" style="margin-top: var(--space-24);">
            <h3>No Matches Today</h3>
            <p>No matching roles today. Check again tomorrow.</p>
          </div>
        </div>
      `;
      return;
    }

    const emailDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    let html = `
      <div class="text-container" style="max-width: 100%;">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; max-width: 720px; flex-wrap: wrap; gap: var(--space-16);">
          <div>
            <h1>${route.title}</h1>
            <p style="margin:0; font-size: 14px;">Demo Mode: Daily 9AM trigger simulated manually.</p>
          </div>
          <div style="display: flex; gap: var(--space-16);">
            <button id="copy-digest-btn" class="btn btn-secondary" style="height: 40px; font-size: 14px;">Copy Digest to Clipboard</button>
            <button id="email-draft-btn" class="btn btn-primary" style="height: 40px; font-size: 14px;">Create Email Draft</button>
          </div>
        </div>
        <div id="copy-msg" style="color: var(--success); font-weight: 500; display: none; margin-top: var(--space-8); max-width: 720px; text-align: right;">Copied to clipboard!</div>

        <div class="digest-email-wrapper" style="margin-top: var(--space-40);">
          <div class="digest-header">
            <h2 style="margin-bottom: var(--space-8);">Top 10 Jobs For You — 9AM Digest</h2>
            <p style="margin-bottom: 0; color: var(--text-muted);">${emailDate}</p>
          </div>
          
          <div class="digest-body">
            ${digestJobs.map((job, idx) => `
              <div class="digest-job">
                <div class="digest-job-number">${idx + 1}</div>
                <div style="flex: 1;">
                  <h3 style="margin-bottom: var(--space-8); font-size: 20px;">${job.title}</h3>
                  <div style="font-weight: 600; color: var(--text-muted); margin-bottom: var(--space-8);">${job.company}</div>
                  <div style="display: flex; flex-wrap: wrap; gap: var(--space-16); font-size: 14px; color: var(--text-muted); margin-bottom: var(--space-16);">
                    <span>📍 ${job.location}</span>
                    <span>💼 ${job.experience}</span>
                    <span style="color: var(--success); font-weight: 600;">Match: ${job.matchScore}%</span>
                  </div>
                  <a href="${job.applyUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="height: 40px; font-size: 14px; display: inline-flex;">Apply Now</a>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="digest-footer">
            <p style="margin-bottom: 0;">This digest was generated based on your preferences.</p>
          </div>
        </div>
      </div>
    `;

    appRoot.innerHTML = html;

    const plaintextDigest = digestJobs.map((j, i) => `${i + 1}. ${j.title} at ${j.company}\nLocation: ${j.location} | Match: ${j.matchScore}%\nApply: ${j.applyUrl}`).join('\n\n');
    const emailBody = `Here is your 9AM Job Digest for ${emailDate}:\n\n` + plaintextDigest + '\n\nThis digest was generated based on your preferences.';

    document.getElementById('copy-digest-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(emailBody).then(() => {
        const msg = document.getElementById('copy-msg');
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
      }).catch(e => {
        alert("Clipboard copy failed, please copy manually.");
      });
    });

    document.getElementById('email-draft-btn').addEventListener('click', () => {
      window.location.href = `mailto:?subject=My 9AM Job Digest&body=${encodeURIComponent(emailBody)}`;
    });
  };

  buildUI();
}

function renderSettings(route) {
  const prefs = getPreferences() || {
    roleKeywords: '',
    preferredLocations: [],
    preferredMode: [],
    experienceLevel: '',
    skills: '',
    minMatchScore: 40
  };

  const isLocSel = (loc) => prefs.preferredLocations.includes(loc) ? 'selected' : '';
  const isModeChk = (mode) => prefs.preferredMode.includes(mode) ? 'checked' : '';
  const isExpSel = (exp) => prefs.experienceLevel === exp ? 'selected' : '';

  appRoot.innerHTML = `
    <div class="text-container">
      <h1>${route.title}</h1>
      <p>Set your preferences to activate intelligent matching.</p>
      
      <div class="card" style="margin-top: var(--space-40);">
        <form id="preferences-form">
          <div class="form-group">
            <label class="form-label">Role Keywords (comma-separated)</label>
            <input type="text" id="pref-roles" class="form-control" placeholder="e.g. React, Developer, Intern" value="${prefs.roleKeywords}">
          </div>

          <div class="form-group">
            <label class="form-label">Preferred Locations (Multi-select)</label>
            <select id="pref-locations" class="form-control" multiple style="height: 120px;">
              <option value="Bangalore" ${isLocSel('Bangalore')}>Bangalore</option>
              <option value="Hyderabad" ${isLocSel('Hyderabad')}>Hyderabad</option>
              <option value="Pune" ${isLocSel('Pune')}>Pune</option>
              <option value="Chennai" ${isLocSel('Chennai')}>Chennai</option>
              <option value="Mumbai" ${isLocSel('Mumbai')}>Mumbai</option>
              <option value="Delhi NCR" ${isLocSel('Delhi NCR')}>Delhi NCR</option>
              <option value="Remote" ${isLocSel('Remote')}>Remote</option>
            </select>
            <p style="font-size: 14px; margin-top: var(--space-8); color: var(--text-muted);">Hold Ctrl (Windows) or Cmd (Mac) to select multiple.</p>
          </div>

          <div class="form-group">
            <label class="form-label">Preferred Mode</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" name="pref-mode" value="Remote" ${isModeChk('Remote')}> Remote
              </label>
              <label class="checkbox-label">
                <input type="checkbox" name="pref-mode" value="Hybrid" ${isModeChk('Hybrid')}> Hybrid
              </label>
              <label class="checkbox-label">
                <input type="checkbox" name="pref-mode" value="Onsite" ${isModeChk('Onsite')}> Onsite
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Experience Level</label>
            <select id="pref-exp" class="form-control">
              <option value="" ${isExpSel('')}>Any</option>
              <option value="Fresher" ${isExpSel('Fresher')}>Fresher</option>
              <option value="0-1" ${isExpSel('0-1')}>0-1 Years</option>
              <option value="1-3" ${isExpSel('1-3')}>1-3 Years</option>
              <option value="3-5" ${isExpSel('3-5')}>3-5 Years</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Your Skills (comma-separated)</label>
            <input type="text" id="pref-skills" class="form-control" placeholder="e.g. Java, Python, React" value="${prefs.skills}">
          </div>

          <div class="form-group">
            <label class="form-label">Minimum Match Score Threshold: <span id="score-val">${prefs.minMatchScore}</span></label>
            <input type="range" id="pref-score" min="0" max="100" value="${prefs.minMatchScore}" onchange="document.getElementById('score-val').innerText=this.value">
          </div>

          <div style="display: flex; align-items: center; gap: var(--space-16); margin-top: var(--space-24);">
            <button type="submit" class="btn btn-primary">Save Preferences</button>
            <span id="save-msg" style="color: var(--success); font-weight: 500; display: none;">Saved!</span>
          </div>
        </form>
      </div>
    </div>
    `;

  document.getElementById('preferences-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const roleKeywords = document.getElementById('pref-roles').value;

    const locSelect = document.getElementById('pref-locations');
    const preferredLocations = Array.from(locSelect.selectedOptions).map(o => o.value);

    const modeCheckboxes = document.querySelectorAll('input[name="pref-mode"]:checked');
    const preferredMode = Array.from(modeCheckboxes).map(c => c.value);

    const experienceLevel = document.getElementById('pref-exp').value;
    const skills = document.getElementById('pref-skills').value;
    const minMatchScore = parseInt(document.getElementById('pref-score').value, 10);

    const newPrefs = { roleKeywords, preferredLocations, preferredMode, experienceLevel, skills, minMatchScore };
    savePreferences(newPrefs);

    if (typeof jobData !== 'undefined') {
      jobData.forEach(job => {
        job.matchScore = calculateScore(job, newPrefs);
      });
    }

    const msg = document.getElementById('save-msg');
    msg.style.display = 'inline';
    setTimeout(() => { msg.style.display = 'none'; }, 2000);
  });
}

function renderJobCard(job, isSaved) {
  const prefs = getPreferences();
  let scoreBadgeHtml = '';

  if (prefs) {
    const score = job.matchScore !== undefined ? job.matchScore : calculateScore(job, prefs);
    let scoreClass = 'score-poor';
    if (score>= 80) scoreClass = 'score-high';
    else if (score>= 60) scoreClass = 'score-medium';
    else if (score>= 40) scoreClass = 'score-low';

    scoreBadgeHtml = `<div class="score-badge ${scoreClass}"> Match: ${score}%</div> `;
  }

  return `
    <div class="job-card">
      <div class="job-header" style="display:flex; justify-content:space-between; align-items:flex-start; gap: var(--space-8);">
        <div>
          <h3 class="job-title">${job.title}</h3>
          <div class="job-company">${job.company}</div>
        </div>
        ${scoreBadgeHtml}
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
  const prefs = getPreferences();

  const q = document.getElementById('filter-keyword').value.toLowerCase();
  const loc = document.getElementById('filter-location').value;
  const mode = document.getElementById('filter-mode').value;
  const exp = document.getElementById('filter-exp').value;
  const src = document.getElementById('filter-source').value;
  const sort = document.getElementById('filter-sort').value;

  const matchesOnlyObj = document.getElementById('filter-matches-only');
  const showMatchesOnly = matchesOnlyObj ? matchesOnlyObj.checked : false;

  currentJobs = jobData.filter(job => {
    const matchKeyword = job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q);
    const matchLoc = loc === '' || job.location === loc || (loc === 'Other' && !['Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Mumbai', 'Delhi NCR', 'Remote'].includes(job.location));
    const matchMode = mode === '' || job.mode === mode;
    const matchExp = exp === '' || job.experience === exp;
    const matchSrc = src === '' || job.source === src;

    let matchThreshold = true;
    if (showMatchesOnly && prefs) {
      matchThreshold = job.matchScore>= (prefs.minMatchScore || 40);
    }

    return matchKeyword && matchLoc && matchMode && matchExp && matchSrc && matchThreshold;
  });

  if (sort === 'latest') {
    currentJobs.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  } else if (sort === 'score' && prefs) {
    currentJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  } else if (sort === 'salary') {
    const extract = (str) => {
      let val = 0;
      const match = str.match(/(\d+)/);
      if (match) {
        val = parseInt(match[1]);
        if (str.toLowerCase().includes('lpa')) val *= 100000;
        if (str.toLowerCase().includes('k')) val *= 1000;
      }
      return val;
    };
    currentJobs.sort((a, b) => extract(b.salaryRange) - extract(a.salaryRange));
  }

  renderJobList();
}

function renderJobList() {
  const container = document.getElementById('jobs-container');
  const savedIds = getSavedJobIds();

  if (currentJobs.length === 0) {
    container.innerHTML = `
    <div class="empty-state">
        <h3>No Roles Match Your Criteria</h3>
        <p>Adjust your filters, lower your threshold, or update your preferences.</p>
      </div> `;
  } else {
    container.innerHTML = `
    <div class="jobs-grid">
      ${currentJobs.map(job => renderJobCard(job, savedIds.includes(job.id))).join('')}
      </div>
    `;
  }
}

function renderDashboard(route) {
  const prefs = getPreferences();

  if (prefs) {
    jobData.forEach(job => {
      job.matchScore = calculateScore(job, prefs);
    });
  }

  currentJobs = [...jobData];

  let bannerHtml = '';
  if (!prefs) {
    bannerHtml = `
    <div class="banner">
      Set your preferences in Settings to activate intelligent matching.
      </div>
    `;
  }

  let toggleHtml = '';
  if (prefs) {
    toggleHtml = `
    <div style = "display: flex; align-items: center; gap: var(--space-8); margin-bottom: var(--space-16);">
      <input type="checkbox" id="filter-matches-only" style="width:16px; height:16px; cursor:pointer;">
        <label for="filter-matches-only" style="font-weight: 500; cursor:pointer;">Show only jobs above my match threshold (${prefs.minMatchScore})</label>
      </div>
  `;
  }

  appRoot.innerHTML = `
    <div class="text-container">
      <h1>${route.title}</h1>
      <p>Discover realistic job opportunities tailored to your preferences.</p>
    </div>

    ${bannerHtml}
    ${toggleHtml}

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
          <option value="score">Match Score</option>
          <option value="salary">Salary (High to Low)</option>
        </select>
      </div>
    </div>

    <div id="jobs-container"></div>
  `;

  document.getElementById('filter-keyword').addEventListener('input', handleFilters);
  document.getElementById('filter-location').addEventListener('change', handleFilters);
  document.getElementById('filter-mode').addEventListener('change', handleFilters);
  document.getElementById('filter-exp').addEventListener('change', handleFilters);
  document.getElementById('filter-source').addEventListener('change', handleFilters);
  document.getElementById('filter-sort').addEventListener('change', handleFilters);
  if (prefs) {
    document.getElementById('filter-matches-only').addEventListener('change', handleFilters);
  }

  handleFilters();
}

function renderSaved(route) {
  const savedIds = getSavedJobIds();
  const savedJobs = jobData.filter(j => savedIds.includes(j.id));

  const prefs = getPreferences();
  if (prefs) {
    savedJobs.forEach(job => {
      job.matchScore = calculateScore(job, prefs);
    });
  }

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
      </div> `;
  } else {
    container.innerHTML = `
    <div class="jobs-grid">
      ${savedJobs.map(job => renderJobCard(job, true)).join('')}
      </div>
    `;
  }
}

function renderPage(path) {
  let routeParams = routes[path];

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

function openModal(id) {
  const job = jobData.find(j => j.id === id);
  if (!job) return;

  const savedIds = getSavedJobIds();
  const isSaved = savedIds.includes(job.id);

  modalDetails.innerHTML = `
    <h2 style = "margin-bottom: var(--space-8); line-height: 1.2;"> ${job.title}</h2>
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

document.addEventListener('click', e => {
  if (e.target.matches('[data-route]')) {
    e.preventDefault();
    const url = e.target.getAttribute('href');
    navigateTo(url);
    navMenu.classList.remove('open');
  }

  if (e.target.matches('.action-view')) {
    const id = e.target.getAttribute('data-id');
    openModal(id);
  }

  if (e.target.matches('.action-save')) {
    const id = e.target.getAttribute('data-id');
    toggleSaveJob(id);

    if (jobModal.classList.contains('open')) {
      openModal(id);
    }
  }
});

modalCloseBtn.addEventListener('click', closeModal);
jobModal.addEventListener('click', e => {
  if (e.target === jobModal) closeModal();
});

window.addEventListener('popstate', () => {
  renderPage(location.pathname);
});

menuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
});

document.addEventListener('DOMContentLoaded', () => {
  renderPage(location.pathname);
});
