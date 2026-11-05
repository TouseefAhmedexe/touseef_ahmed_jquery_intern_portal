import { readStored, writeStored } from "./storage.js";

const THEMES = ["light", "dark"];

export function getInitialTheme() {
    const saved = readStored("theme");
    if (THEMES.includes(saved)) {
        return saved;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function saveTheme(theme) {
    return THEMES.includes(theme) && writeStored("theme", theme);
}