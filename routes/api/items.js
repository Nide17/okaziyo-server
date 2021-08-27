const express = require("express");
const router = express.Router();
const config = require('config')
const AWS = require('aws-sdk');
const { auth, authRole } = require('../../middleware/auth');
const { itemUpload } = require('./utils/itemUpload.js');

const s3Config = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || config.get('AWSAccessKeyId'),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || config.get('AWSSecretKey'),
    Bucket: process.env.S3_BUCKET_ITEMS || config.get('S3ItemsBucket')
});

// Item Model
const Item = require('../../models/Item');

// @route   GET /api/items
// @desc    Get all items
// @access  Public
router.get('/', async (req, res) => {

    try {

        const items = await Item.find().limit(parseInt(req.query.limit))

            //sort items by date_created
            .sort({ date_created: -1 })
            .populate('category')
            .populate('creator')

        if (!items) throw Error('No items exist');

        res.status(200).json(items);

    } catch (err) {
        res.status(400).json({ msg: err.message })
    }
});


// @route   GET /api/items/pagination
// @desc    Get all items for pagination
// @access  Public
router.get('/pagination', async (req, res) => {

    // Pagination
    const totalPages = await Item.countDocuments({});
    var PAGE_SIZE = 18
    var pageNo = parseInt(req.query.pageNo || "0")
    var query = {}

    query.limit = PAGE_SIZE
    query.skip = PAGE_SIZE * (pageNo - 1)

    try {

        const items = pageNo > 0 ?
            await Item.find({}, {}, query)

                //sort items by date_created
                .sort({ date_created: -1 })
                .populate('category')
                .populate('creator') :

            await Item.find()

                //sort items by date_created
                .sort({ date_created: -1 })
                .populate('category')
                .populate('creator')

        if (!items) throw Error('No items exist');

        res.status(200).json({
            totalPages: Math.ceil(totalPages / PAGE_SIZE),
            items
        });

    } catch (err) {
        res.status(400).json({ msg: err.message })
    }
});

// @route   GET /api/items/:id
// @desc    Get one item
// @access  Needs to be private
router.get('/:id', async (req, res) => {

    let id = req.params.id;
    try {
        //Find the item by id
        await Item.findById(id, (err, item) => {
            res.status(200).json(item);
        })
            // Use the name of the schema path instead of the collection name
            .populate('category')
            .populate('creator')

    } catch (err) {
        res.status(400).json({
            msg: 'Failed to retrieve! ' + err.message,
            success: false
        });
    }

});

// @route   GET /api/items/category/:id
// @desc    Get all items by taker
// @access  Needs to private
router.get('/category/:id', async (req, res) => {

    // Pagination
    const totalCatPages = await Item.countDocuments({});
    var PAGE_SIZE = 12
    var pageNo = parseInt(req.query.pageNo || "0")
    var query = {}

    query.limit = PAGE_SIZE
    query.skip = PAGE_SIZE * (pageNo - 1)

    let id = req.params.id;
    try {
        //Find the items by id
        const items = pageNo > 0 ?
            await Item.find({ category: id }, {}, query)
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator') :

            await Item.find()
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator')

        if (!items) throw Error('No items exist');

        res.status(200).json({
            totalCatPages: Math.ceil(totalCatPages / PAGE_SIZE),
            items
        });

    } catch (err) {
        res.status(400).json({
            msg: 'Failed to retrieve! ' + err.message,
            success: false
        });
    }

});

// @route   GET /api/items/sub-category/:id
// @desc    Get all items by taker
// @access  Needs to private
router.get('/sub-category/:id', async (req, res) => {

    // Pagination
    const totalSubCatPages = await Item.countDocuments({});
    var PAGE_SIZE = 12
    var pageNo = parseInt(req.query.pageNo || "0")
    var query = {}

    query.limit = PAGE_SIZE
    query.skip = PAGE_SIZE * (pageNo - 1)

    let id = req.params.id;
    try {
        //Find the items by id
        const items = pageNo > 0 ?
            await Item.find({ sub_category: id }, {}, query)
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator') :

            await Item.find()
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator')

        if (!items) throw Error('No items exist');

        res.status(200).json({
            totalSubCatPages: Math.ceil(totalSubCatPages / PAGE_SIZE),
            items
        });

    } catch (err) {
        res.status(400).json({
            msg: 'Failed to retrieve! ' + err.message,
            success: false
        });
    }

});

// @route   POST /api/items
// @desc    Create item
// @access  Have to be private
router.post("/", itemUpload.array('pictures', 12), auth, async (req, res) => {
    const pictures = [];

    for (var i = 0; i < req.files.length; i++) {
        pictures.push(req.files[i].location)
    }

    const { title, description, brand, price, category, sub_category, contactNumber, creator } = req.body;

    // Simple validation
    if (!title || !description || !brand || !price || !category || !sub_category || !contactNumber) {
        return res.status(400).json({ msg: 'There are missing info!' });
    }

    try {
        const newItem = new Item({
            title,
            description,
            brand,
            price,
            pictures,
            category,
            sub_category,
            contactNumber,
            creator
        });

        const savedItem = await newItem.save();

        if (!savedItem) throw Error('Something went wrong during creation! file size should not exceed 1MB');

        res.status(200).json({
            _id: savedItem._id,
            title: savedItem.title,
            description: savedItem.description,
            brand: savedItem.brand,
            price: savedItem.price,
            pictures: savedItem.pictures,
            sub_category: savedItem.sub_category,
            contactNumber: savedItem.contactNumber,
            category: savedItem.category,
            creator: savedItem.creator
        });

    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});


// @route PUT api/items/:id
// @route UPDATE one Item
// @route Private: Accessed by admin only
router.put('/:id', authRole(['Creator', 'Admin']), async (req, res) => {

    try {
        //Find the Item by id
        const updatedItem = await Item.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true })
        res.status(200).json(updatedItem);

    } catch (error) {
        res.status(400).json({
            msg: 'Failed to update! ' + error.message,
            success: false
        });
    }
});

// @route DELETE api/items/:id
// @route delete a Item
// @route Private: Accessed by admin only
router.delete('/:id', authRole(['Creator', 'Admin']), async (req, res) => {

    try {
        const item = await Item.findById(req.params.id);
        if (!item) throw Error('Item is not found!')

        const params = {
            Bucket: process.env.S3_BUCKET_ITEMS || config.get('S3ItemsBucket'),
            Key: item.pictures.split('/').pop() //if any sub folder-> path/of/the/folder.ext
        }

        try {
            await s3Config.deleteObject(params, (err, data) => {
                if (err) {
                    res.status(400).json({ msg: err.message });
                    console.log(err, err.stack); // an error occurred
                }
                else {
                    res.status(200).json({ msg: 'deleted!' });
                    console.log(params.Key + ' deleted from ' + params.Bucket);
                }
            })

        }
        catch (err) {
            res.status(400).json({
                msg: 'Failed to delete! ' + error.message,
                success: false
            });
            console.log('ERROR in file Deleting : ' + JSON.stringify(err))
        }

        const removedItem = await Item.remove();

        if (!removedItem)
            throw Error('Something went wrong while deleting!');

    } catch (err) {
        res.status(400).json({
            success: false,
            msg: err.message
        });
    }

});
module.exports = router;