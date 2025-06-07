const themeToggle = document.getElementById("theme-toggle");
const userTheme = localStorage.getItem("theme");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

const applyTheme = (theme) => {
	if (theme === "dark") {
		document.documentElement.classList.add("dark");
		themeToggle.textContent = "🌙";
	} else {
		document.documentElement.classList.remove("dark");
		themeToggle.textContent = "☀️";
	}
};

const handleThemeToggle = () => {
	const isDark = document.documentElement.classList.contains("dark");
	localStorage.setItem("theme", isDark ? "light" : "dark");
	applyTheme(isDark ? "light" : "dark");
};

export function initTheme() {
	// Apply saved theme or system preference
	if (userTheme === "dark" || (!userTheme && systemTheme)) {
		applyTheme("dark");
	} else {
		applyTheme("light");
	}
	themeToggle.addEventListener("click", handleThemeToggle);
}