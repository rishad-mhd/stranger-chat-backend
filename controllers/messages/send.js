const express = require("express");
const User = require("../../models/User");
const io = require("../../services/socketio");
const { Types } = require("mongoose");

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
module.exports = async function (req, res) {
  const { id } = req.user;
  const { receiver, text } = req.body;
  try {
    let messageId = new Types.ObjectId();
    let createdAt = new Date();
    let result = io.sendMessage({
      createdAt,
      messageId,
      reciever: receiver,
      sender: id,
      text: text,
    });
    // Example usage
    if (result.success) {
      res.json({ message: "Message sent successfully", messageId, createdAt });
    } else {
      // res.status(404).json({ message: result.error.message });
       res.json({ message: result.error.message,error:result.error.message });
    }
  } catch (err) {
    console.log(err);
    res.status(404).send({ error: err.message, message: "User not found" });
  }
};
