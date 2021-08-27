const express = require("express");
const router = express.Router();
const sendEmail = require("./pswd-reset/sendEmail");

// auth middleware to protect routes
const { auth, authRole } = require('../../middleware/auth');

//Contact Model : use capital letters since it's a model
const Contact = require('../../models/Contact');
const User = require('../../models/User');

// @route GET api/contacts
// @route Get All contacts
// @route Private: accessed by logged in user

//we use router. instead of app. and / because we are already in this dir
router.get('/', authRole(['Creator', 'Admin']), async (req, res) => {

  try {
    const contacts = await Contact.find()
      //sort contacts by creation_date
      .sort({ contact_date: -1 })

    if (!contacts) throw Error('No contacts found');

    res.status(200).json(contacts);

  } catch (err) {
    res.status(400).json({ msg: err.message })
  }
});

// @route POST api/contacts
// @route Create a Contact
// @route Private: accessed by logged in user

router.post("/", async (req, res) => {

  try {

    const newContact = await Contact.create(req.body);
    res.send(newContact);

    if (!newContact) throw Error('Something went wrong!');

    // Sending e-mail to contacted user
    sendEmail(
      newContact.email,
      "Thank you for contacting Okaziyo!",
      {
        name: newContact.contact_name,
      },
      "./template/contact.handlebars");

    // Sending e-mail to admins
    const admins = await User.find({ role: 'Admin' }).select("email")

    admins.forEach(ad => {
      sendEmail(
        ad.email,
        "A new message, someone contacted us!",
        {
          cEmail: newContact.email
        },
        "./template/contactAdmin.handlebars");
    })

    res.status(200).json({ msg: "Sent successfully!" });

  } catch (err) {
    console.log(err);

    if (err.name === "ValidationError") {
      return res.status(400).send(err.errors);
    }
    res.status(500).send("Something went wrong");
  }
});

// @route GET api/contacts/:id
// @route GET one Contact
// @route Private: accessed by logged in user

//:id placeholder, findId=we get it from the parameter in url
router.get('/:id', authRole(['Admin']), (req, res) => {

  //Find the Contact by id
  Contact.findById(req.params.id)

    //return a promise
    .then(contact => res.json(contact))
    // if id not exist or if error
    .catch(err => res.status(404).json({ success: false }));
});

// @route PUT api/contacts/:id
// @route Replying a contact
// @access Private: Accessed by admin only

router.put('/:id', authRole(['Creator', 'Admin']), async (req, res) => {

  try {

    // Update the Contact on Contact updating
    const contact = await Contact.updateOne(
      { "_id": req.params.id },
      { $push: { "replies": req.body } },
      { new: true }
    );

    // Send Reply email
    sendEmail(
      req.body.to_contact,
      "New message! Okaziyo replied!",
      {
        name: req.body.to_contact_name,
        question: req.body.contact_question,
        answer: req.body.message,
      },
      "./template/reply.handlebars");

    res.status(200).json(contact);

  } catch (err) {
    res.status(400).json({
      msg: 'Failed to update! ' + err.message,
      success: false
    });
  }
});


// @route DELETE api/contacts
// @route delete a Contact
// @route Private: Accessed by admin only

//:id placeholder, findId=we get it from the parameter in url
router.delete('/:id', authRole(['Admin']), (req, res) => {

  //Find the Contact to delete by id first
  Contact.findById(req.params.id)

    //returns promise 
    .then(contact => contact.remove().then(() => res.json({ success: true })))
    // if id not exist or if error
    .catch(err => res.status(404).json({ success: false }));
});

module.exports = router;