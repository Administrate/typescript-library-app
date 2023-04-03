const validChars = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
] as const;

// index the type of our array to get a union of all the array elements
// this allows us to use the array at runtime and derive the type at compile time
type HEX_CHAR = typeof validChars[number];
export type HEX_PREFIX = `${HEX_CHAR}${HEX_CHAR}`;

export type BookId = `${HEX_PREFIX}-${number}`;

export const makeBookId = (hex: HEX_PREFIX, num: number): BookId =>
  `${hex}-${num}`;

export interface Book {
  id: BookId;
  title: string;
  author: string;
}

export const makeBook = (id: BookId, title: string, author: string): Book => ({
  id,
  title,
  author,
});

export function cleanString(input: string) {
  return input.trim().toLowerCase();
}

const HEX_ERROR_MESSAGE = "Invalid hex prefix, please provide two hex characters (0-9a-f)";

export function isHex(input: any): input is HEX_PREFIX {
  if (typeof input !== "string") {
    throw new Error(HEX_ERROR_MESSAGE);
  }

  if (input.length !== 2) {
    throw new Error(HEX_ERROR_MESSAGE);
  }

  const trimmed = cleanString(input);

  if (!validChars.includes(trimmed[0] as any)) {
    throw new Error(HEX_ERROR_MESSAGE);
  }

  if (!validChars.includes(trimmed[1] as any)) {
    throw new Error(HEX_ERROR_MESSAGE);
  }

  return true;
}

export function cleanHex(input: HEX_PREFIX) {
  return cleanString(input) as HEX_PREFIX;
}

const ID_ERROR_MESSAGE = "Invalid id prefix, please provide two hex characters (0-9a-f), a dash '-' and a positive integer.";

export function isId(input: any): input is BookId {
  if (typeof input !== "string") {
    throw new Error(ID_ERROR_MESSAGE);
  }

  if (input.length < 3) {
    throw new Error(ID_ERROR_MESSAGE);
  }

  if (!input.includes("-")) {
    throw new Error(ID_ERROR_MESSAGE);
  }

  const [hex, num] = cleanString(input).split("-");
  if (!hex || !num) {
    throw new Error(ID_ERROR_MESSAGE);
  }

  if (!isHex(hex)) {
    throw new Error(ID_ERROR_MESSAGE);
  }

  return isPositiveInt(num);
}

export function cleanId(input: BookId) {
  return cleanString(input) as BookId;
}

// We can include 0
export function isPositiveInt(input: any): input is number {
  if (typeof input === "string") {
    const int = parseInt(cleanString(input));

    if (int >= 0) {
      return true;
    }
  }

  throw new Error("Must provide a positive integer");
}

const checkedOutBooks = new Set<BookId>();
const bookList: Book[] = [];

export const Inventory = {
  add(book: Book) {
    bookList.push(book);
  },
  count() {
    return bookList.length;
  },
  isCheckedOut(id: BookId) {
    return checkedOutBooks.has(id);
  },
  checkoutById(id: BookId) {
    checkedOutBooks.add(id);
  },
  returnById(id: BookId) {
    checkedOutBooks.delete(id);
  },
  search(searchTerm: string) {
    const searchPattern = new RegExp(searchTerm, "i");

    const foundBook = bookList.find((book) => {
      const titleMatch = book.title.match(searchPattern);
      const authorMatch = book.author.match(searchPattern);
      const idMatch = book.id.match(searchPattern);

      if (idMatch) {
        return true;
      }
      if (titleMatch) {
        return true;
      }
      if (authorMatch) {
        return true;
      }
    });

    if (foundBook) {
      return foundBook;
    }

    return null;
  },
};
