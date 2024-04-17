const express = require("express");
const router = express.Router();
const Candidate = require("./../models/Candidate");
const User = require("./../models/User");

// const bcrypt = require("bcrypt");

const { jwtAuthMiddleware } = require("./../jwt");

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

//Voting logic

router.get("/vote/:candidateID", jwtAuthMiddleware, async (req, res) => {
  candidateID = req.params.candidateID;
  userId = req.user.id;

  try {
    // Find the Candidate document with  candidateID
    const candidate = await Candidate.findById(candidateID);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    if (user.role == "admin") {
      return res.status(403).json({ message: "admin is not allowed" });
    }
    if (user.isVoted) {
      return res.status(400).json({ message: "You have already voted" });
    }

    // Update the Candidate document to record the vote
    candidate.votes.push({ user: userId });
    candidate.voteCount++;
    await candidate.save();

    // update the user document
    user.isVoted = true;
    await user.save();

    return res.status(200).json({ message: "Vote recorded successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// vote count
router.get("/vote/count", async (req, res) => {
  try {
    // Find all candidates and sort them by voteCount in descending order
    const candidate = await Candidate.find().sort({ voteCount: "desc" });

    // Map the candidates to only return their name and voteCount
    const voteRecord = candidate.map((data) => {
      return {
        party: data.party,
        count: data.voteCount,
      };
    });

    return res.status(200).json(voteRecord);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get List of all candidates
router.get("/", async (req, res) => {
  try {
    // Find all candidates and select only the name and party fields
    const candidates = await Candidate.find({}, "name party -_id");

    // Return the list of candidates
    res.status(200).json(candidates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
