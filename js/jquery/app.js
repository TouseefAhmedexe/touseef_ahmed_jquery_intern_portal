import {
    countByStatus,
    filterAssignments,
    formatDate,
    getCategories,
    getStatusClass,
    normalizeAssignment,
    normalizeList,
    pluralize,
    sortByDueDate
} from "../shared/data-utils.js";
import debounce from "../shared/debounce.js";
import { getInitialTheme, saveTheme } from "../shared/theme.js";

if (typeof window.jQuery === "undefined") {
    throw new Error("jQuery did not load. Check the path lib/jquery-4.0.0.min.js.");
}

const SEARCH_DELAY_MS = 300;
const TOAST_MS = 3500;
const MAX_TOASTS = 3;

const $els = {};

let assignments = [];
let skippedCount = 0;

// Vanilla: getElementById returns null for a missing element. jQuery returns an empty set and fails silently, so this check is needed.
function $required(selector) {
    const $found = $(selector);
    if ($found.length === 0) {
        throw new Error(`The element ${selector} is missing from the page.`);
    }
    return $found;
}

// Each element is queried once and kept. Repeating $("#id") in every function is a common jQuery mistake.
function cacheElements() {
    $els.list = $required("#assignment-list");
    $els.summary = $required("#summary-text");
    $els.count = $required("#result-count");
    $els.note = $required("#selected-note");
    $els.filterForm = $required("#filter-form");
    $els.searchInput = $required("#search-input");
    $els.statusSelect = $required("#status-select");
    $els.categorySelect = $required("#category-select");
    $els.clearButton = $required("#clear-filters");
    $els.collapseButton = $required("#collapse-all");
    $els.reloadButton = $required("#reload-button");
    $els.stateBox = $required("#state-box");
    $els.stateMessage = $required("#state-message");
    $els.retryButton = $required("#retry-button");
    $els.stateClearButton = $required("#state-clear-button");
    $els.dialog = $required("#details-dialog");
    $els.dialogTitle = $required("#dialog-title");
    $els.dialogBadge = $required("#dialog-badge");
    $els.dialogCategory = $required("#dialog-category");
    $els.dialogDue = $required("#dialog-due");
    $els.dialogMentor = $required("#dialog-mentor");
    $els.dialogSummary = $required("#dialog-summary");
    $els.dialogProgress = $required("#dialog-progress");
    $els.dialogProgressText = $required("#dialog-progress-text");
    $els.dialogClose = $required("#dialog-close");
    $els.form = $required("#apply-form");
    $els.toastArea = $required("#toast-area");
    $els.themeButton = $required("#theme-button");
}

function setState(kind, message, visibleButton) {
    $els.stateBox.prop("hidden", false).attr("class", `state-box state-box--${kind}`);
    $els.stateMessage.text(message);
    $els.retryButton.prop("hidden", visibleButton !== "retry");
    $els.stateClearButton.prop("hidden", visibleButton !== "clear");
}

function hideState() {
    $els.stateBox.prop("hidden", true);
}

function showLoading() {
    $els.list.empty();
    $els.count.text("");
    $els.reloadButton.prop("disabled", true);
    setState("loading", "Loading assignments...", "none");
}

function buildCard(assignment) {
    // Vanilla: createElement, then set properties, then append. jQuery builds elements with $("<tag>", props) and chains append().
    const $badge = $("<span>").addClass(getStatusClass(assignment.status)).text(assignment.status);
    const $header = $("<div>").addClass("card-header").append($("<p>").addClass("card-category").text(assignment.category), $badge);
    const $facts = $("<ul>").addClass("card-facts").append(
        $("<li>").text(`Due: ${formatDate(assignment.dueDate)}`),
        $("<li>").text(`Mentor: ${assignment.mentor}`),
        $("<li>").text(`Progress: ${assignment.progress}%`)
    );
    const $progress = $("<progress>", { max: 100, value: assignment.progress }).text(`${assignment.progress}%`);
    const $actions = $("<div>").addClass("card-actions").append(
        $("<button>", { type: "button", class: "button button--small", "data-action": "view" }).text("View details"),
        $("<button>", { type: "button", class: "button button--small button--secondary", "data-action": "toggle" }).text("Show more")
    );
    const $details = $("<div>").addClass("card-details").append($("<p>").text(assignment.summary || "No description yet."));

    return $("<article>", { class: "card", "data-id": assignment.id }).append(
        $header,
        $("<h3>").addClass("card-title").text(assignment.title),
        $facts,
        $progress,
        $actions,
        $details
    );
}

