const User = require('../models/User');
const HelpDeskTicket = require('../models/HelpDeskTicket');

exports.getAllTickets = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            status,
            priority,
            topic,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};

        if (status && status !== 'all') filter.status = status;
        if (priority && priority !== 'all') filter.priority = priority;
        if (topic && topic !== 'all') filter.topic = topic;
        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { ticketId: { $regex: search, $options: 'i' } },
                { awb: { $regex: search, $options: 'i' } },
                { shipment_id: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const tickets = await HelpDeskTicket.find(filter)
            .populate('userId', 'firstName lastName email phone')
            .populate('assignedTo', 'firstName lastName email')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Format tickets for frontend
        const formattedTickets = tickets.map(ticket => ({
            ...ticket,
            userName: ticket.userId ? `${ticket.userId.firstName} ${ticket.userId.lastName}` : 'Unknown User',
            userEmail: ticket.userId ? ticket.userId.email : ticket.email || 'No email',
            userPhone: ticket.userId ? ticket.userId.phone : ticket.mobile || 'No phone',
        }));

        const total = await HelpDeskTicket.countDocuments(filter);

        res.json({
            success: true,
            data: {
                tickets: formattedTickets,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(total / limit),
                    count: formattedTickets.length,
                    totalRecords: total
                }
            }
        });
    } catch (err) {
        console.error('Admin getAllTickets error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
    }
};

exports.getTicketById = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await HelpDeskTicket.findOne({
            $or: [{ ticketId: ticketId }, { ticketId }]
        })
            .populate('userId', 'firstName lastName email phone')
            .populate('comments.commentBy', 'firstName lastName email role');

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Format ticket for frontend
        const formattedTicket = {
            ...ticket.toObject(),
            userName: ticket.userId ? `${ticket.userId.firstName} ${ticket.userId.lastName}` : 'Unknown User',
            userEmail: ticket.userId ? ticket.userId.email : ticket.email || 'No email',
            userPhone: ticket.userId ? ticket.userId.phone : ticket.mobile || 'No phone',
            comments: ticket.comments.map(comment => {
                const plainComment = comment.toObject ? comment.toObject() : comment;
                return {
                    ...plainComment,
                    commentByName: plainComment.commentBy ?
                        `${plainComment.commentBy.firstName} ${plainComment.commentBy.lastName}` :
                        plainComment.commentByName || 'Unknown'
                };
            })

        };
        res.json({ success: true, data: formattedTicket });
    } catch (err) {
        console.error('Admin getTicketById error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { comment, isInternal = false } = req.body;
        const userId = req.user._id;

        if (!comment || !comment.trim()) {
            return res.status(400).json({ success: false, message: 'Comment is required' });
        }

        const ticket = await HelpDeskTicket.findOne({
            $or: [{ ticketId: ticketId }, { ticketId }]
        });

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        const supportUser = await User.findOne({ role: 'support', _id: userId });

        const newComment = {
            commentBy: userId,
            commentByName:
                (supportUser.firstName && supportUser.lastName)
                    ? `${supportUser.firstName} ${supportUser.lastName}`
                    : supportUser.email, comment: comment.trim(),
            isInternal: isInternal,
            commentedAt: new Date()
        };

        ticket.comments.push(newComment);
        await ticket.save();

        // Populate the ticket for response
        await ticket.populate('comments.commentBy', 'firstName lastName email role');

        res.json({
            success: true,
            message: 'Comment added successfully',
            data: ticket
        });
    } catch (err) {
        console.error('Admin addComment error:', err);
        res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
};

// DELETE comment by commentId
exports.deleteComment = async (req, res) => {
    try {
        const { ticketId, commentId } = req.params;

        const ticket = await HelpDeskTicket.findOne({ ticketId });

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const initialLength = ticket.comments.length;
        ticket.comments = ticket.comments.filter(comment => comment._id.toString() !== commentId);

        if (ticket.comments.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        await ticket.save();

        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (err) {
        console.error('deleteComment error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete comment' });
    }
};



exports.closeTicket = async (req, res) => {
    try {
        const { ticketId } = req.body;

        if (!ticketId) {
            return res.status(400).json({ success: false, message: 'Ticket ID is required' });
        }

        const ticket = await HelpDeskTicket.findOne({
            ticketId: ticketId
        });

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (ticket.status === 'closed') {
            return res.status(400).json({ success: false, message: 'Ticket is already closed' });
        }
        let resolvedByUser = await User.findById(req.user._id);
        ticket.status = 'closed';
        ticket.closedAt = new Date();
        ticket.resolvedBy = req.user._id;
        ticket.resolvedByName = `${resolvedByUser.firstName} ${resolvedByUser.lastName}`;
        await ticket.save();

        res.json({
            success: true,
            message: 'Ticket closed successfully',
            data: ticket
        });
    } catch (err) {
        console.error('Admin closeTicket error:', err);
        res.status(500).json({ success: false, message: 'Failed to close ticket' });
    }
};