import cli, { InputQuestion, ListQuestion } from "inquirer";
import {
  BookId,
  isHex,
  isId,
  isPositiveInt,
  makeBookId,
  makeBook,
  Inventory,
} from "./library.js";
import chalk from "chalk";

function successMessage(message: string) {
  console.log(chalk.green(message));
}

function warningMessage(message: string) {
  console.log(chalk.magenta(message));
}

const ACTIONS = [
  "Add a Book",
  "Checkout a Book",
  "Return a Book",
  "Check Book State",
  "Search for a Book",
  "Count Books",
  "Clear Terminal",
  "Exit",
] as const;
type ACTION_TYPES = (typeof ACTIONS)[number];

function dispatch(actionName: ACTION_TYPES): Promise<void> {
  switch (actionName) {
    case "Add a Book":
      return addBook();
    case "Checkout a Book":
      return checkoutBook();
    case "Return a Book":
      return returnBook();
    case "Check Book State":
      return checkBookState();
    case "Search for a Book":
      return searchForBook();
    case "Count Books":
      successMessage(`Library has ${Inventory.count()} books`);
      return Promise.resolve();
    case "Clear Terminal":
      console.clear();
      return Promise.resolve();
    case "Exit":
      successMessage("Good bye 👋  (your library inventory will be purged)");
      process.exit(0);
  }
}

const BOOK_ID_HEX_PROMPT: InputQuestion<{ idPrefix: string }> = {
  type: "input",
  name: "idPrefix",
  message: "Book ID Prefix: ",
  validate(input: string) {
    const cleanInput = input.trim().toLowerCase();
    if (isHex(cleanInput)) {
      return true;
    }

    throw new Error(
      "Invalid hex prefix, please provide two hex characters (0-9a-f)"
    );
  },
};

const BOOK_ID_PROMPT: InputQuestion<{ id: string }> = {
  type: "input",
  name: "id",
  message: "Book ID Number: ",
  validate(input: string) {
    if (isPositiveInt(input.trim())) {
      return true;
    }

    throw new Error("Invalid number, please pass a valid positive integer");
  },
};

const BOOK_TITLE_PROMPT: InputQuestion<{ title: string }> = {
  type: "input",
  name: "title",
  message: "Book Title: ",
};

const BOOK_AUTHOR_PROMPT: InputQuestion<{ author: string }> = {
  type: "input",
  name: "author",
  message: "Book Author Name: ",
};

async function addBook() {
  const answers = await cli.prompt<{
    title: string;
    author: string;
    id: string;
    idPrefix: string;
  }>([
    BOOK_ID_HEX_PROMPT,
    BOOK_ID_PROMPT,
    BOOK_TITLE_PROMPT,
    BOOK_AUTHOR_PROMPT,
  ]);

  const { idPrefix, id, title, author } = answers;

  const cleanPrefix = idPrefix.trim().toLowerCase();

  // we know this will pass because of the validation from the prompt,
  // but doing this gets us type narrowing from the type predicate
  if (isHex(cleanPrefix)) {
    Inventory.add(
      makeBook(
        makeBookId(cleanPrefix, parseInt(id.trim())),
        title.trim(),
        author.trim()
      )
    );
    successMessage(`${title} added.`);
  }
}

const CHECKOUT_PROMPT: InputQuestion<{ bookId: BookId }> = {
  type: "input",
  name: "bookId",
  message: "Book ID: ",
  validate: (givenId) => {
    if (!isId(givenId)) {
      throw new Error("You must pass two hex chars, a dash, and then a number");
    }

    return true;
  },
};

async function checkoutBook() {
  const { bookId } = await cli.prompt([CHECKOUT_PROMPT]);
  const cleanBookId = bookId.trim().toLowerCase() as BookId;

  if (Inventory.isCheckedOut(cleanBookId)) {
    warningMessage("Already checked out");
    return;
  }

  const result = Inventory.search(cleanBookId);
  if (result) {
    Inventory.checkoutById(cleanBookId);
    successMessage(`Checked out ${cleanBookId}`);
  } else {
    warningMessage(`Could not find ${cleanBookId}`);
  }
}

async function returnBook() {
  const { bookId } = await cli.prompt([CHECKOUT_PROMPT]);
  const cleanBookId = bookId.trim().toLowerCase() as BookId;

  if (!Inventory.isCheckedOut(cleanBookId)) {
    warningMessage("Already in stock");
    return;
  }

  const result = Inventory.search(cleanBookId);
  if (result) {
    Inventory.returnById(cleanBookId);
    successMessage(`Returned ${cleanBookId}`);
  } else {
    warningMessage(`Could not find ${cleanBookId}`);
  }
}

async function checkBookState() {
  const { bookId } = await cli.prompt([CHECKOUT_PROMPT]);
  const cleanBookId = bookId.trim().toLowerCase() as BookId;

  const searchResult = Inventory.search(cleanBookId);

  if (searchResult) {
    successMessage(
      `   State: ${Inventory.isCheckedOut(cleanBookId) ? "CHECKED OUT" : "IN STOCK"}`
    );
  } else {
    warningMessage(`No book with id ${cleanBookId} found`);
  }
}

const SEARCH_PROMPT: InputQuestion<{ searchTerm: string }> = {
  type: "input",
  name: "searchTerm",
  message: "Query: ",
};

async function searchForBook() {
  const { searchTerm } = await cli.prompt([SEARCH_PROMPT]);
  const searchResult = Inventory.search(searchTerm.trim().toLowerCase());

  if (searchResult) {
    successMessage("Found a book:");
    successMessage(
      `   ID: ${searchResult.id}\n   Title: ${searchResult.title}\n   Author: ${searchResult.author}`
    );
    successMessage(
      `   State: ${Inventory.isCheckedOut(searchResult.id) ? "CHECKED OUT" : "IN STOCK"
      }`
    );
  } else {
    warningMessage("No book found (searched id, title, and author)");
  }
}

console.info(`
***
  Welcome to the Administrate 📚 Library CLI App!
***
`);

const TOP_LOOP_PROMPT: ListQuestion<{ action: ACTION_TYPES }> = {
  type: "list",
  name: "action",
  message: "What would you like to do",
  choices: ACTIONS,
};

while (true) {
  const { action } = await cli.prompt([TOP_LOOP_PROMPT]);

  await dispatch(action);
}

