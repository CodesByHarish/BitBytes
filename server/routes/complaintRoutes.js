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
        const { tab } = req.query;
        const query = {};

        // If user is a caretaker, implement tab-based filtering
        if (req.user.managementRole === 'caretaker') {
            if (tab === 'resolved') {
                // Issues resolved by this specific caretaker
                query.caretakerId = req.user.id;
                query.status = 'resolved';
            } else {
                // Issues available: Reported issues in their specialization OR issues already assigned to them but not resolved
                query.$or = [
                    {
                        status: 'reported',
                        category: req.user.staffSpecialization
                    },
                    {
                        caretakerId: req.user.id,
                        status: { $ne: 'resolved' }
                    }
                ];
            }
        }

        const complaints = await Complaint.find(query)
            .populate('student', 'email roomNumber block hostel')
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign caretaker to complaint
// @route   PUT /api/complaints/:id/assign
router.put('/:id/assign', protect, authorize('management'), async (req, res) => {
    try {
        const { caretaker, caretakerId } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (caretaker) complaint.caretaker = caretaker;
        if (caretakerId) complaint.caretakerId = caretakerId;

        complaint.status = 'assigned';
        complaint.timeline.push({
            status: 'assigned',
            timestamp: new Date(),
            updatedBy: req.user.id,
            comment: `Assigned to caretaker: ${caretaker || 'Staff'}`
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

        // Cascade resolution to merged issues
        if (['resolved', 'closed'].includes(status) && complaint.mergedIssues && complaint.mergedIssues.length > 0) {
            await Complaint.updateMany(
                { _id: { $in: complaint.mergedIssues } },
                {
                    status,
                    $push: {
                        timeline: {
                            status,
                            timestamp: new Date(),
                            updatedBy: req.user.id,
                            comment: `Auto-resolved via merge with primary issue: ${complaint._id}`
                        }
                    }
                }
            );
        }

        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Merge similar/duplicate complaints
// @route   POST /api/complaints/merge
router.post('/merge', protect, authorize('management'), async (req, res) => {
    try {
        const { primaryId, duplicateIds } = req.body;

        if (!primaryId || !duplicateIds || !duplicateIds.length) {
            return res.status(400).json({ message: 'Primary ID and at least one duplicate ID are required' });
        }

        const primary = await Complaint.findById(primaryId);
        if (!primary) return res.status(404).json({ message: 'Primary complaint not found' });

        // Update duplicates
        await Complaint.updateMany(
            { _id: { $in: duplicateIds } },
            {
                status: 'merged',
                mergedInto: primaryId,
                $push: {
                    timeline: {
                        status: 'merged',
                        timestamp: new Date(),
                        updatedBy: req.user.id,
                        comment: `Issue merged into primary report: ${primary.description?.substring(0, 50)}...`
                    }
                }
            }
        );

        // Update primary
        primary.mergedIssues = [...(primary.mergedIssues || []), ...duplicateIds];
        primary.timeline.push({
            status: primary.status,
            timestamp: new Date(),
            updatedBy: req.user.id,
            comment: `Merged ${duplicateIds.length} duplicate report(s) into this issue`
        });

        await primary.save();
        res.json(primary);
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

// @desc    Toggle upvote on a complaint
// @route   POST /api/complaints/:id/upvote
router.post('/:id/upvote', protect, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        const index = complaint.upvotes.indexOf(req.user._id);
        if (index === -1) {
            complaint.upvotes.push(req.user._id);
        } else {
            complaint.upvotes.splice(index, 1);
        }

        await complaint.save();
        res.json({ upvotes: complaint.upvotes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
