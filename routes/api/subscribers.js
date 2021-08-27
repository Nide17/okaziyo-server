const express = require("express");
const config = require('config')
const router = express.Router();
const { auth, authRole } = require('../../middleware/auth');
const sendEmail = require("./pswd-reset/sendEmail");

// Subscriber Model
const Subscriber = require('../../models/Subscriber');

// @route   GET /api/subscribers
// @desc    Get subscribers
// @access  Private: Accessed by admin only

router.get('/', authRole(['Admin']), async (req, res) => {

  try {
    const subscribers = await Subscriber.find()

      //sort subscribers by date_subscribed
      .sort({ date_subscribed: -1 })

    if (!subscribers) throw Error('No subscribers found');

    res.status(200).json(subscribers);
  } catch (err) {
    res.status(400).json({ msg: err.message })
  }
});

// @route   POST /api/subscribers
// @desc    Subscribe to our newsletter
// @access  Public

router.post('/', async (req, res) => {
  const { name, email } = req.body;

  // Simple validation
  if (!name || !email) {
    return res.status(400).json({ msg: 'Please fill all the fields' });
  }

  try {
    const subscriber = await Subscriber.findOne({ email });
    if (subscriber) throw Error('You had already subscribed!');

    const newSubscriber = new Subscriber({
      name,
      email
    });

    const savedSubscriber = await newSubscriber.save();
    if (!savedSubscriber) throw Error('Something went wrong while subscribing!');

    // Sending e-mail to subscribed user
    const clientURL = process.env.NODE_ENV === 'production' ?
      'http://www.okaziyo.com' : 'http://localhost:3000'

    sendEmail(
      savedSubscriber.email,
      "Thank you for subscribing to Okaziyo!",
      {
        name: savedSubscriber.name,
        unsubscribeLink: `${clientURL}/unsubscribe`
      },
      "./template/subscribe.handlebars");

    res.status(200).json({
      subscriber: {
        _id: savedSubscriber._id,
        name: savedSubscriber.name,
        email: savedSubscriber.email
      }
    });

  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// @route GET api/subscribers/:id
// @route GET one Subscriber
// @route Private: Accessed by admin only

router.get('/:id', authRole(['Admin']), async (req, res) => {

  try {
    //Find the subscriber by id
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) throw Error('This subscriber does not exist!')

  } catch (err) {
    res.status(400).json({
      msg: 'Failed to retrieve! ' + err.message,
      success: false
    });
  }

});

// @route DELETE api/subscribers
// @route delete a subscriber
// @route Private: Accessed by authenticated people only

//:id placeholder, findId=we get it from the parameter in url
router.delete('/:uemail', auth, async (req, res) => {

  try {
    //Find the subscriber to delete by id first
    const subscriber = await Subscriber.findOne({ email: req.params.uemail });
    if (!subscriber) throw Error('subscriber is not found!')

    const removedSubscriber = await subscriber.remove();

    res.status(200).json({
      msg: 'Unsubscribed successfully!'
    });

    if (!removedSubscriber)
      throw Error('Something went wrong while unsubscribing!');

  } catch (err) {
    res.status(400).json({
      success: false,
      msg: err.message
    });
  }
});

module.exports = router;