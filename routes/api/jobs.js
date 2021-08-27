const express = require("express");
const router = express.Router();
const config = require('config')
const AWS = require('aws-sdk');
const { authRole } = require('../../middleware/auth');
const { jobUpload } = require('./utils/jobUpload.js');

const s3Config = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || config.get('AWSAccessKeyId'),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || config.get('AWSSecretKey'),
    Bucket: process.env.S3_BUCKET_JOBS || config.get('S3JobsBucket')
});

var today = new Date();
var yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));


// Job Model
const Job = require('../../models/Job');

// @route   GET /api/jobs
// @desc    Get all jobs
// @access  Public
router.get('/', async (req, res) => {

    try {
        const jobs = await Job.find()

            //sort jobs by date_created
            .sort({ createdAt: -1 })
            .populate('category')
            .populate('creator')

        if (!jobs) throw Error('No jobs found');

        res.status(200).json(jobs);
    } catch (err) {
        res.status(400).json({ msg: err.message })
    }
});

// @route   GET /api/jobs/activeJobs
// @desc    Get all active jobs
// @access  Public
router.get('/activeJobs', async (req, res) => {

    try {
        const jobs = await Job.find({ deadline: { $gt: yesterday } })

            //sort jobs by date_created
            .sort({ createdAt: -1 })
            .populate('category')
            .populate('creator')

        if (!jobs) throw Error('No jobs found');

        res.status(200).json(jobs);
    } catch (err) {
        res.status(400).json({ msg: err.message })
    }
});


// @route   GET /api/jobs/category/:id
// @desc    Get all jobs by taker
// @access  Needs to private
router.get('/category/:id', async (req, res) => {

    // Pagination
    const totalCatPages = await Job.countDocuments({});
    var PAGE_SIZE = 12
    var pageNo = parseInt(req.query.pageNo || "0")
    var query = {}

    query.limit = PAGE_SIZE
    query.skip = PAGE_SIZE * (pageNo - 1)

    let id = req.params.id;
    try {
        //Find the jobs by id
        const jobs = pageNo > 0 ?
            await Job.find({ category: id, deadline: { $gt: yesterday } }, {}, query)
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator') :

            await Job.find({ deadline: { $gt: yesterday } })
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator')

        if (!jobs) throw Error('No jobs exist');

        res.status(200).json({
            totalCatPages: Math.ceil(totalCatPages / PAGE_SIZE),
            jobs
        });

    } catch (err) {
        res.status(400).json({
            msg: 'Failed to retrieve! ' + err.message,
            success: false
        });
    }

});

// @route   GET /api/jobs/sub-category/:id
// @desc    Get all jobs by taker
// @access  Needs to private
router.get('/sub-category/:id', async (req, res) => {

    // Pagination
    const totalSubCatPages = await Job.countDocuments({});
    var PAGE_SIZE = 12
    var pageNo = parseInt(req.query.pageNo || "0")
    var query = {}

    query.limit = PAGE_SIZE
    query.skip = PAGE_SIZE * (pageNo - 1)

    let id = req.params.id;
    try {
        //Find the jobs by id
        const jobs = pageNo > 0 ?
            await Job.find({ sub_category: id, deadline: { $gt: yesterday } }, {}, query)
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator') :

            await Job.find({ deadline: { $gt: yesterday } })
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator')

        if (!jobs) throw Error('No jobs exist');

        res.status(200).json({
            totalSubCatPages: Math.ceil(totalSubCatPages / PAGE_SIZE),
            jobs
        });

    } catch (err) {
        res.status(400).json({
            msg: 'Failed to retrieve! ' + err.message,
            success: false
        });
    }

});

// @route   GET /api/jobs/archives
// @desc    Get all jobs archives
// @access  Needs to private
router.get('/archives', async (req, res) => {

    // Pagination
    const totalArchivesPages = await Job.countDocuments({});
    var PAGE_SIZE = 12
    var pageNo = parseInt(req.query.pageNo || "0")
    var query = {}

    query.limit = PAGE_SIZE
    query.skip = PAGE_SIZE * (pageNo - 1)

    try {
        //Find the archived jobs
        const archivedJobs = pageNo > 0 ?
            await Job.find({ deadline: { $lt: yesterday } }, {}, query)
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator') :

            await Job.find({ deadline: { $lte: yesterday } })
                .sort({ createdAt: -1 })
                // Use the name of the schema path instead of the collection name
                .populate('category')
                .populate('creator')

        if (!archivedJobs) throw Error('No archivedJobs exist');

        res.status(200).json({
            totalArchivesPages: Math.ceil(totalArchivesPages / PAGE_SIZE),
            archivedJobs
        });

    } catch (err) {
        res.status(400).json({
            msg: 'Failed to retrieve! ' + err.message,
            success: false
        });
    }

});

// @route   POST /api/jobs
// @desc    Create Job & upload a brand_image
// @access  Have to be private
router.post("/", jobUpload.single("brand_image"), authRole(['Admin']), async (req, res) => {

    const b_image = req.file ? req.file : null
    const { title, brand, deadline, markdown, category, sub_category, creator } = req.body;

    // Simple validation
    if (!title || !brand || !deadline || !markdown || !category) {
        return res.status(400).json({ msg: 'There are missing info!' });
    }

    try {
        const newJob = new Job({
            title,
            brand,
            brand_image: b_image.location,
            deadline,
            markdown,
            category,
            sub_category,
            creator
        });

        const savedJob = await newJob.save();

        if (!savedJob) throw Error('Something went wrong during creation! file size should not exceed 1MB');

        res.status(200).json({
            _id: savedJob._id,
            title: savedJob.title,
            brand: savedJob.brand,
            brand_image: savedJob.brand_image,
            deadline: savedJob.deadline,
            markdown: savedJob.markdown,
            category: savedJob.category,
            sub_category: savedJob.sub_category,
            creator: savedJob.creator,
            slug: savedJob.slug,
        });

    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route PUT api/jobs/:id
// @route UPDATE one job
// @route Private: Accessed by admin only
router.put('/:id', authRole(['Creator', 'Admin']), async (req, res) => {

    try {
        //Find the job by id
        const updatedJob = await Job.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true })
        res.status(200).json(updatedJob);

    } catch (error) {
        res.status(400).json({
            msg: 'Failed to update! ' + error.message,
            success: false
        });
    }
});

// @route DELETE api/jobs/:id
// @route delete a job
// @route Private: Accessed by admin only
router.delete('/:id', authRole(['Creator', 'Admin']), async (req, res) => {

    try {
        const job = await Job.findById(req.params.id);
        if (!job) throw Error('Job is not found!')

        const params = {
            Bucket: process.env.S3_BUCKET_JOBS || config.get('S3JobsBucket'),
            Key: job.brand_image.split('/').pop() //if any sub folder-> path/of/the/folder.ext
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
            console.log('ERROR in file Deleting : ' + JSON.stringify(err))
            res.status(400).json({
                msg: 'Failed to delete! ' + error.message,
                success: false
            });
        }

        const removedJob = await job.remove();

        if (!removedJob)
            throw Error('Something went wrong while deleting!');

    } catch (err) {
        res.status(400).json({
            success: false,
            msg: err.message
        });
    }

});

module.exports = router;