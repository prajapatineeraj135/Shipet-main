const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const {
    bookSingleSurfaceShipmentApi,
    bookSingleAirShipmentApi,
    bookMultiBoxShipmentApi,
    bookInternationalShipmentApi,
    trackShipmentApi,
    syncShipmentStatusApi,
    syncShipmentBillingApi,
    printShipmentLabelApi,
    cancelShipmentApi,
    reverseShipmentApi
} = require('../utils/icarryApi');

// Prepare consignee details from order
const prepareConsignee = (order) => {
    const address = order.shippingAddress;
    return {
        name: address.name,
        mobile: address.mobile,
        alt_mobile: address?.alt_mobile,
        address: address.address,
        city: address.city,
        pincode: address.pincode,
        state: address.state,
        country_code: address.country_code || 'IN',
    };
};

// Book Single Shipment (Surface/Air)
exports.bookSingleShipment = async (req, res) => {
    try {
        const { orderId, pickup_address_id, shipment_mode, courier_id, dimensions, commission_amount } = req.body;
        const userId = req.user?._id; // or however you're attaching the logged-in user
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        // Validate required fields
        if (!orderId || !pickup_address_id || !shipment_mode || !courier_id || !dimensions) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: orderId, pickup_address_id, shipment_mode, courier_id, dimensions',
                error: 'Validation failed'
            });
        }

        const order = await Order.findOne({ client_order_id: orderId, userId }).populate('customer products.product');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                error: 'Order not found'
            });
        }

        // Check if order already has a shipment
        const existingShipment = await Shipment.findOne({ order: order._id, userId });
        if (existingShipment && existingShipment.isCancelled === false) {
            return res.status(400).json({
                success: false,
                message: 'Order already has a shipment booked',
                error: 'Shipment already exists'
            });
        }

        const consignee = prepareConsignee(order);

        // Get dimensions from request (first item in array) or from first product
        const packageDimensions = dimensions && dimensions.length > 0
            ? dimensions[0]
            : order.products[0]?.product?.dimensions;

        if (!packageDimensions) {
            return res.status(400).json({
                success: false,
                message: 'Product dimensions missing. Please provide dimensions.',
                error: 'Dimensions required'
            });
        }

        // Calculate weight
        const totalWeight = packageDimensions.weight || order.products.reduce((sum, item) => {
            const productWeight = item.product.weight || 0;
            return sum + (productWeight * item.quantity);
        }, 0);

        const payload = {
            pickup_address_id,
            client_order_id: order.client_order_id,
            consignee,
            parcel: {
                type: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
                value: order.totalAmount,
                items: order.products.map(item => ({
                    name: item.product.name,
                    pid: item.product.pid,
                    price: item.price,
                    quantity: item.quantity
                })),
                currency: 'INR',
                contents: 'Products',
                weight: {
                    weight: parseFloat(totalWeight),
                    unit: 'gm'
                },
                dimensions: {
                    length: parseFloat(packageDimensions.length),
                    breadth: parseFloat(packageDimensions.breadth),
                    height: parseFloat(packageDimensions.height),
                    unit: 'cm'
                }
            },
            courier_id: String(courier_id)
        };

        // Call appropriate API based on shipment mode
        const result = shipment_mode === 'E'
            ? await bookSingleAirShipmentApi(payload)
            : await bookSingleSurfaceShipmentApi(payload);

        console.log('API Result:', result);

        // Create shipment record with complete data
        const shipment = await Shipment.create({
            shipment_id: result.shipment_id,
            pickup_id: result.pickup_id,
            courier_id: result.courier_id,
            courier_name: result.courier_name,
            awb: result.awb,
            tracking_url: result.tracking_url,
            cost_estimate: result.cost_estimate,
            commission_amount,
            // Order reference
            order: order._id,
            client_order_id: order.client_order_id,

            // Shipment details
            type: 'Single',
            shipment_mode,
            pickup_address_id,

            // Consignee details
            consignee,

            // Parcel details
            parcel: {
                type: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
                value: order.totalAmount,
                currency: 'INR',
                contents: 'Products',
                weight: {
                    weight: parseFloat(totalWeight),
                    unit: 'gm'
                },
                dimensions: {
                    length: parseFloat(packageDimensions.length),
                    breadth: parseFloat(packageDimensions.breadth),
                    height: parseFloat(packageDimensions.height),
                    unit: 'cm'
                }
            },
            userId,
            status: "2",
            api_response: result // Store full API response for reference
        });

        // Update order status and link shipment
        order.shipment = shipment._id;
        order.hasShipment = true;
        await order.save();

        // Populate shipment for response
        const populatedShipment = await Shipment.findOne({ _id: shipment?._id }).populate('order');

        res.json({
            success: true,
            message: 'Single shipment booked successfully',
            data: populatedShipment
        });
    } catch (err) {
        console.error('Book Single Shipment Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to book single shipment',
            error: 'Internal Server Error',
            details: err.message
        });
    }
};

