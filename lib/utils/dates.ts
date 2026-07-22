const TIME_ZONE = "America/Los_Angeles";

export const localDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

export const formatDate = (value: string | Date, options: Intl.DateTimeFormatOptions = {}) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, ...options }).format(new Date(value));

export const formatTime = (value: string | Date) =>
  formatDate(value, { hour: "numeric", minute: "2-digit" });

export const formatDateTimeLocal = (value: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

export const greeting = (date = new Date()) => {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", hourCycle: "h23" }).format(date));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

export const todayUtcRange = (date = new Date()) => {
  const key = localDateKey(date);
  const noonUtc = new Date(`${key}T12:00:00Z`);
  const offsetName = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "longOffset" })
    .formatToParts(noonUtc).find((p) => p.type === "timeZoneName")?.value ?? "GMT-08:00";
  const offset = offsetName.replace("GMT", "") || "+00:00";
  return { start: new Date(`${key}T00:00:00${offset}`).toISOString(), end: new Date(`${key}T23:59:59.999${offset}`).toISOString() };
};

export const fromLosAngelesLocal = (value: string) => {
  const [datePart] = value.split("T");
  const noonUtc = new Date(`${datePart}T12:00:00Z`);
  const offsetName = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "longOffset" })
    .formatToParts(noonUtc).find((p) => p.type === "timeZoneName")?.value ?? "GMT-08:00";
  return new Date(`${value}:00${offsetName.replace("GMT", "") || "+00:00"}`).toISOString();
};

export { TIME_ZONE };
