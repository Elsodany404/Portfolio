const navBtnEl = document.querySelector(".nav-button");
const navEl = document.querySelector(".nav");
const navLinksList = document.querySelector(".nav-links");
const navLinks = document.querySelectorAll(".nav-link a");
const sections = document.querySelectorAll("section");
const currentPageNumEl = document.querySelector(".aside-curr-page");

const skillCircle = [...document.querySelectorAll(".skill-circle")];
const progressCircle = [...document.querySelectorAll(".progress-circle")];
const skillBar = [...document.querySelectorAll(".skill-bar")];
const progressBar = [...document.querySelectorAll(".progress-bar")];

const skillsSection = document.querySelector(".section-skills");
const heroSection = document.querySelector(".section-hero");

const toggleNav = function (open = !navEl.classList.contains("opened")) {
    navEl.classList.toggle("opened", open);
    navBtnEl.classList.toggle("close", open);
    navBtnEl.setAttribute("aria-expanded", open);
};
navBtnEl.setAttribute("aria-label", "Toggle navigation");
navBtnEl.setAttribute("aria-expanded", false);
navBtnEl.addEventListener("click", () => toggleNav());
// Esc closes the nav
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggleNav(false);
});
navLinksList.addEventListener("click", (e) => {
    const linkEl = e.target.closest("a");
    if (!linkEl) return;
    e.preventDefault();
    const id = linkEl.getAttribute("href").replace("#", "");
    const target = document.getElementById(id);
    if (!target) return;
    toggleNav(false);
    target.scrollIntoView({
        behavior: "smooth",
    });
});

let activeSection = null;
let pageNumTimer;
const changeAsideNumber = function (currSection) {
    // Fade out
    currentPageNumEl.classList.remove("visible");
    // a newer change cancels a pending one, so fast scrolling can't
    // leave a stale number behind
    clearTimeout(pageNumTimer);
    pageNumTimer = setTimeout(() => {
        currentPageNumEl.textContent = currSection.dataset.number.padStart(
            2,
            "0"
        );
        // Fade in
        currentPageNumEl.classList.add("visible");
    }, 300); // matches the CSS transition duration
};
const highlightTabs = function (currSection) {
    navLinks.forEach((link) =>
        link
            .closest(".nav-link")
            .classList.toggle(
                "active",
                link.getAttribute("href") === `#${currSection.id}`
            )
    );
};

// The active section is the one crossing the middle of the viewport, so
// only one section can be active at a time, whichever way you scroll
const asideEffects = function (entries) {
    // the callback can report several sections at once (always on first load)
    entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.target === activeSection) return;
        activeSection = entry.target;
        highlightTabs(activeSection);
        changeAsideNumber(activeSection);
    });
};
const sectionsObserver = new IntersectionObserver(asideEffects, {
    root: null,
    threshold: 0,
    rootMargin: "-50% 0px -50% 0px",
});
sections.forEach((sec) => {
    sectionsObserver.observe(sec);
});

const loadCircleBars = function () {
    // percentage
    progressCircle.forEach((ele) => {
        let progress = 0;
        const timeOutID = setInterval(() => {
            ele.textContent = `${++progress}%`;
            if (progress === Number(ele.dataset.percent)) {
                clearInterval(timeOutID);
            }
        }, 20);
    });
    // circles
    skillCircle.forEach((ele, i) => {
        let angle = 0;
        const timeOutID = setInterval(() => {
            ele.style.backgroundImage = `conic-gradient(
                var(--primary) ${++angle}deg,
                var(--primary-soft) ${++angle}deg
            )`;
            if (
                angle ===
                (Number(progressCircle[i].dataset.percent) / 100) * 360
            ) {
                clearInterval(timeOutID);
            }
        }, 15);
    });
};
const loadSkillBars = function () {
    // percentage
    progressBar.forEach((ele) => {
        let progress = 0;
        const timeOutID = setInterval(() => {
            ele.textContent = `${++progress}%`;
            if (progress === Number(ele.dataset.percent)) {
                clearInterval(timeOutID);
            }
        }, 20);
    });
    // bars
    skillBar.forEach((ele, i) => {
        let progress = 0;
        const timeOutID = setInterval(() => {
            ele.style.backgroundImage = `linear-gradient(
                to right,
                var(--primary) ${++progress}%,
                var(--primary-soft) 0%
            )`;
            if (progress === Number(progressBar[i].dataset.percent)) {
                console.log("we are finished");
                clearInterval(timeOutID);
            }
        }, 15);
    });
};

const activateSkillSection = function (entries) {
    const entry = entries[0];
    console.log(entry);
    if (entry.isIntersecting) {
        loadCircleBars();
        loadSkillBars();
        skillsSectionObserver.unobserve(entry.target);
    }
};
const skillsSectionObserver = new IntersectionObserver(activateSkillSection, {
    root: null,
    threshold: 0.2,
});
skillsSectionObserver.observe(skillsSection);

// Contact form: sends messages to my inbox through FormSubmit (no backend needed)
const contactForm = document.querySelector(".contact-form");
const formStatusEl = document.querySelector(".form-status");
const contactButton = document.querySelector(".contact-button");
const CONTACT_ENDPOINT = "https://formsubmit.co/ajax/mouhmdsodany@outlook.com";

const setFormStatus = function (message, type = "") {
    formStatusEl.textContent = message;
    formStatusEl.className = `form-status ${type}`;
};

const validateContactForm = function () {
    let valid = true;
    ["name", "email", "message"].forEach((id) => {
        const input = contactForm.querySelector(`#${id}`);
        const ok =
            input.value.trim() !== "" &&
            (input.type !== "email" || input.checkValidity());
        input.classList.toggle("invalid", !ok);
        if (!ok) valid = false;
    });
    return valid;
};

contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateContactForm()) {
        setFormStatus("Please fill in your name, a valid email and a message.", "error");
        return;
    }
    const data = Object.fromEntries(new FormData(contactForm));
    // bots fill the hidden field; pretend success and drop it
    if (data._honey) {
        contactForm.reset();
        return;
    }
    if (!data._subject) data._subject = "New message from your portfolio";
    data._template = "table";

    contactButton.disabled = true;
    setFormStatus("Sending...");
    try {
        const res = await fetch(CONTACT_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(data),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || result.success === "false") throw new Error(result.message);
        contactForm.reset();
        setFormStatus("Thanks! Your message has been sent. I'll get back to you soon.", "success");
    } catch (err) {
        setFormStatus(
            "Sorry, the message could not be sent. Please email me at mouhmdsodany@outlook.com.",
            "error"
        );
    } finally {
        contactButton.disabled = false;
    }
});
contactForm.addEventListener("input", (e) => e.target.classList.remove("invalid"));