// Book Multi-Box Shipment
exports.bookMultiBoxShipment = async (req, res) => {
    try {
        const { orderId, pickup_address_id, boxes, courier_id, shipment_mode = 'S', commission_amount } = req.body;
        const userId = req.user?._id; // or however you're attaching the logged-in user
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        // Validate required fields
        if (!orderId || !pickup_address_id || !boxes || !courier_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: orderId, pickup_address_id, boxes, courier_id',
                error: 'Validation failed'
            });
        }

        if (!Array.isArray(boxes) || boxes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Boxes must be a non-empty array',
                error: 'Invalid boxes data'
            });
        }

        // Validate each box structure
        for (let i = 0; i < boxes.length; i++) {
            const box = boxes[i];
            if (!box.quantity || !box.length || !box.breadth || !box.height || !box.weight) {
                return res.status(400).json({
                    success: false,
                    message: `Box ${i + 1} is missing required fields: quantity, length, breadth, height, weight`,
                    error: 'Invalid box data'
                });
            }

            // Validate weight unit
            if (box.weight_unit && !['gm', 'kg'].includes(box.weight_unit)) {
                return res.status(400).json({
                    success: false,
                    message: `Box ${i + 1} has invalid weight_unit. Must be 'gm' or 'kg'`,
                    error: 'Invalid weight unit'
                });
            }

            // Validate dimension unit
            if (box.dimension_unit && box.dimension_unit !== 'cm') {
                return res.status(400).json({
                    success: false,
                    message: `Box ${i + 1} has invalid dimension_unit. Must be 'cm'`,
                    error: 'Invalid dimension unit'
                });
            }
        }

        const order = await Order.findOne({ client_order_id: orderId, userId }).populate('customer products.product');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                error: 'Order not found'
            });
        }

        // Check if order already has a shipment
        const existingShipment = await Shipment.findOne({ order: order._id, userId });
        if (existingShipment) {
            return res.status(400).json({
                success: false,
                message: 'Order already has a shipment booked',
                error: 'Shipment already exists'
            });
        }

        const consignee = prepareConsignee(order);

        // Prepare API payload according to iCarry documentation
        const payload = {
            pickup_address_id,
            client_order_id: order.client_order_id,
            mode: 'S', // E for Air, S for Surface
            consignee,
            parcel: {
                type: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
                value: order.totalAmount,
                currency: 'INR',
                contents: 'Multiple Items',
                boxes: boxes.map(box => ({
                    quantity: parseInt(box.quantity),
                    length: parseFloat(box.length),
                    breadth: parseFloat(box.breadth),
                    height: parseFloat(box.height),
                    dimension_unit: box.dimension_unit || 'cm',
                    weight: parseFloat(box.weight),
                    weight_unit: box.weight_unit || 'gm'
                }))
            },
            courier_id: String(courier_id)
        };

        // Call multi-box shipment API
        const result = await bookMultiBoxShipmentApi(payload);
        console.log('Multi-box API Result:', result);

        // Create shipment record
        const shipment = await Shipment.create({
            shipment_id: result.shipment_id,
            pickup_id: result.pickup_id,
            courier_id: result.courier_id,
            courier_name: result.courier_name,
            awb: result.awb,
            tracking_url: result.tracking_url,
            cost_estimate: result.cost_estimate,
            commission_amount,
            // Order reference
            order: order._id,
            client_order_id: order.client_order_id,
            userId,
            // Shipment details
            type: 'Multi-Box',
            shipment_mode,
            pickup_address_id,

            // Consignee details
            consignee,

            // Parcel details
            parcel: {
                type: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
                value: order.totalAmount,
                currency: 'INR',
                contents: 'Multiple Items',
                boxes: payload.parcel.boxes
            },

            status: "2",
            api_response: result
        });

        // Update order status and link shipment
        order.shipment = shipment._id;
        order.hasShipment = true;
        await order.save();

        // Populate shipment for response
        const populatedShipment = await Shipment.findOne({ id: shipment?.id }).populate('order');

        res.json({
            success: true,
            message: 'Multi-box shipment booked successfully',
            data: populatedShipment
        });

    } catch (err) {
        console.error('Book Multi-Box Shipment Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to book multi-box shipment',
            error: 'Internal Server Error',
            details: err.message
        });
    }
};

