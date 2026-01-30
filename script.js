const startInput = document.querySelector("#start-date");
const endInput = document.querySelector("#end-date");
const ticksContainer = document.querySelector(".timeline__ticks");
const minorTicksContainer = document.querySelector(".timeline__minor");
const track = document.querySelector(".timeline__track");
const tooltip = document.querySelector(".timeline__tooltip");

const formatShortDate = (date) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
};

const formatLongDate = (date) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const parseInputDate = (value) => {
  if (!value) return null;
  const normalized = value.trim();
  const germanMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/.exec(normalized);
  if (germanMatch) {
    const [, day, month, year] = germanMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const date = new Date(
      Number(fullYear),
      Number(month) - 1,
      Number(day)
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const isoDate = new Date(normalized);
  return Number.isNaN(isoDate.getTime()) ? null : isoDate;
};

const renderTicks = () => {
  ticksContainer.innerHTML = "";
  minorTicksContainer.innerHTML = "";
  const startDate = parseInputDate(startInput.value);
  const endDate = parseInputDate(endInput.value);

  if (!startDate || !endDate || startDate > endDate) {
    return;
  }

  const totalSpan = endDate.getTime() - startDate.getTime();
  if (totalSpan <= 0) return;

  const monthTicks = [startDate];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
  while (cursor < endDate) {
    monthTicks.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  if (
    endDate.getTime() !== monthTicks[monthTicks.length - 1].getTime()
  ) {
    monthTicks.push(endDate);
  }

  monthTicks.forEach((tick) => {
    const label = document.createElement("span");
    label.className = "timeline__tick";
    label.textContent = formatShortDate(tick);
    const position =
      ((tick.getTime() - startDate.getTime()) / totalSpan) * 100;
    label.style.left = `${position}%`;
    ticksContainer.appendChild(label);
  });

  monthTicks.forEach((tick) => {
    if (tick <= startDate || tick >= endDate) return;
    const position =
      ((tick.getTime() - startDate.getTime()) / totalSpan) * 100;
    const mark = document.createElement("span");
    mark.className = "timeline__minor-tick";
    mark.style.left = `${position}%`;
    minorTicksContainer.appendChild(mark);
  });
};

startInput.addEventListener("input", renderTicks);
endInput.addEventListener("input", renderTicks);

const updateTooltip = (event) => {
  const startDate = parseInputDate(startInput.value);
  const endDate = parseInputDate(endInput.value);
  if (!startDate || !endDate || startDate > endDate) {
    tooltip.classList.remove("is-visible");
    tooltip.setAttribute("aria-hidden", "true");
    return;
  }

  const rect = track.getBoundingClientRect();
  const ratio = Math.min(
    1,
    Math.max(0, (event.clientX - rect.left) / rect.width)
  );
  const targetTime =
    startDate.getTime() + ratio * (endDate.getTime() - startDate.getTime());
  const targetDate = new Date(targetTime);

  tooltip.textContent = formatLongDate(targetDate);
  tooltip.style.left = `${ratio * 100}%`;
  tooltip.classList.add("is-visible");
  tooltip.setAttribute("aria-hidden", "false");
};

const hideTooltip = () => {
  tooltip.classList.remove("is-visible");
  tooltip.setAttribute("aria-hidden", "true");
};

track.addEventListener("mousemove", updateTooltip);
track.addEventListener("mouseleave", hideTooltip);
