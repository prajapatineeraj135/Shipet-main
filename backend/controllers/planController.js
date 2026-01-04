const Plan = require('../models/Plan');
const UserPlan = require('../models/UserPlan');

exports.getAllPlan = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true })
            .sort({ sortOrder: 1, price: 1 });

        res.status(200).json({
            success: true,
            data: plans,
            message: 'Plans retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching plans',
            error: error.message
        });
    }
}
exports.getPlanById = async (req, res) => {
    // Get specific plan by ID
    try {
        const { planId } = req.params;

        const plan = await Plan.findOne({ id: planId, isActive: true });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.status(200).json({
            success: true,
            data: plan,
            message: 'Plan retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching plan',
            error: error.message
        });
    }
}

// Create new plan (Admin only)
exports.createPlan = async (req, res) => {
    try {
        const planData = req.body;

        // Check if plan ID already exists
        const existingPlan = await Plan.findOne({ id: planData.id });
        if (existingPlan) {
            return res.status(400).json({
                success: false,
                message: 'Plan with this ID already exists'
            });
        }

        const plan = new Plan(planData);
        await plan.save();

        res.status(201).json({
            success: true,
            data: plan,
            message: 'Plan created successfully'
        });
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating plan',
            error: error.message
        });
    }
}

// Update plan (Admin only)
exports.updatePlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const updateData = req.body;
        console.log("updateData", updateData)
        console.log("id", planId)

        const plan = await Plan.findOneAndUpdate(
            { id: planId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.status(200).json({
            success: true,
            data: plan,
            message: 'Plan updated successfully'
        });
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating plan',
            error: error.message
        });
    }
}