// Book International Shipment
exports.bookInternationalShipment = async (req, res) => {
    try {
        const {
            orderId,
            pickup_address_id,
            courier_id,
            dimensions,
        } = req.body;
        const userId = req.user?._id; // or however you're attaching the logged-in user
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        // Validate required fields
        if (!orderId || !pickup_address_id || !courier_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: orderId, pickup_address_id, courier_id',
                error: 'Validation failed'
            });
        }

        const order = await Order.findOne({ client_order_id: orderId, userId }).populate('customer products.product');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                error: 'Order not found'
            });
        }

        // Check if order already has a shipment
        const existingShipment = await Shipment.findOne({ order: order._id, userId });
        if (existingShipment) {
            return res.status(400).json({
                success: false,
                message: 'Order already has a shipment booked',
                error: 'Shipment already exists'
            });
        }

        const consignee = prepareConsignee(order);

        // Validate international shipping address
        if (!consignee.country_code || consignee.country_code === 'IN') {
            return res.status(400).json({
                success: false,
                message: 'International shipment requires valid non-Indian country code',
                error: 'Invalid country for international shipping'
            });
        }

        // Get dimensions from request or from first product
        const packageDimensions = dimensions && dimensions.length > 0
            ? dimensions[0]
            : order.products[0]?.product?.dimensions;

        if (!packageDimensions || !packageDimensions.length || !packageDimensions.breadth || !packageDimensions.height) {
            return res.status(400).json({
                success: false,
                message: 'Complete product dimensions (length, breadth, height) missing for international shipment',
                error: 'Dimensions required'
            });
        }

        // Prepare API payload according to iCarry international API documentation
        const payload = {
            pickup_address_id: parseInt(pickup_address_id),
            courier_id: String(courier_id),
            client_order_id: order.client_order_id,
            parcel: {
                type: 'Prepaid', // International shipments are only Prepaid
                value: order.totalAmount,
                currency: 'INR',
                contents: order.products.map(item => item.product.name).join(', ').substring(0, 255), // Max 255 chars
                dimensions: {
                    length: parseFloat(packageDimensions.length),
                    breadth: parseFloat(packageDimensions.breadth),
                    height: parseFloat(packageDimensions.height),
                    unit: 'cm' // Only cm supported
                },
                weight: {
                    weight: parseFloat(packageDimensions.weight),
                    unit: 'gm' // Only gm supported
                }
            },
            consignee: {
                name: consignee.name,
                mobile: consignee.mobile,
                address: consignee.address,
                city: consignee.city,
                pincode: consignee.pincode,
                state: consignee.state,
                country_code: consignee.country_code.toUpperCase() // Ensure uppercase ISO2 code
            }
        };

        console.log('International API Payload:', JSON.stringify(payload, null, 2));

        // Call international shipment API
        const result = await bookInternationalShipmentApi(payload);
        console.log('International API Result:', result);

        // Create shipment record
        const shipment = await Shipment.create({
            shipment_id: result.shipment_id,
            pickup_id: result.pickup_id,
            courier_id: result.courier_id,
            courier_name: result.courier_name,
            awb: result.awb,
            tracking_url: result.tracking_url,
            cost_estimate: result.cost_estimate || 0,
            userId,
            // Order reference
            order: order._id,
            client_order_id: order.client_order_id,

            // Shipment details
            type: 'International',
            shipment_mode: 'E', // International is typically air
            pickup_address_id,

            // Consignee details
            consignee: payload.consignee,

            // Parcel details
            parcel: {
                type: 'Prepaid',
                value: order.totalAmount,
                currency: 'INR',
                contents: payload.parcel.contents,
                weight: {
                    weight: parseFloat(totalWeight),
                    unit: 'gm'
                },
                dimensions: {
                    length: parseFloat(packageDimensions.length),
                    breadth: parseFloat(packageDimensions.breadth),
                    height: parseFloat(packageDimensions.height),
                    unit: 'cm'
                }
            },

            status: "2",
            api_response: result
        });

        // Update order status and link shipment
        order.shipment = shipment._id;
        order.hasShipment = true;
        await order.save();

        // Populate shipment for response
        const populatedShipment = await Shipment.findOne({ id: shipment?.id }).populate('order');

        res.json({
            success: true,
            message: 'International shipment booked successfully',
            data: populatedShipment
        });

    } catch (err) {
        console.error('Book International Shipment Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to book international shipment',
            error: 'Internal Server Error',
            details: err.message
        });
    }
};

