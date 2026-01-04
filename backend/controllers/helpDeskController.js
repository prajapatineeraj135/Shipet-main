const HelpDeskTicket = require('../models/HelpDeskTicket');
const User = require('../models/User');

// Get all tickets for a user with filters and pagination
exports.getTickets = async (req, res) => {
    try {
        const userId = req.user._id;
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

        // Build filter
        const filter = { userId };

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (priority && priority !== 'all') {
            filter.priority = priority;
        }

        if (topic && topic !== 'all') {
            filter.topic = topic;
        }

        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { ticketId: { $regex: search, $options: 'i' } },
                { awb: { $regex: search, $options: 'i' } },
                { shipment_id: { $regex: search, $options: 'i' } }

            ];
        }

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const tickets = await HelpDeskTicket.find(filter)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('assignedTo', 'name email')
            .lean();

        const total = await HelpDeskTicket.countDocuments(filter);

        res.json({
            success: true,
            data: {
                tickets,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(total / limit),
                    count: tickets.length,
                    totalRecords: total
                }
            }
        });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets'
        });
    }
}

// Create new ticket
exports.createTicket = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            subject,
            topic,
            description,
            mobile,
            shipment_id,
            email,
            awb,
            priority = 'low',
        } = req.body;

        // Validation
        if (!subject || !topic || !description || !mobile) {
            return res.status(400).json({
                success: false,
                message: 'Subject, topic, description, and mobile number are required'
            });
        }

        // Validate mobile number
        if (!/^\+?[\d\s\-\(\)]{10,}$/.test(mobile.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid mobile number'
            });
        }

        // Generate unique ticketId
        let newTicketId;
        do {
            newTicketId = Math.floor(100000 + Math.random() * 900000).toString();
        } while (await HelpDeskTicket.findOne({ ticketId: newTicketId }));

        // 🔍 Fetch all users with support role
        const supportUsers = await User.find({ role: 'support' }, '_id');
        const supportUserIds = supportUsers.map(user => user._id);

        // Create ticket
        const ticket = await HelpDeskTicket.create({
            ticketId: newTicketId,
            userId,
            subject: subject.trim(),
            topic,
            shipment_id,
            description: description.trim(),
            mobile: mobile.trim(),
            email: email ? email.trim() : undefined,
            awb: awb ? awb.trim() : undefined,
            priority,
            assignedTo: supportUserIds, // 👈 Assign to all support users
        });

        // Update user stats
        await UserStats(userId);

        await ticket.populate('assignedTo', 'firstName lastName email');

        res.status(201).json({
            success: true,
            message: 'Support ticket created and assigned to support team',
            data: ticket
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create ticket'
        });
    }
};


// Get single ticket by ID
exports.getTicketById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { ticketId } = req.params;

        const ticket = await HelpDeskTicket.findOne({
            ticketId: ticketId, userId
        })
            .populate('assignedTo', 'name email')
            .populate('comments.commentBy', 'name email');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ticket'
        });
    }
}

// Update ticket (for customers - limited fields only)
exports.updateTicket = async (req, res) => {
    try {
        const userId = req.user._id;
        const { ticketId } = req.params;
        const { subject, description, mobile, email, trackingNumber } = req.body;

        const ticket = await HelpDeskTicket.findOne({
            $or: [
                { _id: ticketId, userId },
                { ticketId: ticketId, userId }
            ]
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Only allow updates if ticket is not closed
        if (ticket.status === 'closed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update closed ticket'
            });
        }

        // Update allowed fields for customers only
        if (subject) ticket.subject = subject.trim();
        if (description) ticket.description = description.trim();
        if (mobile) ticket.mobile = mobile.trim();
        if (email !== undefined) ticket.email = email ? email.trim() : undefined;
        if (trackingNumber !== undefined) ticket.trackingNumber = trackingNumber ? trackingNumber.trim() : undefined;

        await ticket.save();

        res.json({
            success: true,
            message: 'Ticket updated successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Update ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update ticket'
        });
    }
}

// Add comment to ticket (customers can only add non-internal comments)
exports.addComment = async (req, res) => {
    try {
        const userId = req.user._id;
        const { ticketId } = req.params;
        const { comment } = req.body;

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Comment is required'
            });
        }

        const ticket = await HelpDeskTicket.findOne({
            ticketId: ticketId, userId
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        const user = await User.findById(userId);
        const newComment = {
            commentBy: userId,
            commentByName:
                (user.firstName && user.lastName)
                    ? `${user.firstName} ${user.lastName}`
                    : user.email, comment: comment.trim(),
            isInternal: false,
            commentedAt: new Date()
        };
        ticket.comments.push(newComment);
        await ticket.save();
        await ticket.populate('comments.commentBy', 'firstName lastName email role');
        res.json({
            success: true,
            message: 'Comment added successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add comment'
        });
    }
}

// Close ticket (customer can close their own tickets)
exports.closeTicket = async (req, res) => {
    try {
        const userId = req.user._id;
        const { ticketId } = req.params;

        const ticket = await HelpDeskTicket.findOne({
            $or: [
                { _id: ticketId, userId },
                { ticketId: ticketId, userId }
            ]
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        if (ticket.status === 'closed') {
            return res.status(400).json({
                success: false,
                message: 'Ticket is already closed'
            });
        }

        ticket.status = 'closed';
        ticket.closedAt = new Date();

        await ticket.save();
        await this.updateUserStats(userId);

        res.json({
            success: true,
            message: 'Ticket closed successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Close ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to close ticket'
        });
    }
}

const UserStats = async function (userId) {
    try {
        const tickets = await HelpDeskTicket.find({ userId, isDeleted: false });

        const totalTickets = tickets.length;
        const openTickets = tickets.filter(t => t.status === 'open').length;
        const unresolvedTickets = tickets.filter(t => t.status === 'unresolved').length;
        const closedTickets = tickets.filter(t => t.status === 'closed').length;

        const closedTicketsWithTime = tickets.filter(t =>
            t.status === 'closed' && t.closedAt && t.createdAt
        );
        const averageResolutionTime = closedTicketsWithTime.length > 0
            ? closedTicketsWithTime.reduce((sum, ticket) => {
                const hours = (ticket.closedAt - ticket.createdAt) / (1000 * 60 * 60);
                return sum + hours;
            }, 0) / closedTicketsWithTime.length
            : 0;

        const lastTicketCreated = tickets.length > 0
            ? Math.max(...tickets.map(t => new Date(t.createdAt)))
            : null;

        return {
            totalTickets,
            openTickets,
            unresolvedTickets,
            closedTickets,
            averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
            lastTicketCreated
        };
    } catch (error) {
        console.error('Stats calc error:', error);
        return null;
    }
}
