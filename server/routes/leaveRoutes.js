const express = require('express');
const router = express.Router();
const {
    createLeaveRequest,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus,
    cancelLeaveRequest,
    deleteLeaveRequest
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createLeaveRequest);
router.get('/my', protect, getMyLeaves);
router.get('/', protect, getAllLeaves);
router.put('/:id/status', protect, updateLeaveStatus);
router.put('/:id/cancel', protect, cancelLeaveRequest);
router.delete('/:id', protect, deleteLeaveRequest);

module.exports = router;
