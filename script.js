const startInput = document.getElementById("start-date");
const endInput = document.getElementById("end-date");
const startLabel = document.getElementById("start-label");
const endLabel = document.getElementById("end-label");
const tickContainer = document.getElementById("tick-container");
const timeline = document.querySelector(".timeline");
const tooltip = document.getElementById("timeline-tooltip");
const menu = document.getElementById("timeline-menu");
const panel = document.getElementById("timeline-panel");
const eventContainer = document.getElementById("event-container");
const phaseContainer = document.getElementById("phase-container");

const defaultStart = new Date();
const defaultEnd = new Date();

defaultEnd.setMonth(defaultEnd.getMonth() + 6);

startInput.value = defaultStart.toISOString().slice(0, 10);
endInput.value = defaultEnd.toISOString().slice(0, 10);

const state = {
  selectedDate: null,
  currentMulti: null,
  awaitingPoint: false,
  pendingPointName: "",
  events: [],
  phases: [],
};

const RAIL_PADDING = 24;

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonth(date) {
  return date.toLocaleDateString("de-DE", {
    month: "short",
    year: "numeric",
  });
}

function getRange() {
  const start = new Date(startInput.value);
  const end = new Date(endInput.value);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end <= start) return null;
  return { start, end };
}

function dateFromPosition(clientX) {
  const range = getRange();
  if (!range) return null;
  const rect = timeline.getBoundingClientRect();
  const left = rect.left + RAIL_PADDING;
  const right = rect.right - RAIL_PADDING;
  const clampedX = Math.min(Math.max(clientX, left), right);
  const ratio = (clampedX - left) / (right - left);
  const timestamp = range.start.getTime() + ratio * (range.end.getTime() - range.start.getTime());
  return new Date(timestamp);
}

function positionForDate(date) {
  const range = getRange();
  if (!range) return 0;
  const ratio = (date.getTime() - range.start.getTime()) /
    (range.end.getTime() - range.start.getTime());
  return Math.min(Math.max(ratio, 0), 1);
}

function buildTicks(startDate, endDate) {
  tickContainer.innerHTML = "";
  const ticks = 6;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const total = end.getTime() - start.getTime();

  for (let i = 0; i <= ticks; i += 1) {
    const tick = document.createElement("div");
    tick.className = "timeline__tick";
    const point = new Date(start.getTime() + (total / ticks) * i);
    tick.innerHTML = `<span>${formatMonth(point)}</span>`;
    tickContainer.appendChild(tick);
  }
}

function showTooltipAt(clientX, date) {
  if (!date) return;
  const rect = timeline.getBoundingClientRect();
  const left = rect.left + RAIL_PADDING;
  const right = rect.right - RAIL_PADDING;
  const clampedX = Math.min(Math.max(clientX, left), right);
  tooltip.textContent = formatDate(date.toISOString());
  tooltip.style.left = `${clampedX - rect.left}px`;
  tooltip.classList.add("is-visible");
}

function hideTooltip() {
  tooltip.classList.remove("is-visible");
}

function hideMenu() {
  menu.classList.remove("is-visible");
}

function showMenuAt(clientX, clientY) {
  const rect = timeline.getBoundingClientRect();
  const left = clientX - rect.left;
  const top = clientY - rect.top;
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.classList.add("is-visible");
}

function hidePanel() {
  panel.classList.remove("is-visible");
  panel.innerHTML = "";
}

function showPanel(content) {
  panel.innerHTML = content;
  panel.classList.add("is-visible");
}

function createEventDot({ date, name, color }) {
  const wrapper = document.createElement("div");
  wrapper.className = "timeline__event";
  const dot = document.createElement("div");
  dot.className = "timeline__event-dot";
  dot.style.background = color;
  const label = document.createElement("span");
  label.textContent = name;
  wrapper.appendChild(label);
  wrapper.appendChild(dot);
  eventContainer.appendChild(wrapper);
  return { date, name, color, element: wrapper };
}

function createPhaseBar({ start, end, name, color }) {
  const bar = document.createElement("div");
  bar.className = "timeline__phase";
  bar.textContent = name;
  bar.style.background = color;
  phaseContainer.appendChild(bar);
  return { start, end, name, color, element: bar };
}

function renderItems() {
  const range = getRange();
  if (!range) return;

  state.events.forEach((item) => {
    const ratio = positionForDate(item.date);
    item.element.style.left = `${ratio * 100}%`;
  });

  state.phases.forEach((phase, index) => {
    const startRatio = positionForDate(phase.start);
    const endRatio = positionForDate(phase.end);
    const left = Math.min(startRatio, endRatio) * 100;
    const width = Math.max(Math.abs(endRatio - startRatio) * 100, 2);
    phase.element.style.left = `${left}%`;
    phase.element.style.width = `${width}%`;
    phase.element.style.top = `${index * 28}px`;
  });
}

function updateTimeline() {
  const startValue = startInput.value;
  const endValue = endInput.value;

  if (!startValue || !endValue) return;

  startLabel.textContent = formatDate(startValue);
  endLabel.textContent = formatDate(endValue);
  buildTicks(startValue, endValue);
  renderItems();
}

