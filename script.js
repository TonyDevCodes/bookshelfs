// ==========================================================
// BookShelf — script.js (render + search/filter + recommendations)
// ==========================================================

import { booksData } from './books-data.js';
import { recommendBooks } from './recommendations.mjs';
import { getLikedIds, isLiked, toggleLike } from './liked-books.mjs';

const booksGrid = document.getElementById('booksGrid');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const recommendationsSection = document.getElementById('recommendations');
const recommendationsGrid = document.getElementById('recommendationsGrid');

const FALLBACK_COVER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">
     <rect width="100%" height="100%" fill="#cfcac0"/>
     <text x="50%" y="50%" font-size="16" text-anchor="middle" fill="#5f5f5f" font-family="sans-serif">No cover</text>
   </svg>`
);

function coverUrl(isbn) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

// Heart toggle shown in the corner of every book card. The glyph itself is
// drawn in CSS from aria-pressed, so refreshing state only touches attributes.
function likeButtonMarkup(book) {
  const liked = isLiked(book.id);
  return `
    <button
      class="like-btn"
      type="button"
      data-book-id="${book.id}"
      aria-pressed="${liked}"
      aria-label="${liked ? 'Unlike' : 'Like'} ${book.title}"
    ></button>
  `;
}

function createBookCard(book) {
  const card = document.createElement('article');
  card.className = 'book-card';
  card.dataset.id = book.id;

  card.innerHTML = `
    ${likeButtonMarkup(book)}
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

// ==========================================================
// Recommended for you
// ==========================================================

// Skip a re-render when the picks haven't actually changed, so liking a book
// that doesn't shift the list doesn't re-run the card fade-in.
let renderedPickIds = null;

function renderRecommendations() {
  const picks = recommendBooks(booksData, getLikedIds());
  const pickIds = picks.map(book => book.id).join(',');
  if (pickIds === renderedPickIds) return;
  renderedPickIds = pickIds;

  recommendationsGrid.innerHTML = '';

  if (picks.length === 0) {
    recommendationsSection.hidden = true;
    return;
  }

  const fragment = document.createDocumentFragment();
  picks.forEach(book => fragment.appendChild(createBookCard(book)));
  recommendationsGrid.appendChild(fragment);
  recommendationsSection.hidden = false;
  observeCards();
}

// Toggle a like from anywhere (grid card, recommendation card, or modal),
// then refresh every visible control for that book and the picks list.
function applyLikeToggle(bookId) {
  toggleLike(bookId);
  syncLikeControls(bookId);
  renderRecommendations();
}

function syncLikeControls(bookId) {
  const book = booksData.find(b => b.id === bookId);
  const liked = isLiked(bookId);

  document.querySelectorAll(`.like-btn[data-book-id="${bookId}"]`).forEach(btn => {
    btn.setAttribute('aria-pressed', String(liked));
    if (book) btn.setAttribute('aria-label', `${liked ? 'Unlike' : 'Like'} ${book.title}`);
  });

  const modalBtn = modalContent.querySelector(`.modal-like[data-book-id="${bookId}"]`);
  if (modalBtn) {
    modalBtn.setAttribute('aria-pressed', String(liked));
    modalBtn.textContent = liked ? '♥ Liked' : '♡ Like this book';
  }
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
renderRecommendations();
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
  const liked = isLiked(book.id);
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
        <button
          class="modal-like"
          type="button"
          data-book-id="${book.id}"
          aria-pressed="${liked}"
        >${liked ? '♥ Liked' : '♡ Like this book'}</button>
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

// Clicks inside either grid: a like button toggles the like; anywhere else
// on a card opens the detail modal.
function handleGridClick(e) {
  const likeBtn = e.target.closest('.like-btn');
  if (likeBtn) {
    applyLikeToggle(Number(likeBtn.dataset.bookId));
    return;
  }

  const card = e.target.closest('.book-card');
  if (!card) return;
  const book = booksData.find(b => b.id === Number(card.dataset.id));
  if (book) openModal(book);
}

booksGrid.addEventListener('click', handleGridClick);
recommendationsGrid.addEventListener('click', handleGridClick);

// Like button inside the open modal.
modalContent.addEventListener('click', (e) => {
  const likeBtn = e.target.closest('.modal-like');
  if (likeBtn) applyLikeToggle(Number(likeBtn.dataset.bookId));
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
