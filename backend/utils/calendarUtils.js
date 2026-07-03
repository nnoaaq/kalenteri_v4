require("dotenv").config();
const { google } = require("googleapis");
const { createAuthClient } = require("../utils/authUtils");
async function sendWorkDayToCalendar(workDay, calendarId, tokens) {
  const authClient = await createAuthClient();
  authClient.setCredentials(tokens);
  const calendar = google.calendar({
    version: "v3",
    auth: authClient,
  });
  const calendarRes = await calendar.events.insert({
    calendarId: calendarId,
    requestBody: workDay,
  });
  if (calendarRes.ok) return { success: true };
  //return { success: true };
}
module.exports = {
  sendWorkDayToCalendar,
};
