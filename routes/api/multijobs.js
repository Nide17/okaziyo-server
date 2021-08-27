const express = require("express");
const router = express.Router();
const { authRole } = require('../../middleware/auth');

// Multijobs Model
const Multijobs = require('../../models/Multijobs');

// @route   GET /api/multijobs
// @desc    Get all multijobs
// @access  Public
router.get('/', async (req, res) => {

    try {
        const multijobs = await Multijobs.find()
            .sort({ createdAt: -1 })
            //sort multijobs by date_created
            .sort({ createdAt: -1 })
            .populate('creator')

        if (!multijobs) throw Error('No multijobs found');

        res.status(200).json(multijobs);
    } catch (err) {
        res.status(400).json({ msg: err.message })
    }
});

// @route   GET /api/multijobs/:id
// @desc    Get one multijobs
// @access  Needs to be private
router.get('/:id', async (req, res) => {

    let id = req.params.id;
    try {
        //Find the multijobs by id
        await Multijobs.findById(id, (err, multijobs) => {
            res.status(200).json(multijobs);
        }).populate('creator')

    } catch (err) {
        res.status(400).json({
            msg: 'Failed to retrieve! ' + err.message,
            success: false
        });
    }

});

// @route   POST /api/multijobs
// @desc    Create a Multijobs
// @access  Have to be private
router.post("/", async (req, res) => {

    const { title, markdown, creator } = req.body;

    // Simple validation
    if (!title || !markdown) {
        return res.status(400).json({ msg: 'There are missing info!' });
    }

    try {
        const newMultijobs = new Multijobs({
            title,
            markdown,
            creator
        });

        const savedMultijobs = await newMultijobs.save();

        if (!savedMultijobs) throw Error('Something went wrong during creation! file size should not exceed 1MB');

        res.status(200).json({
            _id: savedMultijobs._id,
            title: savedMultijobs.title,
            markdown: savedMultijobs.markdown,
            creator: savedMultijobs.creator,
            slug: savedMultijobs.slug,
        });

    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route PUT api/multijobs/:id
// @route UPDATE one Multijobs
// @route Private: Accessed by admin only
router.put('/:id', authRole(['Creator', 'Admin']), async (req, res) => {

    try {
        //Find the Multijobs by id
        const updatedMultijobs = await Multijobs.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true })
        res.status(200).json(updatedMultijobs);

    } catch (error) {
        res.status(400).json({
            msg: 'Failed to update! ' + error.message,
            success: false
        });
    }
});

// @route DELETE api/multijobs/:id
// @route delete a multijobs
// @route Private: Accessed by admin only
router.delete('/:id', authRole(['Creator', 'Admin']), async (req, res) => {

    try {
        const multijobs = await Multijobs.findById(req.params.id);
        if (!multijobs) throw Error('Multijobs is not found!')

        const removedMultijobs = await multijobs.remove();

        if (!removedMultijobs)
            throw Error('Something went wrong while deleting!');

    } catch (err) {
        res.status(400).json({
            success: false,
            msg: err.message
        });
    }

});

module.exports = router;