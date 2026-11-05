export async function fetchAssignments(url = "data/assignments.json") {
    let response;

    try {
        response = await fetch(url);
    } catch (error) {
        throw new Error("The assignment data could not be reached. Check your connection and try again.");
    }

    if (!response.ok) {
        throw new Error(`The assignment data was not found (status ${response.status}).`);
    }

    let data;

    try {
        data = await response.json();
    } catch (error) {
        throw new Error("The assignment data is not valid JSON.");
    }

    if (!Array.isArray(data)) {
        throw new Error("The assignment data has an unexpected format. A list was expected.");
    }

    return data;
}