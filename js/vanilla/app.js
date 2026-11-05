import { fetchAssignments } from "./api.js";
import {
    countByStatus,
    filterAssignments,
    getCategories,
    normalizeAssignment,
    normalizeList,
    sortByDueDate
} from "../shared/data-utils.js";
import debounce from "../shared/debounce.js";
import { getInitialTheme, saveTheme } from "../shared/theme.js";
import { selectCard } from "./migrated.js";
import * as ui from "./ui.js";

const SEARCH_DELAY_MS = 300;

let assignments = [];
let skippedCount = 0;
let isLoading = false;

function updateList() {
    const matches = sortByDueDate(filterAssignments(assignments, ui.readFilters()));

    ui.showCount(matches.length, assignments.length);

    if (matches.length === 0) {
        ui.renderAssignments([]);
        ui.showNoMatches();
        return;
    }

    ui.hideState();
    ui.renderAssignments(matches);
}

function displayData() {
    if (assignments.length === 0) {
        ui.renderAssignments([]);
        ui.showNoRecords();
        return;
    }

    ui.fillCategories(getCategories(assignments));
    ui.renderSummary(countByStatus(assignments), assignments.length, skippedCount);
    updateList();
}

async function loadData() {
    if (isLoading) {
        return;
    }

    isLoading = true;
    ui.showLoading();

    try {
        const rawData = await fetchAssignments();
        const result = normalizeList(rawData, normalizeAssignment);

        assignments = result.valid;
        skippedCount = result.skippedCount;
        displayData();
    } catch (error) {
        ui.showError(error.message);
    } finally {
        isLoading = false;
        ui.enableReload();
    }
}

function handleFilterChange() {
    if (assignments.length > 0) {
        updateList();
    }
}

function handleClear() {
    ui.clearFilters();
    handleFilterChange();
    ui.focusSearch();
}

function handleListClick(event) {
    const card = event.target.closest(".card");
    if (card === null) {
        return;
    }

    const button = event.target.closest("[data-action='view']");
    if (button === null) {
        selectCard(card);
        return;
    }

    const assignment = assignments.find((item) => item.id === card.dataset.id);
    if (assignment === undefined) {
        ui.showToast("That assignment could not be found.", "error");
        return;
    }

    ui.openDetails(assignment);
}

function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    form.dataset.submitted = "true";
    ui.showFieldErrors(form);

    if (!form.checkValidity()) {
        ui.showToast("Please fix the highlighted answers.", "error");
        return;
    }

    const application = ui.readApplication();
    ui.showToast(`Thank you, ${application.name}. Your application for the ${application.trackName} track is complete. No server is connected, so nothing was sent.`, "success");
    ui.resetApplicationForm();
}

function handleFormInput(event) {
    if (event.currentTarget.dataset.submitted === "true") {
        ui.showFieldError(event.target);
    }
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    ui.setThemeButton(theme);
}

function handleThemeClick() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    const wasSaved = saveTheme(next);

    applyTheme(next);
    ui.showToast(wasSaved ? "Theme saved in this browser." : "Theme changed, but your browser blocked saving it.");
}

applyTheme(getInitialTheme());

ui.bindEvents({
    onSearch: debounce(handleFilterChange, SEARCH_DELAY_MS),
    onFilterChange: handleFilterChange,
    onClear: handleClear,
    onReload: loadData,
    onListClick: handleListClick,
    onFormSubmit: handleFormSubmit,
    onFormInput: handleFormInput,
    onThemeClick: handleThemeClick
});

loadData();