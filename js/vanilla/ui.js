import { formatDate, formatSummaryText, getStatusClass, pluralize } from "../shared/data-utils.js";

const TOAST_MS = 4000;

function getElement(id) {
    const element = document.getElementById(id);
    if (element === null) {
        throw new Error(`The element #${id} is missing from the page.`);
    }
    return element;
}

const elements = {
    list: getElement("assignment-list"),
    summary: getElement("summary-text"),
    count: getElement("result-count"),
    filterForm: getElement("filter-form"),
    searchInput: getElement("search-input"),
    statusSelect: getElement("status-select"),
    categorySelect: getElement("category-select"),
    clearButton: getElement("clear-filters"),
    reloadButton: getElement("reload-button"),
    stateBox: getElement("state-box"),
    stateMessage: getElement("state-message"),
    retryButton: getElement("retry-button"),
    stateClearButton: getElement("state-clear-button"),
    dialog: getElement("details-dialog"),
    dialogTitle: getElement("dialog-title"),
    dialogBadge: getElement("dialog-badge"),
    dialogCategory: getElement("dialog-category"),
    dialogDue: getElement("dialog-due"),
    dialogMentor: getElement("dialog-mentor"),
    dialogSummary: getElement("dialog-summary"),
    dialogProgress: getElement("dialog-progress"),
    dialogProgressText: getElement("dialog-progress-text"),
    dialogClose: getElement("dialog-close"),
    form: getElement("apply-form"),
    toastArea: getElement("toast-area"),
    themeButton: getElement("theme-button")
};

function makeElement(tag, className, text = "") {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

function makeOption(value, text) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    return option;
}

function buildCard(assignment) {
    const card = makeElement("article", "card");
    const header = makeElement("div", "card-header");
    const facts = makeElement("ul", "card-facts");
    const progress = makeElement("progress", "", `${assignment.progress}%`);
    const actions = makeElement("div", "card-actions");
    
    const viewButton = makeElement("button", "button button--small", "View details");
    viewButton.type = "button";
    viewButton.dataset.action = "view";

    const toggleButton = makeElement("button", "button button--small button--secondary", "Show more");
    toggleButton.type = "button";
    toggleButton.dataset.action = "toggle";

    const details = makeElement("div", "card-details");
    details.appendChild(makeElement("p", "", assignment.summary || "No description yet."));

    card.dataset.id = assignment.id;

    header.append(
        makeElement("p", "card-category", assignment.category),
        makeElement("span", getStatusClass(assignment.status), assignment.status)
    );

    facts.append(
        makeElement("li", "", `Due: ${formatDate(assignment.dueDate)}`),
        makeElement("li", "", `Mentor: ${assignment.mentor}`),
        makeElement("li", "", `Progress: ${assignment.progress}%`)
    );

    progress.max = 100;
    progress.value = assignment.progress;

    actions.append(viewButton, toggleButton);

    card.append(header, makeElement("h3", "card-title", assignment.title), facts, progress, actions, details);
    return card;
}

function setState(kind, message, visibleButton) {
    elements.stateBox.hidden = false;
    elements.stateBox.className = `state-box state-box--${kind}`;
    elements.stateMessage.textContent = message;
    elements.retryButton.hidden = visibleButton !== "retry";
    elements.stateClearButton.hidden = visibleButton !== "clear";
}

export function hideState() {
    elements.stateBox.hidden = true;
}

export function showLoading() {
    elements.list.textContent = "";
    elements.count.textContent = "";
    elements.reloadButton.disabled = true;
    setState("loading", "Loading assignments...", "none");
}

export function enableReload() {
    elements.reloadButton.disabled = false;
}

export function showError(message) {
    setState("error", message, "retry");
}

export function showNoRecords() {
    setState("empty", "The data source returned no usable assignments yet. Try reloading later.", "retry");
}

export function showNoMatches() {
    setState("empty", "No assignments match your search. Try other words or clear the filters.", "clear");
}

export function renderAssignments(assignments) {
    elements.list.textContent = "";
    elements.list.append(...assignments.map((assignment) => buildCard(assignment)));
}

