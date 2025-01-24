const express = require('express');
const { signUp, login,  getUserProfile} = require('../controllers/authController');
const {authenticateToken} = require('../middlewares/authMiddleware');
const {linkedInCallback} = require("../controllers/linkedInAuth");
const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);





// LinkedIn authentication route
router.get("/linkedin", (req, res) => {
  const linkedInAuthURL = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}&scope=openid%20profile%20email`;
  res.redirect(linkedInAuthURL);
});

// LinkedIn callback route
router.get('/linkedin/callback', linkedInCallback);
router.get('/me', authenticateToken, getUserProfile)


module.exports = router;
