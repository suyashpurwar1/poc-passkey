const User = require("../models/User");
const Passkey = require("../models/Passkey");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const challengeStore = require("../utils/challengeStore");
const { v4: uuidv4 } = require("uuid");

exports.register = async (req, res) => {
  let { email, password, username } = req.body;
  username=email;
  if (!email || !password || !username) {
    return res
      .status(400)
      .json({ error: "Email, password, and username are required" });
  }

  try {
    const user = new User({
      user_id: uuidv4(),
      passkey_user_id: uuidv4(),
      email,
      password,
      username,
    });
    await user.save();

    return res.status(201).json({ id: user._id, email: user.email });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email already in use" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    return res
      .status(500)
      .json({ error: "Error registering user", details: error.message });
  }
};

exports.getUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found!" });

    return res.json({ email: user.email });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Error fetching user" });
  }
};

exports.registerChallenge = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found!" });

    const challengePayload = await generateRegistrationOptions({
      rpID: "localhost",
      rpName: "My Localhost Machine",
      attestationType: "none",
      userName: user.email,
      timeout: 30000,
    });

    challengeStore[userId] = challengePayload.challenge;

    return res.json({ options: challengePayload });
  } catch (error) {
    console.error("Error generating challenge:", error);
    return res.status(500).json({ error: "Error generating challenge" });
  }
};

exports.registerVerify = async (req, res) => {
  const { userId, cred } = req.body;
  const challenge = challengeStore[userId];

  console.log("Challenge:", challenge); // Log the challenge
  console.log("Received Credential:", cred); // Log the received credential

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found!" });

    const verification = await verifyRegistrationResponse({
      response: cred,
      expectedChallenge: challenge,
      expectedOrigin: "http://localhost:3000",
      expectedRPID: "localhost",
    });

    if (!verification.verified) {
      return res.status(400).json({ error: "Verification failed" });
    }

    const {
      credentialID,
      credentialPublicKey,
      counter,
      credentialBackedUp,
      credentialDeviceType,
    } = verification.registrationInfo;

    console.log("Credential Backed Up:", credentialBackedUp); // Log credential backup status
    console.log("Credential Device Type:", credentialDeviceType); // Log credential device type

    const passkey = new Passkey({
      cred_id: Buffer.from(credentialID).toString("base64url"),
      cred_public_key: Buffer.from(credentialPublicKey),
      internal_user_id: user._id,
      passkey_user_id: user.passkey_user_id, // Ensure this is set
      webauthn_user_id: cred.response.userHandle, // Ensure this property exists in cred.response
      counter,
      transports:cred.response.transports,
      deviceType: credentialDeviceType,
      backUp: credentialBackedUp,
    });

    await passkey.save();

    return res.json({ success: true });
  } catch (error) {
    console.error("Error verifying registration:", error);
    return res.status(500).json({ error: "Error verifying registration" });
  }
};


exports.loginChallenge = async (req, res) => {
  try {
    const opts = await generateAuthenticationOptions({
      rpID: "localhost",
      allowCredentials: [],
    });

    // Save the challenge in the session
    req.session.authChallenge = opts.challenge;

    console.log("Generated Challenge:", opts.challenge); // Log the generated challenge

    return res.json({ options: opts });
  } catch (error) {
    console.error("Error generating login challenge:", error);
    return res.status(500).json({ error: "Error generating login challenge" });
  }
};

exports.loginVerify = async (req, res) => {
  const { cred } = req.body;

  try {
    // Decode the credential ID from base64url
   const credentialId = Buffer.from(cred.id).toString("base64url");
    console.log(credentialId);
    // Find the passkey using the credential ID
    const passkey = await Passkey.findOne({ cred_id: credentialId });

    if (!passkey) {
      return res.status(404).json({ error: "Passkey not found!" });
    }

    // Find the user using the passkey_user_id
    const user = await User.findOne({
      passkey_user_id: passkey.passkey_user_id,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    // Retrieve the challenge from the session
    const challenge = req.session.authChallenge;

    if (!challenge) {
      return res
        .status(400)
        .json({ error: "No authentication challenge found" });
    }

    console.log("Challenge in LoginVerify:", challenge);
    console.log("Passkey in LoginVerify:", passkey);

    const result = await verifyAuthenticationResponse({
      response: cred,
      expectedChallenge: challenge,
      expectedOrigin: process.env.EXPECTED_ORIGIN || "http://localhost:3000",
      expectedRPID: process.env.EXPECTED_RPID || "localhost",
      authenticator: {
        credentialID: Buffer.from(passkey.cred_id, "base64"),
        credentialPublicKey: passkey.cred_public_key,
        counter: passkey.counter,
      },
    });

    console.log("Verification Result:", result);

    if (!result.verified) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    // Update the counter
    passkey.counter = result.authenticationInfo.newCounter;
    await passkey.save();

    // Set session data
    req.session.userId = user._id;
    req.session.email = user.email;
    req.session.signedIn = true;

    // Clear the challenge from the session
    delete req.session.authChallenge;

    return res.json({
      success: true,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error("Error verifying login:", error);
    // Clear the challenge on error
    delete req.session.authChallenge;
    return res.status(500).json({ error: "Error verifying login" });
  }
};