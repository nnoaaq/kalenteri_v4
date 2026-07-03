require("dotenv").config();
const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { createAuthClient } = require("../utils/authUtils");
router.get("/verify", (req, res) => {
  const tokens = req.session.tokens;
  if (tokens) return res.json({ success: true });
  return res.json({ success: false });
});
router.get("/generate-auth-url", async (req, res) => {
  const oAuthClient = await createAuthClient();
  const authUrl = await oAuthClient.generateAuthUrl({
    scope: "https://www.googleapis.com/auth/calendar",
  });
  res.json({
    authUrl: authUrl,
  });
});
router.get("/google-success", async (req, res) => {
  const oAuthClient = await createAuthClient();
  const code = req.query.code;
  const { tokens } = await oAuthClient.getToken(code);
  req.session.tokens = tokens;
  res.redirect("/");
});
module.exports = router;
