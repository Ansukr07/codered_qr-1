const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { deleteFile } = require('../utils/fileUtils');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// GET /tasks: List available tasks
router.get('/tasks', requireAuth, async (req, res) => {
    try {
        const tasks = await Task.find().sort({ points: 1 });

        // If participant, check their submission status for each task
        let tasksWithStatus = tasks.map(t => t.toObject());

        if (req.user.role === 'participant') {
            const user = await User.findById(req.user.userId);
            let submissions = [];

            if (user && user.teamId) {
                submissions = await Submission.find({ teamId: user.teamId });
            } else {
                submissions = await Submission.find({ userId: req.user.userId });
            }

            const submissionMap = {};
            submissions.forEach(s => {
                submissionMap[s.taskId.toString()] = s.status;
            });

            tasksWithStatus = tasksWithStatus.map(t => ({
                ...t,
                status: submissionMap[t._id.toString()] || 'open'
            }));
        }

        res.json({ tasks: tasksWithStatus });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /tasks: Create new task (Admin only)
router.post('/tasks', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { title, description, points, category, requiresProof } = req.body;

        const task = new Task({
            title,
            description,
            points,
            category,
            requiresProof: requiresProof !== undefined ? requiresProof : true
        });

        await task.save();
        res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /submit: Upload proof
router.post('/submit', requireAuth, requireRole('participant'), upload.single('proof'), async (req, res) => {
    try {
        const { taskId } = req.body;
        const task = await Task.findById(taskId);
        if (!task) {
            if (req.file) deleteFile(req.file.path);
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.requiresProof && !req.file) {
            return res.status(400).json({ message: 'Proof image is required for this task' });
        }

        const user = await User.findById(req.user.userId);

        if (!user || !user.teamId) {
            // Clean up uploaded file if validation fails
            if (req.file) deleteFile(req.file.path);
            return res.status(400).json({ message: 'User or Team not found' });
        }

        // Check for existing pending/approved submission
        const existing = await Submission.findOne({
            teamId: user.teamId,
            taskId,
            status: { $in: ['pending', 'approved'] }
        });

        if (existing) {
            if (req.file) deleteFile(req.file.path);
            return res.status(400).json({ message: 'Submission already exists' });
        }

        const submission = new Submission({
            userId: user._id,
            teamId: user.teamId,
            taskId,
            proofUrl: req.file ? req.file.path.replace(/\\/g, '/') : '', // Normalize path if file exists
            status: 'pending'
        });

        await submission.save();

        res.status(201).json({ message: 'Task submitted successfully', submission });

    } catch (error) {
        if (req.file) deleteFile(req.file.path);
        console.error('Submission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /submissions: List for volunteer/admin
router.get('/submissions', requireAuth, requireRole('volunteer', 'admin'), async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};

        const submissions = await Submission.find(query)
            .populate('userId', 'name teamId')
            .populate('taskId', 'title points')
            .populate('verifiedBy', 'name')
            .sort({ createdAt: 1 });

        res.json({ submissions });
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /verify/:id: Approve/Reject
router.patch('/submissions/:id/verify', requireAuth, requireRole('volunteer', 'admin'), async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Delete valid proof file upon verification (as requested to save storage)
        // Delete valid proof file upon verification (as requested to save storage)
        if (submission.proofUrl) {
            // deleteFile(submission.proofUrl); // DISABLED TEMPORARILY: Potential file lock issue on Windows
            // submission.proofUrl = ""; // Keep path for record for now
        }

        submission.status = status;
        submission.verifiedBy = req.user.userId;
        submission.verifiedAt = new Date();
        await submission.save();

        res.json({ message: `Submission ${status}`, submission });

    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /leaderboard
router.get('/leaderboard', requireAuth, async (req, res) => {
    try {
        // Aggregate approved tasks per team and sum points
        const stats = await Submission.aggregate([
            { $match: { status: 'approved' } },
            {
                $lookup: {
                    from: 'tasks',
                    localField: 'taskId',
                    foreignField: '_id',
                    as: 'taskDetails'
                }
            },
            { $unwind: '$taskDetails' },
            {
                $group: {
                    _id: "$teamId",
                    completedTasks: { $sum: 1 },
                    totalPoints: { $sum: "$taskDetails.points" },
                    lastCompletion: { $max: "$verifiedAt" }
                }
            }
        ]);

        // Map to leaderboard format
        const leaderboard = stats.map(team => ({
            teamId: team._id,
            completedTasks: team.completedTasks,
            points: team.totalPoints,
            lastCompletion: team.lastCompletion
        }));

        // Sort: High points first, then Earliest completion
        leaderboard.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return new Date(a.lastCompletion) - new Date(b.lastCompletion);
        });

        // Add Rank
        const ranked = leaderboard.map((team, index) => ({
            rank: index + 1,
            ...team
        }));

        res.json({ leaderboard: ranked });

    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
