const express = require("express");
const router = express.Router();
const User = require("./../models/User");
const bcrypt = require("bcrypt");

const { jwtAuthMiddleware, generateToken } = require("./../jwt");

//Post route for sign up
router.post("/signup", async (req, res) => {
  // Extract data from req body
  try {
    const signupData = req.body;

    //Check if there is already an admin user.
    const adminUser = await User.findOne({ role: "admin" });

    if (signupData.role === "admin" && adminUser) {
      res.status(401).json({ Error: "Admin is already exits" });
    }

    //Check the citizenship number is exactly 11 digit
    if (!/^\d{11}$/.test(signupData.citizenshipCardNumber)) {
      return res
        .status(400)
        .json({ error: "Citizenship card number must be exactly 11 digits" });
    }

    //Check if the user already exits with same   citizenshipCardNumber

    const existingUser = await User.findOne({
      citizenshipCardNumber: signupData.citizenshipCardNumber,
    });

    if (existingUser) {
      return res
        .status(401)
        .json({ Error: "User already exits with given citizenhip number" });
    }

    //create new user database collection using database model

    const newUser = new User(signupData);

    const response = await newUser.save();

    const payload = {
      id: response.id,
    };

    const token = generateToken(payload);

    res.status(200).json({ response: response, token: token });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Error: "Internal server error",
    });
  }
});

// Post method to login user

router.post("/login", async (req, res) => {
  try {
    //Extract data form req body

    const { citizenshipCardNumber, password } = req.body;

    if (!citizenshipCardNumber || !password) {
      return res
        .status(401)
        .json({ Error: "Citizenship card number and password is required" });
    }

    const user = await User.findOne({
      citizenshipCardNumber: citizenshipCardNumber,
    });
    console.log(user);
    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ Error: "Invalid citizenship card number and password" });
    }

    // generate Token
    const payload = {
      id: user.id,
    };
    const token = generateToken(payload);

    // return token as response
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Profile route
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const userData = req.user.userData;
    console.log(userData);
    const userId = userData.id;
    console.log(userId);
    const user = await User.findById(userId);
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Put method to update the password

router.put("/profile/password", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Extract the id from the token
    const { currentPassword, newPassword } = req.body; // Extract current and new passwords from request body

    // Check if currentPassword and newPassword are present in the request body
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both currentPassword and newPassword are required" });
    }

    // Find the user by userID
    const user = await User.findById(userId);

    // If user does not exist or password does not match, return error
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    // Update the user's password
    user.password = newPassword;
    await user.save();

    console.log("password updated");
    res.status(200).json({ message: "Password updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
