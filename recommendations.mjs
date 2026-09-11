// ==========================================================
// BookShelf — recommendation engine
//
// Pure, dependency-free ranking of books a reader might enjoy next,
// scored by author and category overlap with the books they've liked.
// Both the browser (script.js) and the test suite import this module;
// it never touches the DOM, localStorage, or global book data — the
// caller passes the collection in.
// ==========================================================

// How strongly each kind of overlap counts toward a recommendation.
// AUTHOR_WEIGHT must stay greater than CATEGORY_WEIGHT so that a book by
// an author the reader has liked outranks a book that only shares a
// category. Tune these freely: the tests assert relative ordering, never
// the raw numbers.
const AUTHOR_WEIGHT = 3;
const CATEGORY_WEIGHT = 1;

// Default size of the "Recommended for you" list.
const DEFAULT_LIMIT = 4;

/**
 * Rank books a reader might enjoy next.
 *
 * @param {Array<{id:number, author:string, category:string, year?:number}>} books
 *        The full collection.
 * @param {Iterable<number>} [likedIds]  Ids of books the reader has liked;
 *        an array or a Set. Missing, empty, or unrecognised ids yield `[]`.
 * @param {{limit?:number}} [options]  `limit` defaults to DEFAULT_LIMIT.
 * @returns {Array} Books drawn from `books`, best match first. Never includes
 *          a liked book and never includes a book with no author or category
 *          overlap. May be shorter than `limit`; empty when nothing overlaps
 *          or nothing is liked.
 */
export function recommendBooks(books, likedIds, { limit = DEFAULT_LIMIT } = {}) {
  const likedIdSet = new Set(likedIds);
  const likedBooks = books.filter((book) => likedIdSet.has(book.id));

  if (likedBooks.length === 0) return [];

  const likedAuthorCounts = tally(likedBooks, (book) => book.author);
  const likedCategoryCounts = tally(likedBooks, (book) => book.category);

  const scored = [];
  for (const book of books) {
    if (likedIdSet.has(book.id)) continue;

    const authorOverlap = likedAuthorCounts.get(book.author) ?? 0;
    const categoryOverlap = likedCategoryCounts.get(book.category) ?? 0;
    const score = authorOverlap * AUTHOR_WEIGHT + categoryOverlap * CATEGORY_WEIGHT;

    if (score === 0) continue;
    scored.push({ book, score });
  }

  scored.sort(byScoreThenRecencyThenId);

  return scored.slice(0, Math.max(0, limit)).map((entry) => entry.book);
}

// Count how many items map to each key.
function tally(items, keyOf) {
  const counts = new Map();
  for (const item of items) {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

// Best score first; ties broken by newer book first, then lower id, so the
// same set of likes always produces the same ordering.
function byScoreThenRecencyThenId(a, b) {
  if (b.score !== a.score) return b.score - a.score;

  const yearA = a.book.year ?? 0;
  const yearB = b.book.year ?? 0;
  if (yearB !== yearA) return yearB - yearA;

  return a.book.id - b.book.id;
}
