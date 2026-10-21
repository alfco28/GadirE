function setupFilters(state, update) {
    const filters = [
        { id: "fTipo", stateKey: "tipo", defaultValue: "todos", icon: "fa-shapes" },
        { id: "fCampus", stateKey: "campus", defaultValue: "todos", icon: "fa-location-dot" },
        { id: "fEdificio", stateKey: "edificio", defaultValue: "todos", icon: "fa-building" },
        { id: "fPlanta", stateKey: "planta", defaultValue: "todas", icon: "fa-layer-group" }
    ];
    const optionsPopup = document.createElement("div");
    optionsPopup.id = "filter-options-popup";
    optionsPopup.className = "filter-options elemento-flotante";
    optionsPopup.setAttribute("role", "listbox");
    optionsPopup.hidden = true;
    document.body.appendChild(optionsPopup);

    let activeTrigger = null;

    function closeOptions(restoreFocus = false) {
        if (!activeTrigger) return;

        const trigger = activeTrigger;
        activeTrigger = null;
        trigger.setAttribute("aria-expanded", "false");
        optionsPopup.hidden = true;

        if (restoreFocus) trigger.focus();
    }

    function positionOptions(trigger) {
        const triggerRect = trigger.getBoundingClientRect();
        const popupRect = optionsPopup.getBoundingClientRect();
        const margin = 12;
        const left = Math.min(
            Math.max(margin, triggerRect.left),
            window.innerWidth - popupRect.width - margin
        );
        const belowTop = triggerRect.bottom + 8;
        const top = belowTop + popupRect.height <= window.innerHeight - margin
            ? belowTop
            : Math.max(margin, triggerRect.top - popupRect.height - 8);

        optionsPopup.style.left = `${left}px`;
        optionsPopup.style.top = `${top}px`;
    }

    function openOptions(trigger, select, filterName, focusSelected = false) {
        closeOptions();
        activeTrigger = trigger;
        trigger.setAttribute("aria-expanded", "true");
        optionsPopup.setAttribute("aria-label", `Opciones de ${filterName}`);

        const optionButtons = Array.from(select.options, option => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "filter-option";
            button.setAttribute("role", "option");
            button.setAttribute("aria-selected", String(option.value === select.value));
            button.tabIndex = option.value === select.value ? 0 : -1;
            button.textContent = option.textContent;

            button.addEventListener("click", () => {
                select.value = option.value;
                select.dispatchEvent(new Event("change", { bubbles: true }));
                closeOptions(true);
            });

            return button;
        });

        optionsPopup.replaceChildren(...optionButtons);
        optionsPopup.hidden = false;
        positionOptions(trigger);

        if (focusSelected) {
            optionButtons.find(button => button.getAttribute("aria-selected") === "true")?.focus();
        }
    }

    filters.forEach(({ id, stateKey, defaultValue, icon }) => {
        const select = document.getElementById(id);
        const filterPair = select.closest(".filter-pair");
        const label = filterPair.querySelector("label");
        const filterName = label.textContent.trim().replace(/:$/, "");
        const trigger = document.createElement("button");
        const filterIcon = document.createElement("i");
        const triggerLabel = document.createElement("span");
        const chevron = document.createElement("i");

        trigger.type = "button";
        trigger.className = "filter-trigger";
        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-controls", optionsPopup.id);
        trigger.setAttribute("aria-expanded", "false");
        trigger.setAttribute("aria-label", filterName);
        filterIcon.className = `fa-solid ${icon} filter-icon`;
        filterIcon.setAttribute("aria-hidden", "true");
        triggerLabel.className = "filter-trigger-label";
        triggerLabel.textContent = filterName;
        chevron.className = "fa-solid fa-chevron-down";
        chevron.setAttribute("aria-hidden", "true");
        trigger.append(filterIcon, triggerLabel, chevron);

        label.hidden = true;
        select.hidden = true;
        select.setAttribute("aria-hidden", "true");
        filterPair.appendChild(trigger);

        function updateTriggerLabel() {
            const selectedOption = select.options[select.selectedIndex];
            const isDefault = select.value === defaultValue;
            const displayedValue = isDefault ? filterName : selectedOption.textContent;

            triggerLabel.textContent = displayedValue;
            trigger.setAttribute("aria-label", isDefault ? filterName : `${filterName}: ${displayedValue}`);
            trigger.title = displayedValue;
            // Solo resalta la burbuja cuando su valor difiere de la opcion inicial.
            filterPair.classList.toggle("is-active", !isDefault);
        }

        select.addEventListener("change", updateTriggerLabel);
        updateTriggerLabel();

        select.onchange = event => {
            state[stateKey] = event.target.value;
            update();
        };

        trigger.addEventListener("click", () => {
            if (activeTrigger === trigger) {
                closeOptions();
            } else {
                openOptions(trigger, select, filterName);
            }
        });

        trigger.addEventListener("keydown", event => {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                openOptions(trigger, select, filterName, true);
            }
        });
    });

    optionsPopup.addEventListener("keydown", event => {
        const options = Array.from(optionsPopup.querySelectorAll(".filter-option"));
        const currentIndex = options.indexOf(document.activeElement);
        let nextIndex;

        if (event.key === "ArrowDown") nextIndex = Math.min(currentIndex + 1, options.length - 1);
        else if (event.key === "ArrowUp") nextIndex = Math.max(currentIndex - 1, 0);
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = options.length - 1;
        else return;

        event.preventDefault();
        options.forEach((option, index) => {
            option.tabIndex = index === nextIndex ? 0 : -1;
        });
        options[nextIndex]?.focus();
    });

    document.addEventListener("click", event => {
        if (
            activeTrigger &&
            !activeTrigger.contains(event.target) &&
            !optionsPopup.contains(event.target)
        ) {
            closeOptions();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeOptions(true);
    });

    window.addEventListener("resize", () => closeOptions());
    const filtersContainer = document.getElementById("filters");
    filtersContainer.addEventListener("scroll", () => closeOptions());
    filtersContainer.addEventListener("wheel", event => {
        if (filtersContainer.scrollWidth > filtersContainer.clientWidth) {
            event.preventDefault();
            filtersContainer.scrollLeft += event.deltaY || event.deltaX;
        }
        event.stopPropagation();
    }, { passive: false });
}