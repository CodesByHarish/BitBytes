const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

// @desc    Create a new leave/outpass request
// @route   POST /api/leaves
// @access  Private (Student)
const createLeaveRequest = async (req, res) => {
    try {
        console.log('DEBUG: Received leave request body:', req.body);
        console.log('DEBUG: User from token:', req.user._id, req.user.hostel, req.user.block, req.user.roomNumber);

        const { type, fromDate, toDate, reason, destination, contactNumber } = req.body;

        // Use hostel or fallback to block
        const userHostel = req.user.hostel || req.user.block;

        // Validation for missing user profile details
        if (!userHostel || !req.user.roomNumber) {
            console.log('Error: User missing location details', req.user);
            return res.status(400).json({
                message: 'Incomplete profile: your Hostel/Block and Room Number are missing. Please contact an admin to update your profile.'
            });
        }

        const request = await LeaveRequest.create({
            student: req.user.id,
            type,
            fromDate,
            toDate,
            reason,
            destination,
            contactNumber,
            hostel: userHostel,
            block: req.user.block,
            roomNumber: req.user.roomNumber,
            status: 'submitted'
        });

        res.status(201).json(request);
    } catch (error) {
        console.error('Create Leave Request Error:', error);
        res.status(500).json({ message: error.message || 'Server Error while creating request' });
    }
};

// @desc    Get my requests (Student)
// @route   GET /api/leaves/my
// @access  Private (Student)
const getMyLeaves = async (req, res) => {
    try {
        const requests = await LeaveRequest.find({ student: req.user.id })
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all requests (Management)
// @route   GET /api/leaves
// @access  Private (Management)
const getAllLeaves = async (req, res) => {
    try {
        if (req.user.role !== 'management') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { status, hostel, block } = req.query;
        let query = {};

        if (status) query.status = status;
        if (hostel) query.hostel = hostel;
        if (block) query.block = block;

        const requests = await LeaveRequest.find(query)
            .populate('student', 'email name')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update request status (Approve/Reject/Checkout/Checkin)
// @route   PUT /api/leaves/:id/status
// @access  Private (Management)
const updateLeaveStatus = async (req, res) => {
    try {
        if (req.user.role !== 'management') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { status, remarks } = req.body;
        const request = await LeaveRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Add valid transitions check if needed, simplified for now
        request.status = status;
        if (remarks) request.remarks = remarks;

        if (status === 'approved' || status === 'rejected') {
            request.approvedBy = req.user.id;
            request.actionDate = Date.now();
        } else if (status === 'checkedOut') {
            request.checkoutTime = Date.now();
        } else if (status === 'checkedIn') {
            request.checkinTime = Date.now();
        }

        await request.save();
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel request
// @route   PUT /api/leaves/:id/cancel
// @access  Private (Student)
const cancelLeaveRequest = async (req, res) => {
    try {
        const request = await LeaveRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.student.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (request.status !== 'submitted' && request.status !== 'draft') {
            return res.status(400).json({ message: 'Cannot cancel request in current status' });
        }

        request.status = 'cancelled';
        await request.save();
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete request (Management)
// @route   DELETE /api/leaves/:id
// @access  Private (Management)
const deleteLeaveRequest = async (req, res) => {
    try {
        if (req.user.role !== 'management') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const request = await LeaveRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        await request.deleteOne();
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createLeaveRequest,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus,
    cancelLeaveRequest,
    deleteLeaveRequest
};
