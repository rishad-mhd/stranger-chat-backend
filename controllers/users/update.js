const User = require("../../models/User");
const express = require("express");

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
module.exports = async (req, res) => {
  const { id } = req.user;
  const { name, gender } = req.body;
  try {
    let user = await User.findByIdAndUpdate(id, {
      $set: {
        name,
        gender,
      },
    });
    res.json({ user, message: "User updated successfully" });
  } catch (e) {
    res
      .status(500)
      .json({ error: e.message, message: "Failed to update user" });
  }
};
