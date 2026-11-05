const PREFIX = "bloomrix.portal.";

export function readStored(key, fallback = null) {
    try {
        const value = window.localStorage.getItem(PREFIX + key);
        return value === null ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

export function writeStored(key, value) {
    try {
        window.localStorage.setItem(PREFIX + key, value);
        return true;
    } catch (error) {
        return false;
    }
}