function openSingleEventForm() {
  const selected = state.selectedDate;
  if (!selected) return;
  showPanel(`
    <h3>Eintägiges Ereignis</h3>
    <label>
      Name
      <input type="text" id="single-name" placeholder="z. B. Kickoff" />
    </label>
    <label>
      Farbe
      <input type="color" id="single-color" value="#2f5dff" />
    </label>
    <div class="panel-actions">
      <button type="button" id="single-save">Ereignis setzen</button>
      <button type="button" class="secondary" id="single-cancel">Abbrechen</button>
    </div>
  `);

  panel.querySelector("#single-save").addEventListener("click", () => {
    const name = panel.querySelector("#single-name").value.trim();
    const color = panel.querySelector("#single-color").value;
    if (!name) return;
    const eventItem = createEventDot({ date: selected, name, color });
    state.events.push(eventItem);
    renderItems();
    hidePanel();
  });

  panel.querySelector("#single-cancel").addEventListener("click", hidePanel);
}

function openMultiEventStartForm() {
  const selected = state.selectedDate;
  if (!selected) return;
  showPanel(`
    <h3>Mehrtägiges Ereignis</h3>
    <label>
      Gruppenname
      <input type="text" id="multi-name" placeholder="z. B. Workshop" />
    </label>
    <label>
      Gruppenfarbe
      <input type="color" id="multi-color" value="#ff8c42" />
    </label>
    <div class="panel-actions">
      <button type="button" id="multi-start">Startpunkt setzen</button>
      <button type="button" class="secondary" id="multi-cancel">Abbrechen</button>
    </div>
  `);

  panel.querySelector("#multi-start").addEventListener("click", () => {
    const name = panel.querySelector("#multi-name").value.trim();
    const color = panel.querySelector("#multi-color").value;
    if (!name) return;
    state.currentMulti = { name, color };
    const eventItem = createEventDot({ date: selected, name, color });
    state.events.push(eventItem);
    renderItems();
    openMultiEventNextStep();
  });

  panel.querySelector("#multi-cancel").addEventListener("click", () => {
    state.currentMulti = null;
    hidePanel();
  });
}

function openMultiEventNextStep(message = "Neuen Punkt hinzufügen?") {
  if (!state.currentMulti) return;
  showPanel(`
    <h3>${state.currentMulti.name}</h3>
    <p style="font-size:12px;color:var(--muted);">${message}</p>
    <label>
      Nächster Punktname
      <input type="text" id="multi-point-name" placeholder="z. B. Review" />
    </label>
    <div class="panel-actions">
      <button type="button" id="multi-add">Neuen Punkt hinzufügen</button>
      <button type="button" class="secondary" id="multi-finish">Ereignis beenden</button>
    </div>
  `);

  panel.querySelector("#multi-add").addEventListener("click", () => {
    const name = panel.querySelector("#multi-point-name").value.trim();
    if (!name) return;
    state.pendingPointName = name;
    state.awaitingPoint = true;
    openMultiEventNextStep("Klicke auf den Zeitstrahl, um den neuen Punkt zu platzieren.");
  });

  panel.querySelector("#multi-finish").addEventListener("click", () => {
    state.currentMulti = null;
    state.awaitingPoint = false;
    state.pendingPointName = "";
    hidePanel();
  });
}

function openPhaseForm() {
  const selected = state.selectedDate;
  if (!selected) return;
  const defaultEnd = new Date(selected);
  defaultEnd.setDate(defaultEnd.getDate() + 14);
  showPanel(`
    <h3>Phase erstellen</h3>
    <label>
      Name
      <input type="text" id="phase-name" placeholder="z. B. Planung" />
    </label>
    <label>
      Farbe
      <input type="color" id="phase-color" value="#5bc0be" />
    </label>
    <label>
      Enddatum
      <input type="date" id="phase-end" value="${defaultEnd.toISOString().slice(0, 10)}" />
    </label>
    <div class="panel-actions">
      <button type="button" id="phase-save">Phase setzen</button>
      <button type="button" class="secondary" id="phase-cancel">Abbrechen</button>
    </div>
  `);

  panel.querySelector("#phase-save").addEventListener("click", () => {
    const name = panel.querySelector("#phase-name").value.trim();
    const color = panel.querySelector("#phase-color").value;
    const endValue = panel.querySelector("#phase-end").value;
    if (!name || !endValue) return;
    const endDate = new Date(endValue);
    const phaseItem = createPhaseBar({ start: selected, end: endDate, name, color });
    state.phases.push(phaseItem);
    renderItems();
    hidePanel();
  });

  panel.querySelector("#phase-cancel").addEventListener("click", hidePanel);
}

menu.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  hideMenu();
  hidePanel();
  const action = button.dataset.action;
  if (action === "single") {
    openSingleEventForm();
  }
  if (action === "multi") {
    openMultiEventStartForm();
  }
  if (action === "phase") {
    openPhaseForm();
  }
});

timeline.addEventListener("mousemove", (event) => {
  const date = dateFromPosition(event.clientX);
  showTooltipAt(event.clientX, date);
});

timeline.addEventListener("mouseleave", hideTooltip);

timeline.addEventListener("click", (event) => {
  if (menu.contains(event.target) || panel.contains(event.target)) return;
  const date = dateFromPosition(event.clientX);
  if (!date) return;
  state.selectedDate = date;

  if (state.awaitingPoint && state.currentMulti) {
    const eventItem = createEventDot({
      date,
      name: state.pendingPointName,
      color: state.currentMulti.color,
    });
    state.events.push(eventItem);
    state.awaitingPoint = false;
    state.pendingPointName = "";
    renderItems();
    openMultiEventNextStep();
    return;
  }

  showMenuAt(event.clientX, event.clientY);
});

document.addEventListener("click", (event) => {
  if (!timeline.contains(event.target)) {
    hideMenu();
  }
});

startInput.addEventListener("change", updateTimeline);
endInput.addEventListener("change", updateTimeline);

updateTimeline();
