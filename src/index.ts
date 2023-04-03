import cli, { ListQuestion } from "inquirer";
import { createInput, prompt } from "./cli.js";
import {
  cleanHex,
  isHex,
  isId,
  cleanId,
  isPositiveInt,
  makeBookId,
  makeBook,
  Inventory,
} from "./library.js";
import chalk from "chalk";

function isNonEmptyString(s: any): s is string {
  if (typeof s === "string" && s.length > 0) {
    return true;
  }

  throw new Error("Must provide a non empty string");
}

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

const BOOK_ID_HEX_PROMPT = createInput("idPrefix", "Book ID Prefix: ", isHex, cleanHex);
const BOOK_ID_PROMPT = createInput("id", "Book ID Number: ", isPositiveInt, parseInt);
const BOOK_TITLE_PROMPT = createInput("title", "Book Title: ", isNonEmptyString);
const BOOK_AUTHOR_PROMPT = createInput("author", "Book Author: ", isNonEmptyString);

async function addBook() {
  const { idPrefix, id, title, author } = await prompt(
    BOOK_ID_HEX_PROMPT,
    BOOK_ID_PROMPT,
    BOOK_TITLE_PROMPT,
    BOOK_AUTHOR_PROMPT
  );

  Inventory.add(
    makeBook(
      makeBookId(idPrefix, id),
      title.trim(),
      author.trim()
    )
  );
  successMessage(`${title} added.`);
}

const CHECKOUT_PROMPT = createInput("bookId", "Book ID: ", isId, cleanId);

async function checkoutBook() {
  const { bookId } = await prompt(CHECKOUT_PROMPT);

  if (Inventory.isCheckedOut(bookId)) {
    warningMessage("Already checked out");
    return;
  }

  const result = Inventory.search(bookId);
  if (result) {
    Inventory.checkoutById(bookId);
    successMessage(`Checked out ${bookId}`);
  } else {
    warningMessage(`Could not find ${bookId}`);
  }
}

async function returnBook() {
  const { bookId } = await prompt(CHECKOUT_PROMPT);

  if (!Inventory.isCheckedOut(bookId)) {
    warningMessage("Already in stock");
    return;
  }

  const result = Inventory.search(bookId);
  if (result) {
    Inventory.returnById(bookId);
    successMessage(`Returned ${bookId}`);
  } else {
    warningMessage(`Could not find ${bookId}`);
  }
}

async function checkBookState() {
  const { bookId } = await cli.prompt(CHECKOUT_PROMPT);

  const searchResult = Inventory.search(bookId);

  if (searchResult) {
    successMessage(
      `   State: ${Inventory.isCheckedOut(bookId) ? "CHECKED OUT" : "IN STOCK"}`
    );
  } else {
    warningMessage(`No book with id ${bookId} found`);
  }
}

const SEARCH_PROMPT = createInput("searchTerm", "Query: ", isNonEmptyString);

async function searchForBook() {
  const { searchTerm } = await prompt(SEARCH_PROMPT);
  const searchResult = Inventory.search(searchTerm);

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

