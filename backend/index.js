require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
const fileRoutes = require("./routes/fileRoutes");
const authRoutes = require("./routes/authRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const session = require("express-session");
const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(
  session({
    secret: "salaus avain",
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 10000 * 60,
      secure: false,
      sameSite: "lax",
    },
  }),
);
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use("/file", fileRoutes);
app.use("/auth", authRoutes);
app.use("/calendar", calendarRoutes);
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});
app.listen(process.env.PORT || 3000, () => {
  console.log(
    `Palvelin käynnissä osoitteessa ${process.env.SERVER}:${process.env.PORT}`,
  );
});
