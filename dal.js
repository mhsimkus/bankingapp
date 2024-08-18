// const {MongoClient} = require('mongodb');
// const bcrypt = require("bcrypt");
// const path = require('path');
// const { Login } = require('./public/login');

import MongoClient from "mongodb"
import bcrypt from "bcrypt"
import path from "path"
const url = process.env.MONGODB_URI || "mongodb://localhost:27017";

async function loadLoginModule() {
    try {
        const modulePath = path.resolve(__dirname, 'login.js');
        const loginModule = await import(modulePath);
        return loginModule;
    } catch (error) {
        console.error('Error loading module:', error);
        throw error;
    }
}
//const url = 'mongodb://localhost:27017';
// const url = "mongodb+srv://mhsimkus:Dece2023!@clusterf.nwv1ty6.mongodb.net/?retryWrites=true&w=majority&appName=ClusterF"
// let db = null;
// const client = new MongoClient(url);

//connect to mongo
//MongoClient.connect(url)



  async function connectToDb() {
    try {
    console.log("INSIDE THE CONNECY TO DB FUNCTION ")
    const url = "mongodb+srv://mhsimkus:DA7Y3Z.q^8p=XxV@clusterf.nwv1ty6.mongodb.net/?retryWrites=true&w=majority&appName=ClusterF"
const client = await MongoClient.connect(url,
   {
     
           useNewUrlParser: true,
           useUnifiedTopology: true,
        });
      db = client.db("BANKINGAPP")
      const collection = db.collection("EXAMPLE")
      return "done"

      // const client = new MongoClient.connect(url, {
        //  useNewUrlParser: true,
        //  useUnifiedTopology: true,
      //  }),
      //  db = client.db("BANKINGAPP");
      //  console.log("Connected to MongoDB");

    } catch (err) {
      console.error(err);
      throw err; // Propagate error to ensure the server doesn't start
    }
  }
  
  function testing(){
    console.log("THIS IS A TEST HOPE I WORK")
  }

// create user account
async function createUserAccount({ name, email, password }) {
    console.log(
      "Creating user account in dal.js with:",
      name,
      email,
      password
    );
    const hashedPassword = await bcrypt.hash(password, 10);
    const collection = db.collection("users");
 
    // Create the user object
    const user = {
      name,
      email,
      password: hashedPassword,
    };
}
    
  
  // Delete user account and transaction history from the user
  async function deleteUser(email) {
    const result = await db.collection("users").deleteOne({ email });
    const transactions = await db
      .collection("transactions")
      .deleteMany({ email });
    return result;
  }
  
  // find user account
  async function find(email) {
    const customers = await db.collection("users").find({ email }).toArray();
    return customers;
  }
  
  // find one user account
  async function findOne(email) {
    try {
      const customer = await db.collection("users").findOne({ email });
      console.log("Found user in findOne (dal.js):", customer);
      return customer;
    } catch (err) {
      console.error("Error finding user:", err);
      throw err;
    }
  }
  
  // update - deposit/withdraw amount
  async function update(email, accountId, amount, transactionType, details) {
    try {
      console.log(
        "Updating account in dal.js with:",
        email,
        accountId,
        amount,
        transactionType,
      );
      const result = await db.collection("users").findOneAndUpdate(
        { email, "accounts.accountId": ObjectId.createFromHexString(accountId) },
        {
          $inc: { "accounts.$.balance": amount },
        },
        { returnOriginal: false }
      );
  
      console.log("Result of update in dal.js:", result);
  
      if (!result) {
        throw new Error("User or account not found");
      }
  
      await db.collection("transactions").insertOne({
        email,
        accountId: ObjectId.createFromHexString(accountId),
        amount,
        date: new Date(),
        transactionType,
        balanceAfterTransaction:
          result.accounts.find((acc) =>
            acc.accountId.equals(ObjectId.createFromHexString(accountId))
          ).balance + amount,
      });
  
      return result;
    } catch (error) {
      console.error("Error updating account:", error);
      throw error;
    }
  }
  
  // Get user's transaction history
  async function getTransactions(email) {
    const transactions = await db
      .collection("transactions")
      .find({ email })
      .toArray();
    return transactions;
  }
  
  // all users
  async function all() {
    const customers = await db.collection("users").find({}).toArray();
    return customers;
  }
  
  // Add an account for a user
  async function addAccount(email, accountName) {
    const accountId = new ObjectId();
    const result = await db.collection("users").findOneAndUpdate(
      { email },
      {
        $push: { accounts: { accountName, balance: 0, accountId } },
      },
      { returnOriginal: false }
    );
    return result;
  }
  
  // Delete an account for a user
  async function deleteAccount(email, accountId) {
    const result = await db.collection("users").findOneAndUpdate(
      { email },
      {
        $pull: {
          accounts: { accountId: ObjectId.createFromHexString(accountId) },
        },
      },
      { returnOriginal: false }
    );
    return result;
  }
  
  // Transfer money between accounts
  async function transferBetweenAccounts(
    email,
    fromAccountId,
    toAccountId,
    amount
  ) {
    try {
      const user = await db.collection("users").findOne({ email });
  
      if (!ObjectId.isValid(fromAccountId) || !ObjectId.isValid(toAccountId)) {
        throw new Error("Invalid account ID");
      }
  
      const fromAccount = user.accounts.find((acc) =>
        acc.accountId.equals(ObjectId.createFromHexString(fromAccountId))
      );
  
      const toAccount = user.accounts.find((acc) =>
        acc.accountId.equals(ObjectId.createFromHexString(toAccountId))
      );
  
      if (!fromAccount || !toAccount) {
        throw new Error("Account not found");
      }
  
      if (fromAccount.balance < amount) {
        throw new Error("Insufficient funds");
      }
  
      await db.collection("users").findOneAndUpdate(
        {
          email,
          "accounts.accountId": ObjectId.createFromHexString(fromAccountId),
        },
        {
          $inc: { "accounts.$.balance": -amount },
        }
      );
  
      await db.collection("users").findOneAndUpdate(
        {
          email,
          "accounts.accountId": ObjectId.createFromHexString(toAccountId),
        },
        {
          $inc: { "accounts.$.balance": amount },
        }
      );
  
      await db.collection("transactions").insertMany([
        {
          email,
          accountId: ObjectId.createFromHexString(fromAccountId),
          amount: -amount,
          date: new Date(),
          transactionType: "Transfer",
          details: `Transfer to account ${toAccount.accountName}`,
          balanceAfterTransaction: fromAccount.balance - amount,
        },
        {
          email,
          accountId: ObjectId.createFromHexString(toAccountId),
          amount,
          date: new Date(),
          transactionType: "Transfer",
          details: `Transfer from account ${fromAccount.accountName}`,
          balanceAfterTransaction: toAccount.balance + amount,
        },
      ]);
  
      return { fromAccount, toAccount };
    } catch (error) {
      throw error;
    }
  }
  
export {
    connectToDb,
    createUserAccount,
    find,
    update,
    all,
    findOne,
    deleteUser,
    getTransactions,
    addAccount,
    deleteAccount,
    testing
  };