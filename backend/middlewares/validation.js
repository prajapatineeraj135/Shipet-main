const { body, validationResult } = require('express-validator');

const validateWalletRecharge = [
    body('amount')
        .isNumeric()
        .withMessage('Amount must be a number')
        .custom(value => {
            if (value < 100) {
                throw new Error('Minimum recharge amount is ₹100');
            }
            if (value > 100000) {
                throw new Error('Maximum recharge amount is ₹1,00,000');
            }
            return true;
        }),
    body('paymentMethod')
        .optional()
        .isIn(['online', 'upi', 'card', 'netbanking'])
        .withMessage('Invalid payment method'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

const validateWalletDebit = [
    body('amount')
        .isNumeric()
        .withMessage('Amount must be a number')
        .custom(value => {
            if (value <= 0) {
                throw new Error('Amount must be greater than 0');
            }
            return true;
        }),
    body('description')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Description must be between 1 and 255 characters'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateWalletRecharge,
    validateWalletDebit
};