// Get all shipments with filtering
exports.getAllShipments = async (req, res) => {
    try {
        const userId = req.user?._id; // or however you're attaching the logged-in user
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const shipments = await Shipment.find({ userId })
            .populate('order', 'client_order_id status paymentMethod')

        res.json({
            success: true,
            message: 'Shipments fetched successfully',
            data: shipments,
        });
    } catch (err) {
        console.error('Get Shipments Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shipments',
            error: 'Internal Server Error'
        });
    }
};

// Get shipment by ID
exports.getShipmentById = async (req, res) => {
    try {
        const userId = req.user?._id; // or however you're attaching the logged-in user
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' }); s
        const { id } = req.params;
        const shipment = await Shipment.findOne({ id: id, userId }).populate({
            path: 'order',
            populate: [
                { path: 'customer' },  // if you have a customer field inside order
            ]
        });
        console.log(shipment)
        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found',
                error: 'Shipment not found'
            });
        }

        res.json({
            success: true,
            message: 'Shipment fetched successfully',
            data: shipment
        });
    } catch (err) {
        console.error('Get Shipment Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shipment',
            error: 'Internal Server Error'
        });
    }
};

// Track Shipment
exports.trackShipment = async (req, res) => {
    try {
        const userId = req.user?._id; // or however you're attaching the logged-in user
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { id } = req.params;
        if (!id) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found',
                error: 'Shipment not found'
            });
        }
        const shipment = await Shipment.findOne({ id: id, userId }).populate('order');
        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found with given AWB',
                error: 'Not Found',
            });
        }
        const result = await trackShipmentApi({ shipment_id: shipment.shipment_id });
        res.json({
            success: true,
            message: 'Shipment tracking fetched',
            data: { ...result, awb: shipment.awb }
        });
    } catch (err) {
        console.error('Track Shipment Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to track shipment',
            error: 'Internal Server Error'
        });
    }
};

