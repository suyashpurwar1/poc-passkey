const User = require("../models/User");
const Passkey = require("../models/Passkey");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const challengeStore = require("../utils/challengeStore");

exports.register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = new User({ email, password });
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
      webauthn_user_id: cred.response.userHandle, // Ensure this property exists in cred.response
      counter,
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
  const { email } = req.body;

  console.log("Email:", email); // Log the email received
  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found!" });

    const opts = await generateAuthenticationOptions({
      userVerification: "preferred",
      allowCredentials: [],
    });

    challengeStore[user._id] = opts.challenge;

    console.log("Generated Challenge:", opts.challenge); // Log the generated challenge

    return res.json({ options: opts });
  } catch (error) {
    console.error("Error generating login challenge:", error);
    return res.status(500).json({ error: "Error generating login challenge" });
  }
};

exports.loginVerify = async (req, res) => {
  const { email, cred } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found!" });

    const challenge = challengeStore[user._id];
    const passkey = await Passkey.findOne({ internal_user_id: user._id });

    if (!passkey) return res.status(404).json({ error: "Passkey not found!" });

    console.log("Challenge in LoginVerify:", challenge); // Log the challenge
    console.log("Passkey in LoginVerify:", passkey); // Log the passkey

    const result = await verifyAuthenticationResponse({
      response: cred,
      expectedChallenge: challenge,
      expectedOrigin: "http://localhost:3000",
      expectedRPID: "localhost",
      authenticator: {
        credentialID: passkey.cred_id,
        credentialPublicKey: passkey.cred_public_key,
        counter: passkey.counter,
      },
    });

    console.log("Verification Result:", result); // Log the verification result

    if (!result.verified) return res.json({ error: "Something went wrong" });

    if (result.verified) {
      const { authenticationInfo } = result;
      const { newCounter } = authenticationInfo;
      passkey.counter = newCounter;
      await passkey.save();
    }

    return res.json({
      success: true,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error("Error verifying login:", error);
    return res.status(500).json({ error: "Error verifying login" });
  }
};
