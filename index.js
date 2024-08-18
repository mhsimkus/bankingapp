// const express = require("express");
// const app = express();
// const path = require("path");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
// const dal = require("./dal.js");
import express from "express";
const app = express();
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { connectToDb,
    createUserAccount,
    find,
    update,
    all,
    findOne,
    deleteUser,
    getTransactions,
    addAccount,
    deleteAccount,
    testing} from "./dal.js";

    import { fileURLToPath } from 'url';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename); // get the name of the directory

testing()
const port = process.env.PORT || 3000;
const secret = process.env.JWT_SECRET || "jwt_secret";

app.use(express.static(path.join(__dirname, "../client/build")));
app.use(express.json());

// Middleware to check JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.userRole)) {
      return res.status(403).send("Access denied");
    }
    next();
  };
}

// create user account
app.post("/account/create", async (req, res) => {
  const { name, email, password } = req.body;
  console.log("Creating account for email:", email);

  try {
    const existingUser = await findOne(email);

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists." });
    } else {
      console.log(
        "Creating user account with:",
        name,
        email,
        password
      );
      const user = await createUserAccount({
        name,
        email,
        password,
      });
      console.log("User created:", user);
      res.status(201).send(user);
    }
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
});

// Delete user account
app.delete("/account/delete/:email", function (req, res) {
  deleteUser(req.params.email)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

// login user
app.post("/account/login", async (req, res) => {
  const { email, password } = req.body;

  console.log(`Login attempt for email: ${email}`);

  try {
    const user = await findOne(email);
    if (!user) {
      console.log("User not found");
      return res.status(400).send("Invalid username or password.");
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log("Invalid password");
      return res.status(401).send("Invalid password");
    }

    const accessToken = jwt.sign(
      { email: user.email, userRole: user.userRole },
      secret,
      {
        expiresIn: "1h",
      }
    );
    console.log("Login successful, token generated");
    res.json({ accessToken });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send(error.message);
  }
});

// find user account
app.get("/account/find/:email", function (req, res) {
  find(req.params.email).then((user) => {
    console.log(user);
    res.send(user);
  });
});

// find one user by email - alternative to find
app.get("/account/findOne/:email", function (req, res) {
  findOne(req.params.email).then((user) => {
    console.log(user);
    res.send(user);
  });
});

// Fetch logged-in user's details
app.get("/account/profile", authenticateToken, async (req, res) => {
  try {
    const user = await findOne(req.user.email);
    if (!user) {
      return res.status(404).send("User not found.");
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).send(error.message);
  }
});

// update - deposit/withdraw amount
app.post(
  "/account/update",
  authenticateToken,
  authorizeRoles("client"),
  async (req, res) => {
    const { email, accountId, amount, transactionType, details } = req.body;

    try {
      console.log(
        "Updating account:",
        email,
        accountId,
        amount,
        details
      );
      const result = await update(
        email,
        accountId,
        amount
      );
      console.log("Account updated:", result);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Add a new account
app.post(
  "/account/add",
  authenticateToken,
  authorizeRoles("client"),
  async (req, res) => {
    const { email, accountType, accountName } = req.body;
    try {
      const user = await addAccount(email, accountType, accountName);
      res.status(200).json(user);
    } catch (error) {
      console.error("Error adding account:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Delete one account
app.delete(
  "/account/deleteAccount",
  authenticateToken,
  authorizeRoles("client"),
  async (req, res) => {
    const { email, accountId } = req.body;
    try {
      const user = await deleteAccount(email, accountId);
      res.status(200).json(user);
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Transfer money between accounts
app.post(
  "/account/transfer",
  authenticateToken,
  authorizeRoles("client"),
  async (req, res) => {
    const { email, fromAccountId, toAccountId, amount } = req.body;
    try {
      const user = await transferBetweenAccounts(
        email,
        fromAccountId,
        toAccountId,
        amount
      );
      res.status(200).json(user);
    } catch (error) {
      console.error("Error transferring funds:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Get user's transaction history
app.get(
  "/account/transactions/:email",
  authenticateToken,
  authorizeRoles("client"),
  async (req, res) => {
    try {
      const transactions = await getTransactions(req.params.email);
      res.json(transactions);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

// all accounts
app.get(
  "/account/all",
  authenticateToken,
  authorizeRoles("employee"),
  function (req, res) {
    all().then((users) => {
      res.send(users);
    });
  }
);

// Handle any other routes by serving the React app's index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

// Connect to DB and start server
connectToDb()
  .then((data) => {
    console.log("000000000")
    console.log(data)
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1); // Exit the process with failure
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log("Press Ctrl+C to quit.");
  });