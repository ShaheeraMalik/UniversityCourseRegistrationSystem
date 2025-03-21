// routes/auth.js
const express = require("express");
const router = express.Router();
const { loginMiddleware } = require("../middlewares/login");

// GET: Render the shared login page (views/auth/login.ejs)
router.get("/login", (req, res) => {
  res.render("auth/login");
});

// POST: Process login using the combined middleware
router.post("/login", loginMiddleware);

// GET: Logout route
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
});

module.exports = router;
