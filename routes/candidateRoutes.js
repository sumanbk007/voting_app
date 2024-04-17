const express = require("express");
const router = express.Router();
const Candidate = require("./../models/Candidate");
const User = require("./../models/User");

// const bcrypt = require("bcrypt");

const { jwtAuthMiddleware } = require("./../jwt");

// const checkAdminRole = async (userId) => {
//   try {
//     const user = await User.findById(userId);
//     console.log(user);

//     if (user.role === "admin") {
//       return true;
//     }
//   } catch (err) {
//     return false;
//   }
// };

const checkAdminRole = async (userID) => {
  try {
    const user = await User.findById(userID);
    if (user.role === "admin") {
      return true;
    }
  } catch (err) {
    return false;
  }
};

//Post route to add the candidate
router.post("/", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: "user does not have admin role" });
    }

    // Extract data from req body

    const candidateData = req.body;

    //create new user database collection using database model

    const newCandidate = new Candidate(candidateData);

    const response = await newCandidate.save();

    res.status(200).json({ response: response });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Error: "Internal server error",
    });
  }
});

// //Put method to update the Candidate Data

router.put("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: "user does not have admin role" });
    }

    const candidateID = req.params.candidateID;
    const updatedCandidateData = req.body;

    const response = await Candidate.findByIdAndUpdate(
      candidateID,
      updatedCandidateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!response) {
      return res
        .status(404)
        .json({ Error: "Candidate with the id not found!!" });
    }

    console.log(" Candidate data updated");
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Delete the Candidate

router.delete("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: "user does not have admin role" });
    }

    const candidateID = req.params.candidateID;

    const response = await Candidate.findByIdAndDelete(candidateID);

    if (!response) {
      return res
        .status(404)
        .json({ Error: "Candidate with the id not found!!" });
    }

    console.log("Candidate data deleted");
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
