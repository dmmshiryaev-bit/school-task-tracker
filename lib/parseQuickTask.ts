const MONTHS: Record<string, number> = {
  января: 0,
  февраля: 1,
  марта: 2,
  апреля: 3,
  мая: 4,
  июня: 5,
  июля: 6,
  августа: 7,
  сентября: 8,
  октября: 9,
  ноября: 10,
  декабря: 11,
};

const MONTH_ALTERS =
  "января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря";

const LEADING_WORDS = new Set([
  "добавить",
  "добавь",
  "создать",
  "создай",
  "записать",
  "запиши",
  "надо",
  "нужно",
  "задачу",
  "задание",
  "задачи",
  "задания",
  "сделать",
  "сделай",
  "поставить",
  "поставь",
  "домашку",
  "домашка",
  "домашнее",
  "урок",
  "уроки",
  "к",
  "на",
  "в",
]);

function escapeRegExp(src: string): string {
  return src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type ParsedQuickTask = {
  title: string;
  subjectName: string;
  dueDate: Date | null;
  dueTime: string | null;
};

export type ParsedQuickTaskError = {
  error: string;
};

export function parseQuickTask(
  rawText: string,
  subjects: { name: string }[],
  now: Date,
): ParsedQuickTask | ParsedQuickTaskError {
  const text = rawText.trim();
  if (!text) return { error: "Введи, что нужно добавить" };

  const guess = ` ${text.toLowerCase().replace(/\s+/g, " ")} `;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let dueDate: Date | null = null;
  let dateToken: string | null = null;

  const monthMatch = guess.match(
    new RegExp(`(?:на\\s+)?(\\d{1,2})\\s+(${MONTH_ALTERS})`),
  );
  const numMatch = monthMatch
    ? null
    : guess.match(/(?:на\s+)?(\d{1,2})[./](\d{1,2})/);

  if (monthMatch) {
    const day = Number(monthMatch[1]);
    const month = MONTHS[monthMatch[2]];
    let year = now.getFullYear();
    if (new Date(year, month, day).getTime() < today.getTime()) year += 1;
    dueDate = new Date(year, month, day);
    dateToken = monthMatch[0];
  } else if (numMatch) {
    const day = Number(numMatch[1]);
    const month = Number(numMatch[2]) - 1;
    let year = now.getFullYear();
    if (new Date(year, month, day).getTime() < today.getTime()) year += 1;
    dueDate = new Date(year, month, day);
    dateToken = numMatch[0];
  }

  let dueTime: string | null = null;
  let timeToken: string | null = null;
  const timeMatch = guess.match(/(?:в\s+)(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const h = Number(timeMatch[1]);
    const m = Number(timeMatch[2]);
    if (h <= 23 && m <= 59) {
      dueTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      timeToken = timeMatch[0];
    }
  }

  let subjectName: string | null = null;
  let bestIdx = Number.POSITIVE_INFINITY;
  for (const s of subjects) {
    const lower = s.name.toLowerCase();
    const idx = guess.indexOf(lower);
    if (idx === -1) continue;
    const beforeOk = idx === 0 || /\s/.test(guess[idx - 1]);
    const after = guess[idx + lower.length];
    const afterOk = !after || /[\s.,!)?]/.test(after);
    if (beforeOk && afterOk && idx < bestIdx) {
      bestIdx = idx;
      subjectName = s.name;
    }
  }

  if (!subjectName) {
    return {
      error:
        "Не удалось определить предмет. Например: добавить на 15 сентября физика в 11:20",
    };
  }

  let titleGuess = text;
  for (const token of [subjectName, dateToken, timeToken]) {
    if (token) {
      titleGuess = titleGuess.replace(
        new RegExp(escapeRegExp(token), "gi"),
        " ",
      );
    }
  }

  const words = titleGuess
    .split(/\s+/)
    .map((word) => word.replace(/[.,!?:;]/g, ""))
    .filter(
      (word) =>
        word &&
        !/^\d+$/.test(word) &&
        !LEADING_WORDS.has(word.toLowerCase()),
    );

  const title = words.join(" ").replace(/\s+/g, " ").trim() || subjectName;

  return { title, subjectName, dueDate, dueTime };
}