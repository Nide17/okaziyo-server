const express = require("express");
const router = express.Router();
const config = require('config')
const AWS = require('aws-sdk');
const { authRole } = require('../../middleware/auth');
const { scholarshipUpload } = require('./utils/scholarshipUpload.js');

const s3Config = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || config.get('AWSAccessKeyId'),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || config.get('AWSSecretKey'),
    Bucket: process.env.S3_BUCKET_SCHOLARSHIPS || config.get('S3ScholarshipsBucket')
});

var today = new Date();
var yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));

// Scholarship Model
const Scholarship = require('../../models/Scholarship');

// @route   GET /api/scholarships
// @desc    Get all scholarships
// @access  Public
router.get('/', async (req, res) => {

    try {
        const scholarships = await Scholarship.find()

            //sort scholarships by date_created
            .sort({ createdAt: -1 })
            .populate('category')
            .populate('creator')

        if (!scholarships) throw Error('No scholarships found');

        res.status(200).json(scholarships);
    } catch (err) {
        res.status(400).json({ msg: err.message })
    }
});

// @route   GET /api/scholarships/activeScholarships
// @desc    Get all active scholarships
// @access  Public
router.get('/activeScholarships', async (req, res) => {

    try {
        const scholarships = await Scholarship.find({ deadline: { $gt: yesterday } })

            //sort scholarships by date_created
            .sort({ createdAt: -1 })
            .populate('category')
            .populate('creator')

        if (!scholarships) throw Error('No scholarships found');

        res.status(200).json(scholarships);
    } catch (err) {
        res.status(400).json({ msg: err.message })
    }
});


// @route   GET /api/scholarships/category/:id
// @desc    Get all scholarships by taker
// @access  Needs to private
router.get('/category/:id', async (req, res) => {

    // Pagination
    const totalCatPages = await Scholarship.countDocuments({});
    var PAGE_SIZE = 12
    var pageNo = parseInt(req.query.pageNo || "0")
    var query = {}

    query.limit = PAGE_SIZE
    query.skip = PAGE_SIZE * (pageNo - 1)

    let id = req.params.id;
    try {
        //Find the scholarships by id
        const scholarships = pageNo > 0 ?
            await Scholarship.find({ category: id, deadline: { $gt: yesterday } }, {}, query)
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator') :

            await Scholarship.find({ deadline: { $gt: yesterday } })
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator')

        if (!scholarships) throw Error('No scholarships exist');

        res.status(200).json({
            totalCatPages: Math.ceil(totalCatPages / PAGE_SIZE),
            scholarships
        });

    } catch (err) {
        res.status(400).json({
            msg: 'Failed to retrieve! ' + err.message,
            success: false
        });
    }

});

// @route   GET /api/scholarships/sub-category/:id
// @desc    Get all scholarships by taker
// @access  Needs to private
router.get('/sub-category/:id', async (req, res) => {

    // Pagination
    const totalSubCatPages = await Scholarship.countDocuments({});
    var PAGE_SIZE = 12
    var pageNo = parseInt(req.query.pageNo || "0")
    var query = {}

    query.limit = PAGE_SIZE
    query.skip = PAGE_SIZE * (pageNo - 1)

    let id = req.params.id;
    try {
        //Find the scholarships by id
        const scholarships = pageNo > 0 ?
            await Scholarship.find({ sub_category: id, deadline: { $gt: yesterday } }, {}, query)
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator') :

            await Scholarship.find({ deadline: { $gt: yesterday } })
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator')

        if (!scholarships) throw Error('No scholarships exist');

        res.status(200).json({
            totalSubCatPages: Math.ceil(totalSubCatPages / PAGE_SIZE),
            scholarships
        });

    } catch (err) {
        res.status(400).json({
            msg: 'Failed to retrieve! ' + err.message,
            success: false
        });
    }

});

// @route   GET /api/scholarships/archives
// @desc    Get all scholarships archives
// @access  Needs to private
router.get('/archives', async (req, res) => {

    // Pagination
    const totalArchivesPages = await Scholarship.countDocuments({});
    var PAGE_SIZE = 12
    var pageNo = parseInt(req.query.pageNo || "0")
    var query = {}

    query.limit = PAGE_SIZE
    query.skip = PAGE_SIZE * (pageNo - 1)

    try {
        //Find the archived scholarships
        const archivedScholarships = pageNo > 0 ?
            await Scholarship.find({ deadline: { $lt: yesterday } }, {}, query)
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator') :

            await Scholarship.find({ deadline: { $lte: yesterday } })
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator')

        if (!archivedScholarships) throw Error('No archivedScholarships exist');

        res.status(200).json({
            totalArchivesPages: Math.ceil(totalArchivesPages / PAGE_SIZE),
            archivedScholarships
        });

    } catch (err) {
        res.status(400).json({
            msg: 'Failed to retrieve! ' + err.message,
            success: false
        });
    }

});

// @route   POST /api/scholarships
// @desc    Create Scholarship
// @access  Have to be private
router.post("/", scholarshipUpload.single("brand_image"), authRole(['Creator', 'Admin']), async (req, res) => {

    const b_image = req.file ? req.file : null

    const { title, brand, deadline, markdown, category, sub_category, creator } = req.body;

    // Simple validation
    if (!title || !brand || !deadline || !markdown || !category) {
        return res.status(400).json({ msg: 'There are missing info!' });
    }

    try {
        const newScholarship = new Scholarship({
            title,
            brand,
            brand_image: b_image.location,
            deadline,
            markdown,
            category,
            sub_category,
            creator
        });

        const savedScholarship = await newScholarship.save();

        if (!savedScholarship) throw Error('Something went wrong during creation! file size should not exceed 1MB');

        res.status(200).json({
            _id: savedScholarship._id,
            title: savedScholarship.title,
            brand: savedScholarship.brand,
            brand_image: savedScholarship.brand_image,
            deadline: savedScholarship.deadline,
            markdown: savedScholarship.markdown,
            category: savedScholarship.category,
            sub_category: savedScholarship.sub_category,
            creator: savedScholarship.creator,
            slug: savedScholarship.slug,
        });

    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});


// @route PUT api/scholarships/:id
// @route UPDATE one Scholarship
// @route Private: Accessed by admin only
router.put('/:id', authRole(['Creator', 'Admin']), async (req, res) => {

    try {
        //Find the Scholarship by id
        const updatedScholarship = await Scholarship.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true })
        res.status(200).json(updatedScholarship);

    } catch (error) {
        res.status(400).json({
            msg: 'Failed to update! ' + error.message,
            success: false
        });
    }
});

// @route DELETE api/scholarships/:id
// @route delete a Scholarship
// @route Private: Accessed by admin only
router.delete('/:id', authRole(['Creator', 'Admin']), async (req, res) => {

    try {
        const scholarship = await Scholarship.findById(req.params.id);
        if (!scholarship) throw Error('Scholarship is not found!')

        const params = {
            Bucket: process.env.S3_BUCKET_SCHOLARSHIPS || config.get('S3ScholarshipsBucket'),
            Key: scholarship.brand_image.split('/').pop() //if any sub folder-> path/of/the/folder.ext
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

        const removedScholarship = await scholarship.remove();

        if (!removedScholarship)
            throw Error('Something went wrong while deleting!');

    } catch (err) {
        res.status(400).json({
            success: false,
            msg: err.message
        });
    }

});

module.exports = router;