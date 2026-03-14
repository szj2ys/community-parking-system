import { http, HttpResponse } from 'msw';

// API mock handlers for testing
export const handlers = [
  // Auth API mocks
  http.post('/api/auth/send-code', async () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/auth/verify', async () => {
    return HttpResponse.json({
      token: 'mock-token',
      user: {
        id: 'test-user-id',
        phone: '138****8888',
        role: 'TENANT',
      },
    });
  }),

  // User API mocks
  http.get('/api/user', () => {
    return HttpResponse.json({
      id: 'test-user-id',
      phone: '138****8888',
      name: 'Test User',
      role: 'TENANT',
      referralCode: 'TEST123',
      referralRewards: 0,
    });
  }),

  // Spots API mocks
  http.get('/api/spots', () => {
    return HttpResponse.json({
      spots: [
        {
          id: 'spot-1',
          title: 'Test Parking Spot',
          address: '123 Test St',
          pricePerHour: 10,
          status: 'AVAILABLE',
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    });
  }),

  // Orders API mocks
  http.get('/api/orders', () => {
    return HttpResponse.json({
      orders: [
        {
          id: 'order-1',
          spotId: 'spot-1',
          tenantId: 'test-user-id',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          totalPrice: 20,
          status: 'PENDING',
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    });
  }),

  http.post('/api/orders', async () => {
    return HttpResponse.json({
      id: 'new-order-id',
      spotId: 'spot-1',
      tenantId: 'test-user-id',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      totalPrice: 30,
      status: 'PENDING',
    });
  }),
];
