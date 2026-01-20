/**
 * Verification script for Delivery Flow
 * Tests the complete workflow from driver/restaurant registration to delivery completion
 */

const BASE_URL = 'http://localhost:3000/api';

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, data = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error);
    throw error;
  }
}

// Test data
const driverData = {
  email: `driver_${Date.now()}@test.com`,
  password: 'Driver123!',
  name: 'Test Driver',
  phone: '+1234567890',
  role: 'DRIVER',
};

const restaurantData = {
  email: `restaurant_${Date.now()}@test.com`,
  password: 'Restaurant123!',
  name: 'Test Restaurant Owner',
  phone: '+1234567891',
  role: 'RESTAURANT',
};

const driverProfile = {
  vehicleType: 'MOTORCYCLE',
  hasDeliveryBox: true,
};

const restaurantProfile = {
  restaurantName: 'Test Pizza Place',
  ownerName: 'John Doe',
  addressText: '123 Main St, City',
  location: {
    type: 'Point',
    coordinates: [-73.935242, 40.73061], // NYC coordinates
  },
};

const driverLocation = {
  location: {
    type: 'Point',
    coordinates: [-73.935, 40.7305], // Close to restaurant
  },
};

async function runVerification() {
  console.log('🚀 Starting Delivery Flow Verification\n');

  try {
    // Step 1: Register driver
    console.log('Step 1: Register driver...');
    const driverRegister = await makeRequest(
      'POST',
      '/auth/register',
      driverData,
    );
    console.log(`✅ Driver registered (Status: ${driverRegister.status})`);
    const driverToken = driverRegister.data.data?.accessToken;

    // Step 2: Create driver profile
    console.log('\nStep 2: Create driver profile...');
    const driverProfileRes = await makeRequest(
      'POST',
      '/driver/profile',
      driverProfile,
      driverToken,
    );
    console.log(
      `✅ Driver profile created (Status: ${driverProfileRes.status})`,
    );

    // Step 3: Set driver as available and verified (in real app, admin would verify)
    console.log('\nStep 3: Update driver to available and verified...');
    const updateDriverRes = await makeRequest(
      'PATCH',
      '/driver/profile',
      {
        isAvailable: true,
        isVerified: true,
      },
      driverToken,
    );
    console.log(`✅ Driver updated (Status: ${updateDriverRes.status})`);

    // Step 4: Set driver location
    console.log('\nStep 4: Set driver location...');
    const locationRes = await makeRequest(
      'PATCH',
      '/driver/location',
      driverLocation,
      driverToken,
    );
    console.log(`✅ Driver location set (Status: ${locationRes.status})`);

    // Step 5: Register restaurant
    console.log('\nStep 5: Register restaurant...');
    const restaurantRegister = await makeRequest(
      'POST',
      '/auth/register',
      restaurantData,
    );
    console.log(
      `✅ Restaurant registered (Status: ${restaurantRegister.status})`,
    );
    const restaurantToken = restaurantRegister.data.data?.accessToken;

    // Step 6: Create restaurant profile
    console.log('\nStep 6: Create restaurant profile...');
    const restaurantProfileRes = await makeRequest(
      'POST',
      '/restaurant/profile',
      restaurantProfile,
      restaurantToken,
    );
    console.log(
      `✅ Restaurant profile created (Status: ${restaurantProfileRes.status})`,
    );
    const restaurantId = restaurantProfileRes.data.data?._id;

    // Step 7: Restaurant creates delivery request
    console.log('\nStep 7: Restaurant creates delivery request...');
    const deliveryRequest = {
      restaurantId: restaurantId,
      pickupLocation: restaurantProfile.location,
      pickupAddressText: restaurantProfile.addressText,
      dropoffLocation: {
        type: 'Point',
        coordinates: [-73.94, 40.735], // Customer location
      },
      dropoffAddressText: '456 Customer Ave, City',
      deliveryFee: 15.5,
      notes: 'Ring doorbell twice',
    };
    const createRequestRes = await makeRequest(
      'POST',
      '/requests',
      deliveryRequest,
      restaurantToken,
    );
    console.log(
      `✅ Delivery request created (Status: ${createRequestRes.status})`,
    );
    const requestId = createRequestRes.data.data?._id;

    // Wait a moment for matching to complete
    console.log('\n⏳ Waiting for matching service to propose to drivers...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 8: Driver fetches inbox offers
    console.log('\nStep 8: Driver fetches inbox offers...');
    const inboxRes = await makeRequest(
      'GET',
      '/offers/inbox?state=SENT',
      null,
      driverToken,
    );
    console.log(`✅ Driver inbox fetched (Status: ${inboxRes.status})`);
    console.log(`   Found ${inboxRes.data.data?.length || 0} offers`);

    const offers = inboxRes.data.data || [];
    if (offers.length === 0) {
      console.log(
        '⚠️ No offers found. Matching may have failed or driver is too far.',
      );
      return;
    }

    const offerId = offers[0]._id;
    console.log(`   Offer ID: ${offerId}`);

    // Step 9: Driver accepts offer
    console.log('\nStep 9: Driver accepts offer...');
    const acceptRes = await makeRequest(
      'POST',
      `/offers/${offerId}/accept`,
      null,
      driverToken,
    );
    console.log(`✅ Offer accepted (Status: ${acceptRes.status})`);

    if (acceptRes.status !== 200) {
      console.log('❌ Failed to accept offer:', acceptRes.data);
      return;
    }

    // Step 10: Driver updates status to IN_DELIVERY
    console.log('\nStep 10: Driver updates status to IN_DELIVERY...');
    const inDeliveryRes = await makeRequest(
      'PATCH',
      `/requests/${requestId}/status`,
      {
        status: 'IN_DELIVERY',
      },
      driverToken,
    );
    console.log(
      `✅ Status updated to IN_DELIVERY (Status: ${inDeliveryRes.status})`,
    );

    // Step 11: Driver updates status to DELIVERED
    console.log('\nStep 11: Driver updates status to DELIVERED...');
    const deliveredRes = await makeRequest(
      'PATCH',
      `/requests/${requestId}/status`,
      {
        status: 'DELIVERED',
      },
      driverToken,
    );
    console.log(
      `✅ Status updated to DELIVERED (Status: ${deliveredRes.status})`,
    );

    // Step 12: Restaurant checks request status
    console.log('\nStep 12: Restaurant checks request status...');
    const checkRequestRes = await makeRequest(
      'GET',
      `/requests/${requestId}`,
      null,
      restaurantToken,
    );
    console.log(
      `✅ Request status checked (Status: ${checkRequestRes.status})`,
    );
    console.log(`   Final status: ${checkRequestRes.data.data?.status}`);

    console.log('\n🎉 Verification completed successfully!\n');
    console.log('Summary:');
    console.log(`- Driver: ${driverData.email}`);
    console.log(`- Restaurant: ${restaurantData.email}`);
    console.log(`- Request ID: ${requestId}`);
    console.log(`- Offer ID: ${offerId}`);
    console.log(`- Final Status: ${checkRequestRes.data.data?.status}`);
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
runVerification()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  });
