// ==========================================================
// BookShelf — Book data
// Covers are fetched from Open Library Covers API using ISBN13.
// If a cover fails to load, script.js falls back to a placeholder.
// ==========================================================

export const booksData = [
  {
    id: 1,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: "Fiction",
    year: 1960,
    isbn: "9780061120084",
    description: "A young girl in the American South witnesses her father defend a black man falsely accused of a crime, learning about justice, courage and compassion along the way."
  },
  {
    id: 2,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Fiction",
    year: 1925,
    isbn: "9780743273565",
    description: "A mysterious millionaire's obsession with a lost love unfolds against the glittering, hollow backdrop of the Jazz Age."
  },
  {
    id: 3,
    title: "1984",
    author: "George Orwell",
    category: "Sci-Fi",
    year: 1949,
    isbn: "9780451524935",
    description: "In a totalitarian future ruled by constant surveillance, one man dares to think for himself and pays the price."
  },
  {
    id: 4,
    title: "Dune",
    author: "Frank Herbert",
    category: "Sci-Fi",
    year: 1965,
    isbn: "9780441013593",
    description: "On the desert planet Arrakis, a young heir becomes entangled in prophecy, politics and the fight over the universe's most valuable resource."
  },
  {
    id: 5,
    title: "Neuromancer",
    author: "William Gibson",
    category: "Sci-Fi",
    year: 1984,
    isbn: "9780441569595",
    description: "A washed-up computer hacker is hired for one last job that plunges him into the dangerous world of artificial intelligence and cyberspace."
  },
  {
    id: 6,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    category: "Fantasy",
    year: 1937,
    isbn: "9780547928227",
    description: "A reluctant hobbit is swept into an epic quest to reclaim a stolen dwarf kingdom from a fearsome dragon."
  },
  {
    id: 7,
    title: "A Game of Thrones",
    author: "George R.R. Martin",
    category: "Fantasy",
    year: 1996,
    isbn: "9780553103540",
    description: "Noble families scheme and battle for control of the Iron Throne while an ancient evil stirs beyond the Wall."
  },
  {
    id: 8,
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    category: "Fantasy",
    year: 2007,
    isbn: "9780756404741",
    description: "A legendary figure recounts the true story of his life, from a gifted boy in a traveling troupe to the most notorious wizard of his time."
  },
  {
    id: 9,
    title: "Educated",
    author: "Tara Westover",
    category: "Non-Fiction",
    year: 2018,
    isbn: "9780399590504",
    description: "A woman raised in a strict, isolated household in rural Idaho pursues an education that ultimately transforms her entire world."
  },
  {
    id: 10,
    title: "Gone Girl",
    author: "Gillian Flynn",
    category: "Mystery",
    year: 2012,
    isbn: "9780307588371",
    description: "When a woman vanishes on her wedding anniversary, her husband becomes the prime suspect in a story full of twists and unreliable narrators."
  },
  {
    id: 11,
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Fiction",
    year: 1988,
    isbn: "9780062315007",
    description: "A young Andalusian shepherd travels to the Egyptian pyramids in search of treasure, discovering along the way that the real journey is one of self-discovery."
  },
  {
    id: 12,
    title: "The Da Vinci Code",
    author: "Dan Brown",
    category: "Mystery",
    year: 2003,
    isbn: "9780307474278",
    description: "A Harvard symbologist is drawn into a deadly trail of clues hidden in the works of Leonardo da Vinci, unraveling a secret the Church has protected for centuries."
  }
];
