const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// LinkedIn OAuth Callback Handler
const linkedInCallback = async (req, res) => {
  try {
    const { code } = req.query; 

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is missing' });
    }

    // Exchange authorization code for an access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      return res.status(500).json({ message: 'Failed to retrieve access token from LinkedIn' });
    }

    // Fetch user profile using /v2/userinfo endpoint
    const profileResponse = await axios.get(
      'https://api.linkedin.com/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const { sub, name, email } = profileResponse.data;

    let user = await User.findOne({ linkedinId: sub });

    if (!user) {
      user = new User({
        email: email,
        linkedinId: sub,
        name: name,
        password: undefined, // Explicitly leave the password empty for LinkedIn users
      });
      try {
        await user.save();
        console.log('User saved successfully');
      } catch (error) {
        console.error('Error saving LinkedIn user:', error);
      } 
    }

    const appToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('appToken', appToken) 
    res.redirect(`${process.env.FRONTEND_SERVER_URI}/loginWithLinkedIn/?token=${appToken}`); 
  } catch (error) {
    console.error('Error during LinkedIn authentication:', error.response?.data || error.message);
    res.status(500).json({ message: 'Internal Server Error during LinkedIn authentication' });
  }
};

module.exports = { linkedInCallback };
