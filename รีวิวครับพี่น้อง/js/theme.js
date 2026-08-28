// ======================================================
// Anime Review Hub
// theme.js
// Global Theme System
// ======================================================

const THEME_KEY = "siteTheme";


// ======================================================
// Get Theme
// ======================================================

function getTheme() {

    return (
        localStorage.getItem(THEME_KEY)
        || "dark"
    );

}


// ======================================================
// Apply Theme
// ======================================================

function applyTheme() {

    const theme = getTheme();

    document.body.classList.remove(
        "dark",
        "light"
    );

    document.body.classList.add(
        theme
    );

    updateThemeButtons();

}


// ======================================================
// Update All Theme Buttons
// ======================================================

function updateThemeButtons() {

    const buttons =
        document.querySelectorAll(
            "#darkBtn, .dark-toggle"
        );


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    buttons.forEach(button => {

        button.textContent =
            isDark
                ? "☀️"
                : "🌙";


        button.setAttribute(
            "title",
            isDark
                ? "เปลี่ยนเป็น Light Mode"
                : "เปลี่ยนเป็น Dark Mode"
        );

    });

}


// ======================================================
// Toggle
// ======================================================

function toggleTheme() {

    const current =
        getTheme();

    const next =
        current === "dark"
            ? "light"
            : "dark";


    localStorage.setItem(
        THEME_KEY,
        next
    );


    applyTheme();

}


// ======================================================
// Click
// ======================================================

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "#darkBtn, .dark-toggle"
            );


        if (!button) return;


        toggleTheme();

    }
);


// ======================================================
// Apply Before Page Use
// ======================================================

applyTheme();


// ======================================================
// Export
// ======================================================

window.getTheme =
    getTheme;

window.applyTheme =
    applyTheme;

window.toggleTheme =
    toggleTheme;

