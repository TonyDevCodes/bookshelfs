// ==========================================================
// BookShelf — liked-books store
//
// A thin wrapper over localStorage holding the set of book ids the reader
// has liked, persisted as a JSON array under one key (mirroring how the
// theme choice is stored). Reads tolerate a missing, malformed, or
// non-array value by treating it as "nothing liked", and no function
// throws to its caller — a blocked or full localStorage just means the
// like won't survive a reload.
// ==========================================================

const STORAGE_KEY = 'bookshelf-liked-books';

// Current liked ids as a fresh Set. Always reads through to localStorage so
// there is no cache to fall stale against other tabs or manual edits.
function readIds() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return new Set(); // localStorage unavailable (e.g. privacy mode)
  }

  if (raw == null) return new Set();

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === 'number'));
  } catch {
    return new Set(); // stored value isn't valid JSON
  }
}

function writeIds(idSet) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...idSet]));
  } catch {
    // Storage blocked or full: the Set returned to the caller still
    // reflects this change, it just won't persist across a reload.
  }
}

/** All liked book ids, as a Set. */
export function getLikedIds() {
  return readIds();
}

/** Whether the given book id is currently liked. */
export function isLiked(id) {
  return readIds().has(id);
}

/** Mark a book liked. Returns the updated Set of liked ids. */
export function like(id) {
  const ids = readIds();
  ids.add(id);
  writeIds(ids);
  return ids;
}

/** Remove a book's like. Returns the updated Set of liked ids. */
export function unlike(id) {
  const ids = readIds();
  ids.delete(id);
  writeIds(ids);
  return ids;
}

/** Flip a book's liked state. Returns the updated Set of liked ids. */
export function toggleLike(id) {
  const ids = readIds();
  if (ids.has(id)) {
    ids.delete(id);
  } else {
    ids.add(id);
  }
  writeIds(ids);
  return ids;
}
