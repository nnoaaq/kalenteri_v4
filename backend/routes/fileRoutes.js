const express = require("express");
const router = express.Router();
const multer = require("multer");
const { sendWorkDayToCalendar } = require("../utils/calendarUtils");
const {
  convertBufferToText,
  findWorkDaysFromText,
  convertStartTimeToDate,
} = require("../utils/fileUtils");
const upload = multer({
  storage: multer.memoryStorage(),
});
router.post("/send", upload.single("file"), async (req, res) => {
  if (!req.body || !req.file)
    return res.json({ error: "Kalenterin tunnus tai tiedosto uupuu." });
  // calendarId ja pdf löytyy
  const pdfFileBuffer = req.file.buffer;
  const calendarId = req.body.calendar;
  const tokens = req.session.tokens;
  const text = await convertBufferToText(pdfFileBuffer);
  const workDays = await findWorkDaysFromText(text);
  const addedWorkDaysIntoCalendar = [];
  for (let workDay of workDays) {
    const addedDay = await sendWorkDayToCalendar(workDay, calendarId, tokens);
    if (addedDay.success) {
      addedWorkDaysIntoCalendar.push({
        summary: workDay.summary,
        date: convertStartTimeToDate(workDay.start.dateTime),
        start: workDay.start.dateTime,
        end: workDay.end.dateTime,
        lunchBreak: workDay.lunchBreak,
        dayDuration: workDay.dayDuration,
      });
    }
  }
  res.json({
    workDays: addedWorkDaysIntoCalendar,
  });
});

module.exports = router;
