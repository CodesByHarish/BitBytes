const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Raise a new complaint
// @route   POST /api/complaints
router.post('/', protect, async (req, res) => {
    try {
        const { category, priority, description, isPublic, media } = req.body;

        console.log('Creating complaint for user:', req.user._id);
        console.log('User details:', {
            hostel: req.user.hostel,
            block: req.user.block,
            roomNumber: req.user.roomNumber
        });

        const complaint = await Complaint.create({
            student: req.user.id,
            category,
            priority,
            description,
            isPublic,
            media,
            // Auto-tag with student details
            hostel: req.user.hostel,
            block: req.user.block,
            roomNumber: req.user.roomNumber
        });

        res.status(201).json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get logged-in student's complaints
// @route   GET /api/complaints/my
router.get('/my', protect, async (req, res) => {
    try {
        const complaints = await Complaint.find({ student: req.user.id })
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get public complaints (feed)
// @route   GET /api/complaints/public
router.get('/public', protect, async (req, res) => {
    try {
        const complaints = await Complaint.find({
            isPublic: true,
            // Optional: Filter by same hostel?
            // hostel: req.user.hostel 
        })
            .populate('student', 'email roomNumber block') // Show basic reporter info
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// @desc    Get all complaints (Management only)
// @route   GET /api/complaints
router.get('/', protect, authorize('management'), async (req, res) => {
    try {
        const count = await Complaint.countDocuments();
        console.log(`GET /api/complaints - Total in DB: ${count}`);

        const complaints = await Complaint.find({})
            .populate('student', 'email roomNumber block hostel')
            .sort({ createdAt: -1 });

        console.log(`Returning ${complaints.length} complaints to management`);
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign caretaker to complaint
// @route   PUT /api/complaints/:id/assign
router.put('/:id/assign', protect, authorize('management'), async (req, res) => {
    try {
        const { caretaker } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        complaint.caretaker = caretaker;
        complaint.status = 'assigned';
        complaint.timeline.push({
            status: 'assigned',
            timestamp: new Date(),
            updatedBy: req.user.id,
            comment: `Assigned to caretaker: ${caretaker}`
        });

        await complaint.save();
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
router.put('/:id/status', protect, authorize('management'), async (req, res) => {
    try {
        const { status, comment } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        complaint.status = status;
        complaint.timeline.push({
            status,
            timestamp: new Date(),
            updatedBy: req.user.id,
            comment: comment || `Status updated to ${status}`
        });

        await complaint.save();
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update complaint priority
// @route   PUT /api/complaints/:id/priority
router.put('/:id/priority', protect, authorize('management'), async (req, res) => {
    try {
        const { priority, comment } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const oldPriority = complaint.priority;
        complaint.priority = priority;
        complaint.timeline.push({
            status: complaint.status, // Current status remains same
            timestamp: new Date(),
            updatedBy: req.user.id,
            comment: comment || `Priority changed from ${oldPriority} to ${priority}`
        });

        await complaint.save();
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
