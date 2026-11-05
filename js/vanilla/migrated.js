/*
    Converted from selectCard($card) in js/jquery/app.js

    jQuery                              Vanilla JavaScript
    $card.addClass("is-selected")       card.classList.add("is-selected")
    $card.siblings(".card")             [...card.parentElement.children].filter(...)
    .removeClass("is-selected")         sibling.classList.remove("is-selected")
    $card.find(".card-title").text()    card.querySelector(".card-title").textContent
    $("#selected-note").text(value)     document.getElementById("selected-note").textContent = value
*/
export function selectCard(card) {
    card.classList.add("is-selected");

    [...card.parentElement.children]
        .filter((sibling) => sibling !== card && sibling.matches(".card"))
        .forEach((sibling) => sibling.classList.remove("is-selected"));

    const note = document.getElementById("selected-note");
    if (note !== null) {
        note.textContent = `Selected: ${card.querySelector(".card-title").textContent}`;
    }
}