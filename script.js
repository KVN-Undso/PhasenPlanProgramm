const startInput = document.querySelector("#start-date");
const endInput = document.querySelector("#end-date");
const ticksContainer = document.querySelector(".timeline__ticks");
const minorTicksContainer = document.querySelector(".timeline__minor");

const formatShortDate = (date) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
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

  const ticks = [
    startDate,
    new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1),
    new Date(startDate.getFullYear(), startDate.getMonth() + 2, 1),
    endDate,
  ];

  const uniqueTicks = ticks.filter(
    (tick, index, list) =>
      list.findIndex(
        (item) =>
          item.getFullYear() === tick.getFullYear() &&
          item.getMonth() === tick.getMonth() &&
          item.getDate() === tick.getDate()
      ) === index
  );

  uniqueTicks.forEach((tick) => {
    const label = document.createElement("span");
    label.textContent = formatShortDate(tick);
    ticksContainer.appendChild(label);
  });

  const totalSpan = endDate.getTime() - startDate.getTime();
  if (totalSpan <= 0) return;

  uniqueTicks.forEach((tick) => {
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
