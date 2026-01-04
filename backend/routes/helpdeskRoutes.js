const express = require('express');
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
    getTicketById, getTickets, createTicket, updateTicket, addComment, closeTicket
} = require("../controllers/helpDeskController");

router.use(authMiddleware);

// Get tickets with filters
router.post('/tickets', getTickets);

// Create new ticket
router.post('/new-ticket', createTicket);

// Get single ticket
router.get('/tickets/:ticketId', getTicketById);

// Update ticket
router.put('/tickets/:ticketId', updateTicket);

// Add comment to ticket
router.post('/tickets/:ticketId/comments', addComment);

// Close ticket
router.put('/tickets/:ticketId/close', closeTicket);

module.exports = router;
