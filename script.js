// ==========================================================
// BookShelf — script.js (Step 2: render + search/filter)
// ==========================================================

const booksGrid = document.getElementById('booksGrid');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

const FALLBACK_COVER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">
     <rect width="100%" height="100%" fill="#cfcac0"/>
     <text x="50%" y="50%" font-size="16" text-anchor="middle" fill="#5f5f5f" font-family="sans-serif">No cover</text>
   </svg>`
);

function coverUrl(isbn) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

function createBookCard(book) {
  const card = document.createElement('article');
  card.className = 'book-card';
  card.dataset.id = book.id;

  card.innerHTML = `
    <img
      class="book-cover"
      src="${coverUrl(book.isbn)}"
      alt="Cover of ${book.title}"
      loading="lazy"
      onerror="this.onerror=null;this.src='${FALLBACK_COVER}';"
    >
    <div class="book-info">
      <p class="book-title">${book.title}</p>
      <p class="book-author">${book.author}</p>
      <div class="book-meta">
        <span class="book-category">${book.category}</span>
        <span class="book-year">${book.year}</span>
      </div>
    </div>
  `;

  return card;
}

function renderBooks(list) {
  booksGrid.innerHTML = '';

  if (list.length === 0) {
    noResults.hidden = false;
    return;
  }

  noResults.hidden = true;
  const fragment = document.createDocumentFragment();
  list.forEach(book => fragment.appendChild(createBookCard(book)));
  booksGrid.appendChild(fragment);
  observeCards();
}

// ===== Scroll fade-in animation (Intersection Observer) =====
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

function observeCards() {
  document.querySelectorAll('.book-card:not(.is-visible)').forEach(card => {
    cardObserver.observe(card);
  });
}

function populateCategories() {
  const categories = [...new Set(booksData.map(b => b.category))].sort();
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filtered = booksData.filter(book => {
    const matchesQuery =
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query);
    const matchesCategory =
      selectedCategory === 'all' || book.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  renderBooks(filtered);
}

let debounceTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(applyFilters, 150);
});

categoryFilter.addEventListener('change', applyFilters);

// ===== Init =====
populateCategories();
renderBooks(booksData);
document.getElementById('year').textContent = new Date().getFullYear();

// ==========================================================
// Dark / Light mode toggle
// ==========================================================
const themeToggle = document.getElementById('themeToggle');
const htmlEl = document.documentElement;

function setTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  localStorage.setItem('bookshelf-theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);

  themeToggle.style.animation = 'none';
  void themeToggle.offsetWidth; // force reflow to allow restart
  themeToggle.style.animation = 'spinIcon 0.4s ease';
});

// ==========================================================
// Book detail modal
// ==========================================================
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');

let lastFocusedElement = null;

function openModal(book) {
  modalContent.innerHTML = `
    <div class="modal-body">
      <img
        class="modal-cover"
        src="${coverUrl(book.isbn)}"
        alt="Cover of ${book.title}"
        onerror="this.onerror=null;this.src='${FALLBACK_COVER}';"
      >
      <div class="modal-details">
        <h2 id="modalTitle">${book.title}</h2>
        <p class="modal-author">${book.author}</p>
        <div class="modal-meta-row">
          <span class="book-category">${book.category}</span>
          <span class="book-year">${book.year}</span>
        </div>
        <p class="modal-description">${book.description}</p>
      </div>
    </div>
  `;

  lastFocusedElement = document.activeElement;
  modalOverlay.hidden = false;
  document.body.classList.add('modal-open');
  modalClose.focus();

  // trigger transition on next frame
  requestAnimationFrame(() => modalOverlay.classList.add('is-open'));
}

function closeModal() {
  modalOverlay.classList.remove('is-open');
  document.body.classList.remove('modal-open');
  if (lastFocusedElement) lastFocusedElement.focus();

  const finalizeClose = () => { modalOverlay.hidden = true; };
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    finalizeClose();
  } else {
    modalOverlay.addEventListener('transitionend', finalizeClose, { once: true });
  }
}

// Open modal when a book card is clicked
booksGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.book-card');
  if (!card) return;
  const book = booksData.find(b => b.id === Number(card.dataset.id));
  if (book) openModal(book);
});

// Close modal: X button
modalClose.addEventListener('click', closeModal);

// Close modal: click outside the modal box (on the overlay itself)
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Close modal: ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalOverlay.hidden) closeModal();
});

// ==========================================================
// Request a book — AJAX submit via fetch (no external library)
// ==========================================================
const requestForm = document.getElementById('requestForm');
const formSuccess = document.getElementById('formSuccess');
const formError = document.getElementById('formError');
const submitBtn = requestForm.querySelector('button[type="submit"]');

requestForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  formSuccess.hidden = true;
  formError.hidden = true;
  submitBtn.disabled = true;
  const originalBtnText = submitBtn.textContent;
  submitBtn.textContent = 'Sending...';

  try {
    const response = await fetch(requestForm.action, {
      method: 'POST',
      body: new FormData(requestForm),
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      requestForm.reset();
      formSuccess.hidden = false;
    } else {
      const data = await response.json().catch(() => null);
      const message = data && data.errors
        ? data.errors.map(err => err.message).join(', ')
        : 'Something went wrong. Please try again.';
      formError.textContent = message;
      formError.hidden = false;
    }
  } catch (err) {
    formError.textContent = 'Network error. Please check your connection and try again.';
    formError.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});
