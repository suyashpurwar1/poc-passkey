const express = require("express");
const {
  register,
  getUser,
  registerChallenge,
  registerVerify,
  loginChallenge,
  loginVerify,
} = require("../controllers/authController");
const router = express.Router();

router.post("/register", register);
router.get("/user/:userId", getUser);
router.post("/register-challenge", registerChallenge);
router.post("/register-verify", registerVerify);
router.post("/login-challenge", loginChallenge);
router.post("/login-verify", loginVerify);

module.exports = router;