// Sync Shipment Status
exports.syncShipmentStatus = async (req, res) => {
    try {
        const userId = req.user?._id; // or however you're attaching the logged-in user
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { shipmentIds } = req.body;
        if (!shipmentIds?.length) return res.status(400).json({ error: 'shipmentIds are required' });

        const result = await syncShipmentStatusApi(shipmentIds);

        for (const shipment of result.msg) {
            await Shipment.findOneAndUpdate(
                { shipment_id: shipment.shipment_id, userId },
                { status: shipment.status },
                { new: true }
            );
        }

        res.json({ success: true, message: 'Shipment statuses synced', data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Sync Shipment Billing
exports.syncShipmentBilling = async (req, res) => {
    try {
        const userId = req.user?._id; // or however you're attaching the logged-in user
        const { shipmentIds } = req.body;
        if (!shipmentIds?.length) return res.status(400).json({ error: 'shipmentIds are required' });

        const result = await syncShipmentBillingApi(shipmentIds);

        for (const shipment of result.msg) {
            await Shipment.findOneAndUpdate(
                { shipment_id: shipment.shipment_id, userId },
                {
                    awb: shipment.awb,
                    billed_amount: shipment.miles,
                    billing_date: shipment.date,
                    shipping_mode: shipment.mode,
                    billing_zone: shipment.zone,
                    billed_weight: shipment.weight
                },
                { new: true }
            );
        }

        res.json({ success: true, message: 'Shipment billing synced', data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch billing',
            error: 'Internal Server Error'
        });
    }
};

// Print Shipment Label
exports.printShipmentLabel = async (req, res) => {
    try {
        const userId = req.user?._id; // or however you're attaching the logged-in user
        const { shipmentId } = req.body;

        const shipment = await Shipment.findOne({ id: shipmentId, userId });
        if (!shipment) {
            return res.status(404).json({ success: false, message: "Shipment not found" });
        }

        // Check if label already exists to avoid duplicate API call
        if (shipment.label && shipment.label.barcodeImageUrl) {
            return res.json({ success: true, message: 'Label already exists', data: shipment.label });
        }

        // Call external API to generate label
        const result = await printShipmentLabelApi(shipment.shipment_id);

        // Save label data to shipment
        shipment.label = {
            awb: result.awb,
            sortCode: result.sort_code,
            parcelType: result.parcel_type,
            parcelValue: result.parcel_value,
            courierName: result.courier_name,
            courierId: result.courier_id,
            barcodeImageUrl: result.barcode_img || null,
            barcodeBase64: result.barcode || null,
            returnAddress: result.return_address || null,
            consigneeAddress: result.consignee_address || null,
            consigneeMobile: result.consignee_mobile || null
        };
        await shipment.save();

        res.json({ success: true, message: 'Label fetched', data: shipment });

    } catch (err) {
        console.error('Label generation error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to generate label',
            error: 'Internal Server Error'
        });
    }
};

exports.printMultipleShipmentLabels = async (req, res) => {
    try {
        const userId = req.user?._id; // or however you're attaching the logged-in user
        const { shipmentIds } = req.body;

        if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "shipmentIds should be a non-empty array"
            });
        }

        const labelData = [];

        for (const shipment_id of shipmentIds) {
            const shipment = await Shipment.findOne({ userId, id: shipment_id });
            if (!shipment) {
                console.warn(`Shipment not found for ID: ${shipment_id}`);
                continue;
            }

            try {
                const result = await printShipmentLabelApi(shipment.shipment_id);

                shipment.label = {
                    awb: result.awb,
                    sortCode: result.sort_code,
                    parcelType: result.parcel_type,
                    parcelValue: result.parcel_value,
                    courierName: result.courier_name,
                    courierId: result.courier_id,
                    barcodeImageUrl: result.barcode_img || null,
                    barcodeBase64: result.barcode || null,
                    returnAddress: result.return_address || null,
                    consigneeAddress: result.consignee_address || null,
                    consigneeMobile: result.consignee_mobile || null
                };

                await shipment.save();
                labelData.push(shipment);
            } catch (labelErr) {
                console.error(`Label generation failed for ${shipment_id}:`, labelErr);
                labelData.push({
                    shipment_id,
                    error: "Label generation failed"
                });
            }
        }

        res.json({
            success: true,
            message: "Labels processed",
            data: labelData
        });

    } catch (err) {
        console.error("Error in printMultipleShipmentLabels:", err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message || "Unknown error"
        });
    }
};

