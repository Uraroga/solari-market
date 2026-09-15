import { CATEGORIES, RISKS } from "./data.js";
import { createInitialState, loadStateFromStorage } from "./game.js";
import { initUi } from "./ui.js";

function fillFilterOptions() {
  document
    .getElementById("filter-category")
    .insertAdjacentHTML(
      "beforeend",
      CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join(""),
    );
  document
    .getElementById("filter-risk")
    .insertAdjacentHTML(
      "beforeend",
      RISKS.map((r) => `<option value="${r}">${r}</option>`).join(""),
    );
}

document.addEventListener("DOMContentLoaded", () => {
  fillFilterOptions();
  let state;
  try {
    state = loadStateFromStorage();
  } catch {
    /* Storage may be blocked; keep the game playable in memory. */
  }
  state ||= createInitialState();
  initUi(state);
});
