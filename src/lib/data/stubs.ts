import type {
  AiJob,
  CustomerSummary,
  ModelRoute,
  ProductSummary,
  Prompt,
  Purchase,
  ReviewItem,
  TripContent,
  TripSummary,
} from '@/lib/contracts/types';

/*
 * Local fixtures used when Supabase / BE are not configured (dev only).
 * These mirror the contract shapes so screens render with realistic data.
 */

export const stubPrompts: Prompt[] = [
  {
    id: 'p_generate',
    task: 'trip.generate',
    title: 'Trip day generator',
    body: 'You build a single delightful family holiday day...',
    model: 'claude-sonnet',
    version: 3,
    active: true,
    updatedAt: '2026-06-01T09:00:00Z',
    updatedBy: 'dev-admin@yaycay.local',
  },
  {
    id: 'p_ingest',
    task: 'ingest.reservation',
    title: 'Reservation ingestion',
    body: 'Extract a booking from the supplied text or image...',
    model: 'claude-sonnet',
    version: 1,
    active: true,
    updatedAt: '2026-05-20T14:30:00Z',
    updatedBy: 'dev-admin@yaycay.local',
  },
];

export const stubModelRoutes: ModelRoute[] = [
  { task: 'trip.generate', defaultModel: 'claude-sonnet' },
  { task: 'ingest.reservation', defaultModel: 'claude-sonnet' },
  { task: 'chat.plan', defaultModel: 'claude-sonnet', override: 'claude-opus' },
];

export const stubJobs: AiJob[] = [
  {
    id: 'j_1',
    tripId: 't_123',
    kind: 'generation',
    status: 'succeeded',
    model: 'claude-sonnet',
    promptVersion: 3,
    createdAt: '2026-06-07T10:15:00Z',
  },
  {
    id: 'j_2',
    tripId: 't_123',
    kind: 'ingestion',
    status: 'failed',
    model: 'claude-sonnet',
    promptVersion: 1,
    createdAt: '2026-06-07T11:02:00Z',
    error: 'Could not parse reservation image: low resolution.',
  },
  {
    id: 'j_3',
    tripId: 't_456',
    kind: 'chat',
    status: 'running',
    model: 'claude-sonnet',
    promptVersion: 3,
    createdAt: '2026-06-08T08:40:00Z',
  },
];

export const stubTrips: TripSummary[] = [
  {
    id: 't_123',
    destination: 'Singapore',
    ownerEmail: 'family@example.com',
    tier: 'ours',
    status: 'planning',
    startDate: '2026-06-26',
    endDate: '2026-07-07',
    retentionExpiresAt: '2027-07-07',
  },
  {
    id: 't_456',
    destination: 'Gold Coast',
    ownerEmail: 'another@example.com',
    tier: 'byo',
    status: 'holidaying',
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    retentionExpiresAt: null,
  },
];

export const stubTripContent: Record<string, TripContent> = {
  t_123: {
    trip: {
      id: 't_123',
      destination: 'Singapore',
      start_date: '2026-06-26',
      end_date: '2026-07-07',
      timezone: 'Asia/Singapore',
      currency: 'SGD',
    },
    days: [
      {
        id: 'd_1',
        date: '2026-06-26',
        label: 'Arrival',
        summary: 'Settle in and hit the beach.',
        moments: [
          {
            id: 'm_1',
            slot: 'afternoon',
            title: 'Sentosa beaches',
            time_hint: '15:00',
            activities: [
              { id: 'a_1', kind: 'kid', title: 'Beach treasure hunt' },
              { id: 'a_2', kind: 'adult', title: 'Sunset drinks' },
            ],
          },
        ],
      },
    ],
  },
};

export const stubProducts: ProductSummary[] = [
  { priceId: 'price_holiday_byo', name: 'Holiday (BYO-AI)', amountUsd: 59 },
  { priceId: 'price_holiday_ai', name: 'Holiday (use-our-AI)', amountUsd: 129 },
  {
    priceId: 'price_datakeep_annual',
    name: 'Keep data (annual)',
    amountUsd: 9,
  },
];

export const stubCustomers: CustomerSummary[] = [
  {
    userId: 'u_1',
    email: 'family@example.com',
    tier: 'ours',
    retentionExpiresAt: '2027-07-07',
    deletionRequested: false,
  },
  {
    userId: 'u_2',
    email: 'another@example.com',
    tier: 'byo',
    retentionExpiresAt: null,
    deletionRequested: true,
  },
];

export const stubReviewItems: ReviewItem[] = [
  {
    tripId: 't_123',
    destination: 'Singapore',
    status: 'pending',
    generatedAt: '2026-06-07T10:15:00Z',
    reviewedAt: null,
    reviewedBy: null,
  },
  {
    tripId: 't_456',
    destination: 'Gold Coast',
    status: 'approved',
    generatedAt: '2026-06-06T09:00:00Z',
    reviewedAt: '2026-06-06T12:30:00Z',
    reviewedBy: 'dev-admin@yaycay.local',
  },
];

export const stubPurchases: Purchase[] = [
  {
    id: 'pur_1',
    ownerEmail: 'family@example.com',
    priceId: 'price_holiday_ai',
    tier: 'ours',
    amountUsd: 129,
    createdAt: '2026-05-30T08:12:00Z',
  },
  {
    id: 'pur_2',
    ownerEmail: 'another@example.com',
    priceId: 'price_holiday_byo',
    tier: 'byo',
    amountUsd: 59,
    createdAt: '2026-06-02T19:40:00Z',
  },
  {
    id: 'pur_3',
    ownerEmail: 'family@example.com',
    priceId: 'price_datakeep_annual',
    tier: 'ours',
    amountUsd: 9,
    createdAt: '2026-06-05T11:05:00Z',
  },
];
