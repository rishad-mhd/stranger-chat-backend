const express = require("express");
const User = require("../../models/User");
const io = require("../../services/socketio");
const { Types } = require("mongoose");

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
module.exports = async function (req, res) {
  const { id } = req.user;
  const { gender } = req.query;
  try {
    let sender = await User.findById(id);
    const { unpairedUsers, usersHasChat } = io.getUnpairedUsers(
      id
    );
    const receiver = await User.aggregate([
      {
        $match: { ...(gender ? { gender } : {}), _id: { $in: unpairedUsers } },
      },
      { $sample: { size: 1 } },
    ]).then((users) => users?.[0]);

    if (receiver) {
      receiver.socketId = io.users.get(receiver._id.toString());
      let senderSocketId = io.users.get(sender._id.toString());
      let chatId =
        usersHasChat.get(receiver._id.toString()) ||
        new Types.ObjectId().toString();
      receiver.chatId = chatId;
      io.sendConnectionRequest(
        { ...sender.toJSON(), chatId, socketId: senderSocketId },
        receiver._id.toString()
      );
      res.json(receiver);
    } else {
      res.status(404).send({ message: "User not found" });
    }
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ error: err.message, message: "Internal server error" });
  }
};