function fillCategories() {
    const current = $els.categorySelect.val();
    const categories = getCategories(assignments);

    $els.categorySelect.empty().append($("<option>", { value: "all", text: "All categories" }));

    // $.each passes (index, item). Array forEach passes (item, index).
    $.each(categories, function (index, category) {
        $els.categorySelect.append($("<option>", { value: category, text: category }));
    });

    $els.categorySelect.val(categories.includes(current) ? current : "all");
}

function renderSummary() {
    const counts = countByStatus(assignments);
    const skipped = skippedCount === 0
        ? ""
        : ` ${pluralize(skippedCount, "record")} could not be used and ${skippedCount === 1 ? "was" : "were"} skipped.`;

    $els.summary.text(`${pluralize(assignments.length, "assignment")}: ${counts.Completed} completed, ${counts["In Progress"]} in progress, ${counts.Pending} pending.${skipped}`);
}

function readFilters() {
    return {
        query: $els.searchInput.val().trim(),
        status: $els.statusSelect.val(),
        category: $els.categorySelect.val() || "all"
    };
}

function updateList() {
    if (assignments.length === 0) {
        return;
    }

    const matches = sortByDueDate(filterAssignments(assignments, readFilters()));

    $els.count.text(`Showing ${matches.length} of ${pluralize(assignments.length, "assignment")}.`);

    if (matches.length === 0) {
        $els.list.empty();
        setState("empty", "No assignments match your search. Try other words or clear the filters.", "clear");
        return;
    }

    hideState();
    $els.list.empty().append(...matches.map((assignment) => buildCard(assignment)));
}

function handleLoaded(data) {
    if (!Array.isArray(data)) {
        setState("error", "The assignment data has an unexpected format. A list was expected.", "retry");
        return;
    }

    const result = normalizeList(data, normalizeAssignment);

    assignments = result.valid;
    skippedCount = result.skippedCount;

    if (assignments.length === 0) {
        $els.list.empty();
        setState("empty", "The data source returned no usable assignments yet. Try reloading later.", "retry");
        return;
    }

    fillCategories();
    renderSummary();
    updateList();
}

function getAjaxMessage(jqXHR, textStatus) {
    if (textStatus === "parsererror") {
        return "The assignment data is not valid JSON.";
    }

    if (jqXHR.status === 404) {
        return "The assignment data was not found (status 404).";
    }

    if (jqXHR.status === 0) {
        return "The assignment data could not be reached. Check your connection and try again.";
    }

    return `The request failed with status ${jqXHR.status}.`;
}

function loadAssignments() {
    showLoading();

    // Vanilla: await fetch(), then check response.ok. jqXHR has done(), fail() and always() instead of then(), catch() and finally(), and a 404 already counts as a failure.
    return $.ajax({ url: "data/assignments.json", dataType: "json", cache: false })
        .done(function (data) {
            handleLoaded(data);
        })
        .fail(function (jqXHR, textStatus) {
            setState("error", getAjaxMessage(jqXHR, textStatus), "retry");
        })
        .always(function () {
            $els.reloadButton.prop("disabled", false);
        });
}

function showToast(message, kind = "info") {
    // Vanilla: createElement, append, setTimeout to remove, and a CSS animation. One jQuery chain does all of it.
    $("<div>")
        .addClass(`toast toast--${kind}`)
        .text(message)
        .hide()
        .appendTo($els.toastArea)
        .fadeIn(200)
        .delay(TOAST_MS)
        .fadeOut(400, function () {
            $(this).remove();
        });

    const $toasts = $els.toastArea.children();
    if ($toasts.length > MAX_TOASTS) {
        $toasts.first().remove();
    }
}

function applyTheme(theme) {
    $("html").attr("data-theme", theme);
    $els.themeButton.text(theme === "dark" ? "Light theme" : "Dark theme");
}

function bindThemeEvents() {
    $els.themeButton.on("click", function () {
        const next = $("html").attr("data-theme") === "dark" ? "light" : "dark";
        const wasSaved = saveTheme(next);

        applyTheme(next);
        showToast(wasSaved ? "Theme saved in this browser." : "Theme changed, but your browser blocked saving it.");
    });
}

function clearFilters() {
    $els.searchInput.val("");
    $els.statusSelect.val("all");
    $els.categorySelect.val("all");
    updateList();
    $els.searchInput.trigger("focus");
}

