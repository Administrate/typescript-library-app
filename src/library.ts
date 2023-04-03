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

export function isHex(input: any): input is HEX_PREFIX {
  if (typeof input !== "string") {
    return false;
  }

  if (input.length !== 2) {
    return false;
  }

  if (!validChars.includes(input[0] as any)) {
    return false;
  }

  if (!validChars.includes(input[1] as any)) {
    return false;
  }

  return true;
}

export function isId(input: any): input is BookId {
  if (typeof input !== "string") {
    return false;
  }

  if (input.length < 3) {
    return false;
  }

  if (!input.includes("-")) {
    return false;
  }

  const [hex, num] = input.split("-");
  if (!hex || !num) {
    return false;
  }

  if (!isHex(hex)) {
    return false;
  }

  return isPositiveInt(num);
}

export function isPositiveInt(input: any): input is number {
  if (typeof input === "string") {
    const int = parseInt(input);

    if (int > 0) {
      return true;
    }
  }

  return false;
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
