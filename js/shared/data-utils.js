export const STATUSES = ["Pending", "In Progress", "Completed"];

export function pluralize(count, word) {
    return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function normalizeAssignment(record) {
    if (record === null || typeof record !== "object") {
        return null;
    }

    const { id, title, category, status, dueDate, progress, mentor, summary } = record;
    const percent = Number(progress);

    if (typeof id !== "string" || id.trim() === "") {
        return null;
    }

    if (typeof title !== "string" || title.trim() === "") {
        return null;
    }

    if (!STATUSES.includes(status)) {
        return null;
    }

    if (typeof dueDate !== "string" || Number.isNaN(new Date(dueDate).getTime())) {
        return null;
    }

    return {
        id: id.trim(),
        title: title.trim(),
        category: typeof category === "string" && category.trim() !== "" ? category.trim() : "Other",
        status,
        dueDate,
        progress: Number.isFinite(percent) ? Math.min(Math.max(Math.round(percent), 0), 100) : 0,
        mentor: typeof mentor === "string" && mentor.trim() !== "" ? mentor.trim() : "Not assigned",
        summary: typeof summary === "string" ? summary.trim() : ""
    };
}

export function normalizeList(records, normalizeRecord) {
    const valid = records
        .map((record) => normalizeRecord(record))
        .filter((record) => record !== null);

    return { valid, skippedCount: records.length - valid.length };
}

export function filterAssignments(assignments, { query, status, category }) {
    const text = query.trim().toLowerCase();

    return assignments.filter((assignment) => {
        const searchable = `${assignment.title} ${assignment.summary} ${assignment.mentor}`.toLowerCase();
        const matchesText = text === "" || searchable.includes(text);
        const matchesStatus = status === "all" || assignment.status === status;
        const matchesCategory = category === "all" || assignment.category === category;

        return matchesText && matchesStatus && matchesCategory;
    });
}

export function sortByDueDate(assignments) {
    return [...assignments].sort((first, second) => {
        return new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime();
    });
}

export function getCategories(assignments) {
    const categories = assignments.reduce((found, assignment) => {
        return found.includes(assignment.category) ? found : [...found, assignment.category];
    }, []);

    return categories.sort((first, second) => first.localeCompare(second));
}

export function countByStatus(assignments) {
    return STATUSES.reduce((counts, status) => {
        return { ...counts, [status]: assignments.filter((assignment) => assignment.status === status).length };
    }, {});
}

export function getStatusClass(status) {
    return `badge badge--${status.toLowerCase().split(" ").join("-")}`;
}

export function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
    });
}