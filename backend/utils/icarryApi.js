const axios = require('axios');

let apiToken = null;

const loginToICarry = async () => {
    const { data } = await axios.post('https://www.icarry.in/api_login', {
        username: process.env.ICARRY_USERNAME,
        key: process.env.ICARRY_API_KEY
    }, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Origin': 'https://www.icarry.in',
            'Referer': 'https://www.icarry.in/',
        }
    });
    apiToken = data.api_token;
    console.log('Logged into iCarry API successfully');
};

const makeICarryRequest = async (endpoint, payload, method = 'POST') => {
    if (!apiToken) await loginToICarry();

    const url = `https://www.icarry.in/${endpoint}&api_token=${apiToken}`;

    try {
        const { data } = await axios({ method, url, data: payload });

        // If token expired or unauthorized, auto-login & retry
        if (data.error && (data.error.includes("api_token is expired") || data.error.includes("invalid"))) {
            console.warn('API token expired, refreshing...');
            await loginToICarry();  // Re-login to get fresh token
            return await makeICarryRequest(endpoint, payload, method);  // Retry automatically
        }

        if (data.error && data.error !== '') {
            throw new Error(data.error);
        }

        return data;
    } catch (error) {
        console.error("iCarry API Request Failed:", error.message);
        throw new Error(`iCarry API Request Failed: ${error.message}`);
    }
};


// ✅ Shipment & Core APIs
module.exports = {
    loginToICarry,
    makeICarryRequest,

    // Shipment APIs
    cancelShipmentApi: (payload) => makeICarryRequest('api_cancel_shipment', payload),
    reverseShipmentApi: (payload) => makeICarryRequest('api_add_reverse_shipment', payload),
    bookSingleSurfaceShipmentApi: (payload) => makeICarryRequest('api_add_shipment_surface', payload),
    bookSingleAirShipmentApi: (payload) => makeICarryRequest('api_add_shipment_air', payload),
    bookMultiBoxShipmentApi: (payload) => makeICarryRequest('api_add_multibox_shipment', payload),
    bookInternationalShipmentApi: (payload) => makeICarryRequest('api_add_shipment_international', payload),
    trackShipmentApi: (payload) => makeICarryRequest('api_track_shipment', payload),
    syncShipmentStatusApi: (shipmentIds) => makeICarryRequest('api_shipment_status_sync', { shipment_ids: shipmentIds }),
    syncShipmentBillingApi: (shipmentIds) => makeICarryRequest('api_shipment_billing_sync', { shipment_ids: shipmentIds }),
    printShipmentLabelApi: (shipmentId) => makeICarryRequest('api_print_shipment_label', { shipment_id: shipmentId }),
    addPickupAddressApi: (payload) => makeICarryRequest('api_add_pickup_address', payload),
    updatePickupAddressApi: (payload) => makeICarryRequest('api_edit_pickup_address', payload),
    checkPincodeApi: (payload) => makeICarryRequest('api_check_pincode', payload),
    estimateSingleShipmentApi: (payload) => makeICarryRequest('api_get_estimate', payload),
    estimateMultiBoxShipmentApi: (payload) => makeICarryRequest('api_get_estimate_b2b', payload),
    estimateInternationalShipmentApi: (payload) => makeICarryRequest('api_get_estimate_international', payload),
};
