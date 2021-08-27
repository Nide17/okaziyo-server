const express = require("express");
const router = express.Router();

// Category Model
const Category = require('../../models/Category');

const { auth, authRole } = require('../../middleware/auth');

// @route   GET /api/categories
// @desc    Get categories
// @access  Public

router.get('/', async (req, res) => {

    try {
        const categories = await Category.find()
            //sort categories by date_created
            .sort({ date_created: 1 })
        // .populate('items')

        if (!categories) throw Error('No categories found');

        res.status(200).json(categories);

    } catch (err) {
        res.status(400).json({ msg: err.message })
    }
});

// @route   GET /api/categories/:id
// @desc    Get one category
// @access Private: accessed by logged in user
// router.get('/:id', authRole(['Creator', 'Admin']), async (req, res) => {
router.get('/:id', authRole(['Creator', 'Admin']), async (req, res) => {

    let id = req.params.id;
    try {
        //Find the Category by id
        await Category.findById(id, (err, category) => {
            res.status(200).json(category);
        })
        // Use the name of the schema path instead of the collection name
        // .populate('items')

    } catch (err) {
        res.status(400).json({
            msg: 'Failed to retrieve! ' + err.message,
            success: false
        });
    }
});

// @route   POST /api/categories
// @desc    Create a category
// @access Private: Accessed by admin only

router.post('/', authRole(['Admin']), async (req, res) => {
    const { title, description, date_created, creator } = req.body;

    // Simple validation
    if (!title || !description) {
        return res.status(400).json({ msg: 'Please fill all the fields' });
    }

    try {
        const category = await Category.findOne({ title });
        if (category) throw Error('Category already exists!');

        const newCategory = new Category({
            title,
            description,
            date_created,
            creator
        });

        const savedCategory = await newCategory.save();
        if (!savedCategory) throw Error('Something went wrong during creation!');

        res.status(200).json({
            _id: savedCategory._id,
            title: savedCategory.title,
            description: savedCategory.description,
            date_created: savedCategory.date_created,
            items: savedCategory.items,
            creator: savedCategory.creator
        });

    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route PUT api/categories/:id
// @route UPDATE one Category
// @access Private: Accessed by admin only
router.put('/:id', authRole(['Admin']), async (req, res) => {

    try {
        //Find the Category by id
        const category = await Category.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true })
        res.status(200).json(category);

    } catch (err) {
        res.status(400).json({
            msg: 'Failed to update! ' + err.message,
            success: false
        });
    }
});

// @route DELETE api/categories/:id
// @route delete a Category
// @route Private: Accessed by admin only
//:id placeholder, findById = we get it from the parameter in url

router.delete('/:id', authRole(['Admin']), async (req, res) => {

    try {
        const category = await Category.findById(req.params.id);
        if (!category) throw Error('Category is not found!')

        const removedCategory = await category.remove();

        if (!removedCategory)
            throw Error('Something went wrong while deleting!');

    } catch (err) {
        res.status(400).json({
            success: false,
            msg: err.message
        });
    }

});

module.exports = router;