exports.getShipmentDetails = async (req, res) => {
    try {
        console.log(req.params)
        let id = req.params.id
        const userId = req.user?._id; // or however you're attaching the logged-in user
        const shipment = await Shipment.findOne({ id: id, userId });
        if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
        res.json({ success: true, message: 'Shipment fetched', data: shipment });
    } catch (err) {
        console.error('Shipment Detail Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.getFilteredShipments = async (req, res) => {
    try {
        const filters = {};

        // if (req.query.shipmentId) filters.shipment_id = req.query.shipmentId;
        if (req.query.shipmentId) {
            const ids = req.query.shipmentId.split(',');
            filters.shipment_id = { $in: ids };
        }
        if (req.query.awb) filters.awb = req.query.awb;
        if (req.query.pincode) filters['consignee.pincode'] = req.query.pincode;
        if (req.query.contact) filters['consignee.mobile'] = req.query.contact;
        if (req.query.name) filters['consignee.name'] = { $regex: req.query.name, $options: 'i' };

        const shipments = await Shipment.find(filters);
        res.json(shipments);
    } catch (err) {
        console.error('Shipment Filter Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// exports.getORFilteredShipments = async (req, res) => {
//     try {
//         const orFilters = [];


//         // Filter by Shipment IDs (multiple IDs allowed)
//         if (req.query.shipmentId) {
//             const ids = req.query.shipmentId.split(',');
//             orFilters.push({ shipment_id: { $in: ids } });
//         }

//         // Filter by AWB
//         if (req.query.awb) {
//             const ids = req.query.awb.split(',');
//             orFilters.push({ awb: { $in: ids } });
//         }

//         // Filter by Pincode
//         if (req.query.pincode) {
//             const ids = req.query.pincode.split(',');
//             orFilters.push({ pincode: { $in: ids } });
//         }

//         // Filter by Contact/Mobile
//         if (req.query.contact) {
//             const ids = req.query.contact.split(',');
//             orFilters.push({ 'consignee.mobile': { $in: ids } });
//         }

//         // Filter by Name (Partial, case-insensitive)
//         if (req.query.name) {
//             const names = req.query.name.split(',');
//             const nameFilters = [];
//             nameFilters.push({ 'consignee.name': { $in: names } });
//             nameFilters.push({ 'consignee.name': { $regex: req.query.name, $options: 'i' } });
//             orFilters.push(...nameFilters);
//         }

//         let shipments;
//         if (orFilters.length > 0) {
//             shipments = await Shipment.find({ $or: orFilters });
//         } else {
//             // If no filters provided, return all shipments
//             shipments = await Shipment.find();
//         }

//         res.json(shipments);
//     } catch (err) {
//         console.error('Shipment Filter Error:', err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

exports.getShipmentByAwb = async (req, res) => {
    try {
        const userId = req.user?._id; // or however you're attaching the logged-in user
        const { awb } = req.query; // or req.params if you're using route params like /shipments/search/:awb
        console.log(awb)
        if (!awb) {
            return res.status(400).json({
                success: false,
                message: 'AWB is required',
                error: 'Missing AWB parameter',
            });
        }

        const shipment = await Shipment.findOne({ awb: awb, userId }).populate('order');
        console.log(shipment)
        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found with given AWB',
                error: 'Not Found',
            });
        }

        res.json({
            success: true,
            message: 'Shipment fetched successfully',
            data: shipment,
        });
    } catch (err) {
        console.error('Get Shipment by AWB Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shipment',
            error: 'Internal Server Error',
        });
    }
};

exports.cancelShipment = async (req, res) => {
    try {
        const userId = req.user?._id; // or however you're attaching the logged-in user
        const { shipment_id } = req.body;

        if (!shipment_id) {
            return res.status(400).json({
                success: false,
                message: "shipment_id is required",
            });
        }

        // 1. Find the shipment
        const shipment = await Shipment.findOne({ id: shipment_id, userId }).populate("order");
        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: "Shipment not found",
            });
        }

        // 2. Cancel it via courier API
        try {
            const result = await cancelShipmentApi({ shipment_id: shipment.shipment_id });
            shipment.status = "7";
            shipment.isCancelled = true;
            shipment.cancelledAt = new Date();
            await shipment.save();
        } catch (err) {
            console.error("Courier API cancellation failed:", err);
            return res.status(500).json({
                success: false,
                message: "Courier API cancellation failed",
                error: err.message,
            });
        }

        // 4. Update the related order's hasShipment = false
        const order = shipment.order;
        if (order) {
            order.hasShipment = false;
            await order.save();
        }

        res.json({
            success: true,
            message: "Shipment and related order updated successfully",
            data: shipment,
        });
    } catch (err) {
        console.error("Cancel Shipment Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

exports.reverseShipment = async (req, res) => {
    try {
        const userId = req.user?._id; // or however you're attaching the logged-in user
        const { shipment_id } = req.body;

        if (!shipment_id) {
            return res.status(400).json({
                success: false,
                message: "shipment_id is required",
            });
        }

        const shipment = await Shipment.findOne({ id: shipment_id, userId }).populate("order");
        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: "Shipment not found",
            });
        }

        // 2. Cancel it via courier API
        try {
            const result = await reverseShipmentApi({ shipment_id: shipment.shipment_id });
            await shipment.save();
        } catch (err) {
            console.error("Courier API return failed:", err);
            return res.status(500).json({
                success: false,
                message: "Courier API return failed",
                error: err.message,
            });
        }

        // Optionally update shipment with reverse shipment details
        shipment.reverse_shipment = {
            shipment_id: data.shipment_id,
            courier_id: data.courier_id,
            courier_name: data.courier_name,
            awb: data.awb,
            tracking_url: data.tracking_url,
            pickup_id: data.pickup_id,
        };
        shipment.isReverse = true;
        shipment.reverseCreatedAt = new Date();
        await shipment.save();

        return res.json({
            success: true,
            message: data.success,
            data: shipment.reverse_shipment,
        });
    } catch (error) {
        console.error("Reverse shipment creation failed:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

exports.getSyncedDataShipments = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // Step 1: Get all user's shipment IDs
        const shipments = await Shipment.find({ userId });
        const shipmentIds = shipments.map(s => s.shipment_id);

        if (!shipmentIds.length) {
            return res.json({ success: true, message: 'No shipments found', data: [] });
        }

        // Step 2: Sync Status
        const statusResult = await syncShipmentStatusApi(shipmentIds);
        for (const shipment of statusResult.msg) {
            const updateData = { status: shipment.status };
            // If status is 7 (Cancelled), mark isCancelled and cancelledAt
            if (shipment.status === "7") {
                updateData.isCancelled = true;
                updateData.cancelledAt = new Date();
            }

            await Shipment.findOneAndUpdate(
                { shipment_id: shipment.shipment_id, userId },
                updateData,
                { new: true }
            );
        }

        // Step 3: Sync Billing
        // Step 3: Sync Billing
        const billingResult = await syncShipmentBillingApi(shipmentIds);
        if (billingResult && Array.isArray(billingResult.msg)) {
            for (const shipment of billingResult.msg) {
                await Shipment.findOneAndUpdate(
                    { shipment_id: shipment.shipment_id, userId },
                    {
                        awb: shipment.awb,
                        billed_amount: shipment.miles,
                        billing_date: shipment.date,
                        shipping_mode: shipment.mode,
                        billing_zone: shipment.zone,
                        billed_weight: shipment.weight
                    },
                    { new: true }
                );
            }
        } else {
            console.warn("⚠️ Billing API returned unexpected format:", billingResult);
        }

        // Step 4: Return final updated list with populated order info
        const updatedShipments = await Shipment.find({ userId })
            .populate('order', 'client_order_id status paymentMethod');

        res.json({
            success: true,
            message: 'Shipments synced and fetched successfully',
            data: updatedShipments
        });

    } catch (err) {
        console.error('Get & Sync Shipments Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to sync and fetch shipments',
            error: 'Internal Server Error'
        });
    }
};
