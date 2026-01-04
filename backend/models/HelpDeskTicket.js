const mongoose = require('mongoose');

const helpDeskTicketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    topic: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    mobile: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    shipment_id: {
        type: String,
        trim: true
    },
    awb: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'low'
    },
    assignedTo: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    resolvedByName: String,
    resolution: {
        type: String,
        trim: true
    },
    closedAt: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true
    }],
    attachments: [{
        filename: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            auto: true
        },
        commentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        commentByName: {
            type: String,
            required: true
        },
        comment: {
            type: String,
            required: true,
            trim: true
        },
        isInternal: {
            type: Boolean,
            default: false
        },
        commentedAt: {
            type: Date,
            default: Date.now
        }
    }]

}, {
    timestamps: true
});

// Update closedAt when status changes to closed
helpDeskTicketSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        if (this.status === 'closed' && !this.closedAt) {
            this.closedAt = new Date();
        }
    }
    next();
});
helpDeskTicketSchema.index({ closedAt: 1 }, { expireAfterSeconds: 20 * 24 * 60 * 60 });

module.exports = mongoose.model('HelpDeskTicket', helpDeskTicketSchema);