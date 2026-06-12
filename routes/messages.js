const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const requireLogin = require('../middleware/auth');

// CREATE a message (contact form)
router.post('/', requireLogin, async (req, res) => {
  try {
    const { name, email, content } = req.body;

    const newMessage = new Message({
      userId: req.session.userId,
      name,
      email,
      content
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully' });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ all messages by a specific user
router.get('/:id', requireLogin, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.params.id });
    res.status(200).json(messages);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// UPDATE a message by its own ID
router.put('/notes/:id', requireLogin, async (req, res) => {
  try {
    const { content } = req.body;

    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.status(200).json({ message: 'Message updated successfully', data: updatedMessage });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;