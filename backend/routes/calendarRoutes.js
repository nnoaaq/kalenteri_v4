require("dotenv").config();
const express = require("express");
const router = express.Router();
const { createAuthClient } = require("../utils/authUtils");
const { google } = require("googleapis");
router.get("/get-list", async (req, res) => {
  if (req.session.tokens) {
    const calendars = [];
    const tokens = req.session.tokens;
    const authClient = await createAuthClient();
    authClient.setCredentials(tokens);
    const calendar = google.calendar({
      version: "v3",
      auth: authClient,
    });
    const userCalendarData = await calendar.calendarList.list();
    for (let calendarData of userCalendarData.data.items) {
      calendars.push({
        id: calendarData.id,
        summary: calendarData.summary,
      });
    }
    return res.json(calendars);
  }
  res.json({
    calendars: [],
  });
});
module.exports = router;