export function renderSummary(counts, total, skippedCount) {
    elements.summary.textContent = formatSummaryText(total, counts, skippedCount);
}

export function showCount(shown, total) {
    elements.count.textContent = `Showing ${shown} of ${pluralize(total, "assignment")}.`;
}

export function fillCategories(categories) {
    const current = elements.categorySelect.value;
    elements.categorySelect.textContent = "";
    elements.categorySelect.append(
        makeOption("all", "All categories"),
        ...categories.map((category) => makeOption(category, category))
    );
    elements.categorySelect.value = categories.includes(current) ? current : "all";
}

export function readFilters() {
    return {
        query: elements.searchInput.value.trim(),
        status: elements.statusSelect.value,
        category: elements.categorySelect.value || "all"
    };
}

export function clearFilters() {
    elements.searchInput.value = "";
    elements.statusSelect.value = "all";
    elements.categorySelect.value = "all";
}

export function focusSearch() {
    elements.searchInput.focus();
}

export function openDetails(assignment) {
    elements.dialogTitle.textContent = assignment.title;
    elements.dialogBadge.className = getStatusClass(assignment.status);
    elements.dialogBadge.textContent = assignment.status;
    elements.dialogCategory.textContent = assignment.category;
    elements.dialogDue.textContent = formatDate(assignment.dueDate);
    elements.dialogMentor.textContent = assignment.mentor;
    elements.dialogSummary.textContent = assignment.summary || "No description yet.";
    elements.dialogProgress.value = assignment.progress;
    elements.dialogProgressText.textContent = `${assignment.progress}%`;
    elements.dialog.showModal();
}

export function closeDetails() {
    elements.dialog.close();
}

export function showToast(message, kind = "info") {
    const toast = makeElement("div", `toast toast--auto toast--${kind}`, message);
    elements.toastArea.append(toast);
    if (elements.toastArea.children.length > 3) {
        elements.toastArea.firstElementChild.remove();
    }
    window.setTimeout(() => toast.remove(), TOAST_MS);
}

export function readApplication() {
    const data = new FormData(elements.form);
    const track = elements.form.elements.track;
    return {
        name: data.get("full_name").trim(),
        trackName: track.options[track.selectedIndex].textContent
    };
}

export function showFieldError(field) {
    const wrapper = field.closest(".field");
    const box = wrapper === null ? null : wrapper.querySelector(".field-error");
    if (box !== null) {
        box.textContent = field.validationMessage;
    }
}

export function showFieldErrors(form) {
    [...form.elements]
        .filter((field) => field.willValidate)
        .forEach((field) => showFieldError(field));
}

export function resetApplicationForm() {
    elements.form.reset();
}

export function setThemeButton(theme) {
    elements.themeButton.textContent = theme === "dark" ? "Light theme" : "Dark theme";
}

export function bindEvents(handlers) {
    elements.filterForm.addEventListener("submit", (event) => event.preventDefault());
    elements.searchInput.addEventListener("input", handlers.onSearch);
    elements.statusSelect.addEventListener("change", handlers.onFilterChange);
    elements.categorySelect.addEventListener("change", handlers.onFilterChange);
    elements.clearButton.addEventListener("click", handlers.onClear);
    elements.stateClearButton.addEventListener("click", handlers.onClear);
    elements.reloadButton.addEventListener("click", handlers.onReload);
    elements.retryButton.addEventListener("click", handlers.onReload);
    elements.list.addEventListener("click", handlers.onListClick);
    elements.form.addEventListener("submit", handlers.onFormSubmit);
    elements.form.addEventListener("input", handlers.onFormInput);
    elements.themeButton.addEventListener("click", handlers.onThemeClick);
}

elements.dialogClose.addEventListener("click", closeDetails);

elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) {
        closeDetails();
    }
});

elements.form.addEventListener("reset", () => {
    elements.form.removeAttribute("data-submitted");
    elements.form.querySelectorAll(".field-error").forEach((box) => {
        box.textContent = "";
    });
});