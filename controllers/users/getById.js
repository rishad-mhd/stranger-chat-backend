const express = require("express");
const User = require("../../models/User");

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
module.exports = async function (req, res) {
  const { id } = req.user;
  try {
    const user = await User.findById(id);
    // Example usage
    res.json(user);
  } catch (err) {
    res.status(404).send({ error: err.message, message: "User not found" });
  }
};
