Based on the updated project structure and your inputs, here is the revised README:

# Passkey Authentication POC

This project demonstrates a proof of concept (POC) for implementing passkey authentication using Node.js, Express, SimpleWebAuthn, and MongoDB. The application allows users to register and authenticate using passkeys (WebAuthn), ensuring a secure and passwordless login experience.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Flow](#project-flow)
- [File Structure](#file-structure)

## Installation

To get started with this project, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/suyashpurwar1/poc-passkey.git
   cd passkey-authentication-poc
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the root directory of the project and add your MongoDB URL:
```plaintext
MONGO_URI=your_mongodb_connection_string
```

## Usage

1. Start the server:
   ```bash
   node app.js
   ```
   or, if you prefer using `nodemon` for automatic restarts during development:
   ```bash
   nodemon app.js
   ```

2. Open your web browser and navigate to `http://localhost:3000`.

3. Register a new user and follow the on-screen instructions to complete the passkey registration process.

4. Log in with the registered user using the passkey.

## Project Flow

1. **Registration**:
   - User registers with their email and password.
   - The server generates a registration challenge using SimpleWebAuthn.
   - The challenge is sent to the client, which uses it to create a new credential.
   - The client sends the credential back to the server for verification.
   - The server verifies the credential and stores the public key and other necessary information in MongoDB.

2. **Authentication**:
   - User enters their email to initiate the login process.
   - The server generates an authentication challenge.
   - The challenge is sent to the client, which uses it to create an authentication assertion.
   - The client sends the assertion back to the server for verification.
   - The server verifies the assertion and logs the user in if verification is successful.

## File Structure

```
.
├── config
│   └── db.js
├── controllers
│   └── authController.js
├── models
│   ├── User.js
│   └── Passkey.js
├── node_modules
├── public
│   ├── index.html
│   ├── login.html
│   ├── profile.html
│   ├── signup.html
│   └── styles.css
├── routes
│   └── auth.js
├── utils
│   └── challengeStore.js
├── .env
├── .gitignore
├── app.js
├── launch.json
├── package-lock.json
├── package.json
└── README.md
```
