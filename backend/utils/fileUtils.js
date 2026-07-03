const { extractText, getDocumentProxy } = require("unpdf");

async function convertBufferToText(buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, {
    mergePages: true,
    format: "json",
  });
  return text;
}
function convertMinutesToUTC(date, timeMinutes) {
  const [day, month, year] = dateStr.split(".").map(Number);

  // Oletetaan, että convertMinutesToTime palauttaa esim. "14:30"
  const [hour, minute] = convertMinutesToTime(timeMinutes)
    .split(":")
    .map(Number);

  // 1. Luodaan päivämäärämerkkijonosta ISO-formaatin mukainen (Suomen ajassa)
  // Esimerkiksi: "2026-07-03T14:30:00"
  const localIsoStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;

  // 2. Pakotetaan tulkinta Suomen aikavyöhykkeelle (Europe/Helsinki)
  // Tämä ottaa automaattisesti huomioon kesä- ja talviajan (DST) kyseisenä päivänä!
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Luodaan päivämääräolio ja korjataan se Suomen aikaan
  const dateObj = new Date(localIsoStr);

  // Koska halutaan kertoa että syötetty aika oli nimenomaan Suomen aikaa,
  // lasketaan ero UTC-aikaan:
  const tzDate = new Date(
    dateObj.toLocaleString("en-US", { timeZone: "Europe/Helsinki" }),
  );
  const diff = tzDate.getTime() - dateObj.getTime();

  // Luodaan lopullinen UTC-olio vähentämällä aikaero
  const utcDate = new Date(dateObj.getTime() - diff);

  return utcDate.toISOString();
  // const [day, month, year] = date.split(".").map(Number);
  // const [hour, minute] = convertMinutesToTime(timeMinutes)
  //   .split(":")
  //   .map(Number);
  // const dateObj = new Date(year, month - 1, day, hour, minute);
  // const timezoneOffset = -dateObj.getTimezoneOffset();
  // return `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}-${dateObj.getDate().toString().padStart(2, "0")}T${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}:00+${(timezoneOffset / 60).toString().padStart(2, "0")}:00`;
}
function convertStartTimeToDate(start) {
  const startDate = new Date(start);
  const options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  };
  return startDate.toLocaleDateString("fi-FI", options);
}
function convertTimeToMinutes(time) {
  // hh:mm muodossa kaikki
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
function convertMinutesToTime(minutes) {
  const clockHours = Math.floor(minutes / 60);
  const clockMinutes = minutes % 60;
  return `${clockHours}:${clockMinutes}`;
}
function calculateMealBreakDuration(row) {
  const times = row[0].match(/\d{2}:\d{2}\s-\s\d{2}:\d{2}/g);
  const [start, end] = times[0].split("-");
  return convertTimeToMinutes(end) - convertTimeToMinutes(start);
}
function calculateDayDuration(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate - startDate) / 60000;
}
function findWorkDaysFromText(text) {
  const daysProcessed = [];
  const foundDateMatches = [...text.matchAll(/\d{1,2}\.\d{1,2}\.\d{4}/g)].map(
    // 12.12.2026 tai 1.1.2026
    (match) => ({ date: match[0], index: match.index }),
    // Vain osuma ja sijainti
  );
  const foundDays = foundDateMatches.map((day, dayIndex) => {
    const startPos = day.index;
    const endPos = foundDateMatches[dayIndex + 1]
      ? foundDateMatches[dayIndex + 1].index
      : text.indexOf("Jakson");
    return {
      date: day.date,
      rows: text.slice(startPos, endPos),
    };
  });
  // Jokainen löydetty päivä omana olionaan, alkaen osumasta ja loppuen seuraavaan osumaan
  // Sisältää turhia osumia, kuten { date: '9.3.2026', rows: '9.3.2026 - ' }, koska seuraava osuma on ollut heti.
  // 9.3.2026 - 22.3.2026

  for (let day of foundDays) {
    const dayReadyForCalendar = {
      start: { dateTime: "", timeZone: "Europe/Helsinki" },
      end: { dateTime: "", timeZone: "Europe/Helsinki" },
      summary: "",
      description: "",
    };
    day.rows = day.rows
      .replace(/(\d{2}:\d{2}\s-\s\d{2}:\d{2})/g, "\n$1")
      .split("\n")
      .filter((line) => /^\d{2}:\d{2}\s-\s\d{2}:\d{2}/.test(line));
    if (!Array.isArray(day.rows)) console.log("HMm");

    day.rows = day.rows.map((row) => {
      return row
        .replace(/(.*)(Siirtymä kävellen).*/, "$1 [$2]")
        .replace(
          /(.*)(Aloitusaika ja siirtyminen muulla autolla).*/,
          "$1 [Siirtyminen pikku-autolla]",
        )
        .replace(/(.*)(Aloitusaika).*/, "$1 [$2]")
        .replace(/(.*)(Ptau muunnettu työajaksi).*/, "$1 [$2]")
        .replace(/(.*)(Lopetusaika).*/, "$1 [$2]")
        .replace(/(.*)(Siirtymän odotus \(p\)).*/, "$1 [Siirtymä odotus (p)]")
        .replace(/(.*)(Siirtymän odotus).*/, "$1 [$2]")
        .replace(/(.*)(Ruokatauko).*/, "$1 [$2]")
        .replace(/(.*)(Varallaoloaika).*/, "$1 [$2]")
        .replace(/(.*)(Koulutus).*/, "$1 [$2]")
        .replace(/(.*)(Auto varikolle).*/, "$1 [$2]")
        .replace(/(.*)(Auto varikolta).*/, "$1 [$2]")
        .replace(/(.*)(Siirtymä matkustajana).*/, "$1 [$2]")
        .replace(
          /(.*)(Siirtyminen muulla autolla).*/,
          "$1 [Siirtyminen pikku-autolla]",
        )
        .replace(/(.*)(Matkustus vuorolla \d{3}).*/, "$1 [$2]")
        .replace(/CAR\s\d{3}\s/, "")
        .replace(/(.*)(\d{3})(.*)(?!.*\d{3})/, "$1[Vuoro : <u>$2</u>]$3")
        .replace(/(.*)(Linja-ajoa).*/, "$1 [$2]");
    });
    // console.log(day.rows);
    // const lunchBreakRow = day.rows.map((row) => row.match(/.*\[Ruokatauko\]/));
    // console.log(lunchBreakRow);
    if (day.rows.length) {
      // rows sisältää "päiväohjelman" (kellonaikoja löytynyt)
      const foundLines = day.rows.flatMap(
        (row) =>
          row.match(/(?<!:|\[.*|d)[345679]\d{1,2}?[ANVBK]?(?!\d)/g) ?? [],
      );
      dayReadyForCalendar.summary =
        [...new Set(foundLines)].join(" | ") || "Varapohja";
      const foundClockTimes = day.rows
        .flatMap((row) =>
          (row.match(/\d{2}:\d{2}/g) || []).map(convertTimeToMinutes),
        )
        .sort((a, b) => a - b);
      // ajat minuutteina
      ((dayReadyForCalendar.start.dateTime = convertMinutesToUTC(
        day.date,
        foundClockTimes[0],
      )),
        (dayReadyForCalendar.end.dateTime = convertMinutesToUTC(
          day.date,
          foundClockTimes[foundClockTimes.length - 1],
        )));
      dayReadyForCalendar.description = day.rows.join("\n\n");
      dayReadyForCalendar.lunchBreak = calculateMealBreakDuration(
        dayReadyForCalendar.description.match(/.*\[Ruokatauko\]/g),
      );
      dayReadyForCalendar.dayDuration = calculateDayDuration(
        dayReadyForCalendar.start.dateTime,
        dayReadyForCalendar.end.dateTime,
      );
      dayReadyForCalendar.description =
        `Työpäivän pituus : ${convertMinutesToTime(dayReadyForCalendar.dayDuration)}h\n\nRuokatauon pituus : ${dayReadyForCalendar.lunchBreak}min\n\n` +
        dayReadyForCalendar.description;
    }
    // JOkainen tapahtuma
    if (dayReadyForCalendar.description.length > 0) {
      daysProcessed.push(dayReadyForCalendar);
    }
  }
  return daysProcessed;
}
module.exports = {
  convertBufferToText,
  findWorkDaysFromText,
  convertStartTimeToDate,
};