function bindFilterEvents() {
    $els.filterForm.on("submit", function (event) {
        event.preventDefault();
    });

    $els.searchInput.on("input", debounce(updateList, SEARCH_DELAY_MS));
    $els.statusSelect.add($els.categorySelect).on("change", updateList);
    $els.clearButton.add($els.stateClearButton).on("click", clearFilters);
    $els.reloadButton.add($els.retryButton).on("click", loadAssignments);

    $els.searchInput.one("focus", function () {
        showToast("Tip: the search starts a moment after you stop typing.");
    });
}

function openDetails(id) {
    const assignment = assignments.find((item) => item.id === id);

    if (assignment === undefined) {
        showToast("That assignment could not be found.", "error");
        return;
    }

    $els.dialogTitle.text(assignment.title);
    $els.dialogBadge.attr("class", getStatusClass(assignment.status)).text(assignment.status);
    $els.dialogCategory.text(assignment.category);
    $els.dialogDue.text(formatDate(assignment.dueDate));
    $els.dialogMentor.text(assignment.mentor);
    $els.dialogSummary.text(assignment.summary || "No description yet.");
    $els.dialogProgress.prop("value", assignment.progress);
    $els.dialogProgressText.text(`${assignment.progress}%`);

    // jQuery has no dialog methods. get(0) returns the native element, so showModal() can be called.
    $els.dialog.get(0).showModal();
}

function bindDialogEvents() {
    $els.dialogClose.on("click", function () {
        $els.dialog.get(0).close();
    });

    $els.dialog.on("click", function (event) {
        if (event.target === this) {
            this.close();
        }
    });
}

// The Vanilla version of this function is in js/vanilla/migrated.js
function selectCard($card) {
    $card.addClass("is-selected").siblings(".card").removeClass("is-selected");
    $els.note.text(`Selected: ${$card.find(".card-title").text()}`);
}

function toggleDetails($card, $button) {
    const $details = $card.find(".card-details");
    // slideToggle writes inline display and height styles.
    $details.stop(true, true).slideToggle(250, function () {
        $button.text($details.is(":visible") ? "Show less" : "Show more");
    });
}

function collapseAll() {
    $els.list.find(".card-details:visible").slideUp(200);
    $els.list.find("[data-action='toggle']").text("Show more");
}

function bindListEvents() {
    // Vanilla: list.addEventListener("click", ...) and event.target.closest(selector). jQuery: on("click", selector, fn), and this is the matched element.
    $els.list.on("click", "[data-action]", function () {
        const $button = $(this);
        const $card = $button.closest(".card");

        if ($button.data("action") === "view") {
            openDetails($card.data("id"));
        } else {
            toggleDetails($card, $button);
        }
    });

    $els.list.on("click", ".card", function (event) {
        if ($(event.target).closest("button").length === 0) {
            selectCard($(this));
        }
    });

    $els.collapseButton.on("click", collapseAll);
}

function validateForm($form) {
    let isValid = true;
    // Vanilla: [...form.elements].forEach. In each(), return; continues to the next element.
    $form.find(":input").each(function () {
        if (!this.willValidate) {
            return;
        }

        $(this).closest(".field").find(".field-error").text(this.validationMessage);

        if (!this.checkValidity()) {
            isValid = false;
        }
    });

    return isValid;
}

function bindFormEvents() {
    $els.form.on("submit", function (event) {
        event.preventDefault();

        const $form = $(this);
        // The CSS reads the attribute. $form.data("submitted", true) would not change the attribute, so attr() is used.
        $form.attr("data-submitted", "true");

        if (!validateForm($form)) {
            showToast("Please fix the highlighted answers.", "error");
            return;
        }

        // Vanilla: new FormData(form). serializeArray() returns [{ name, value }] for every enabled control.
        const answers = {};
        $.each($form.serializeArray(), function (index, field) {
            answers[field.name] = field.value;
        });

        const trackName = $form.find("#track option:selected").text();

        showToast(`Thank you, ${answers.full_name.trim()}. Your application for the ${trackName} track is complete. No server is connected, so nothing was sent.`, "success");
        this.reset();
    });

    $els.form.on("input change", ":input", function () {
        if ($els.form.attr("data-submitted") === "true") {
            $(this).closest(".field").find(".field-error").text(this.validationMessage);
        }
    });

    $els.form.on("reset", function () {
        $(this).removeAttr("data-submitted").find(".field-error").text("");
    });
}

function init() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        $.fx.off = true;
    }

    cacheElements();
    applyTheme(getInitialTheme());
    bindThemeEvents();
    bindFilterEvents();
    bindDialogEvents();
    bindListEvents();
    bindFormEvents();
    loadAssignments();
}

$(function () {
    init();
});