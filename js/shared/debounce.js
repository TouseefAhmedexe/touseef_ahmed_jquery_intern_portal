export default function debounce(callback, delay) {
    let timerId = null;

    return function (...args) {
        window.clearTimeout(timerId);
        timerId = window.setTimeout(() => callback(...args), delay);
    };
}