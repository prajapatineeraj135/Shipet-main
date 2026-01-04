const express = require('express');
const SupportController = require('../controllers/supportController');
const supportMiddleware = require("../middlewares/supportMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();


// ===== CUSTOMER SUPPORT ROUTES=====

// Get all tickets with filtering and pagination
router.get('/tickets', authMiddleware, supportMiddleware, SupportController.getAllTickets);

// Get specific ticket by ID
router.get('/ticket/:ticketId', authMiddleware, supportMiddleware, SupportController.getTicketById);

// Add comment to ticket
router.post('/ticket/:ticketId/comment', authMiddleware, supportMiddleware, SupportController.addComment);

// Delete comment from ticket
router.delete('/ticket/:ticketId/comment/:commentId', authMiddleware, supportMiddleware, SupportController.deleteComment);

// Close ticket
router.post('/ticket/close', authMiddleware, supportMiddleware, SupportController.closeTicket);

module.exports = router;