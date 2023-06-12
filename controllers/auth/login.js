const express = require("express");
const User = require("../../models/User");
const generateUserName = require("../../utils/generateUserName");
const {
  generateRefreshToken,
  generateAccessToken,
} = require("../../services/JWT");

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
module.exports = async function (req, res) {
  const { uniqueId, gender } = req.body;
  console.log(req.body);
  const file = req.file;
  try {
    // Example usage
    let user = await User.findOne({ userId: uniqueId });
    if (!user) {
      const userName = generateUserName();
      user = new User({
        name: userName,
        userId: uniqueId,
        gender,
      });
      if (file) {
        user.avatar = "uploads/avatar/" + file.filename;
      }
      await user.save();
    } else {
      if (gender) {
        user.gender = gender;
        await user.save();
      }
    }
    const id = user.toJSON()._id;
    const accessToken = generateAccessToken({ id });
    const refreshToken = generateRefreshToken({ id });
    res.status(201).json({
      message: "User Logged In successfully",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ error: err.message, message: "Failed to logging in" });
  }
};
