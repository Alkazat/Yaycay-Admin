import type {
  AdminConnector,
  AdminProgress,
  Affiliate,
  AffiliateRedemption,
  AiJob,
  ChildProfile,
  CustomerSummary,
  ModelRoute,
  ProductSummary,
  Prompt,
  Purchase,
  ReviewItem,
  TripContent,
  AdminTripSummary,
  AdminUserStatus,
} from '@/lib/contracts/types';

/**
 * Dev-store seed for a user row: everything an AdminUserRow needs EXCEPT
 * tripCount, which the store derives from the trips list at read time.
 */
export interface StubUser extends CustomerSummary {
  status: AdminUserStatus;
  createdAt: string | null;
  lastLoginAt: string | null;
  explorerCount: number;
  grownupCount: number;
}

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

export const stubTrips: AdminTripSummary[] = [
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
        did_you_know:
          'Singapore has more than 300 parks and 4 nature reserves.',
        weather: {
          summary: 'Hot and humid, afternoon storm',
          high: 32,
          low: 26,
        },
        hotel: { name: 'Village Hotel Sentosa', phase: 'move' },
        game: { kind: 'spot-it', title: 'Spot 5 sea creatures' },
        star_challenge: {
          title: 'Build a sandcastle taller than your bucket',
          stars: 3,
        },
        moments: [
          {
            id: 'm_1',
            slot: 'afternoon',
            title: 'Sentosa beaches',
            time_hint: '15:00',
            location: {
              name: 'Siloso Beach',
              lat: 1.255,
              lng: 103.81,
              zoom: 15,
            },
            activities: [
              {
                id: 'a_1',
                kind: 'kid',
                title: 'Beach treasure hunt',
                body: 'Hunt for shells and clues along the sand.',
                facts: [
                  'Siloso Beach is man-made, built with sand from nearby islands.',
                ],
                challenge: {
                  type: 'quiz',
                  prompt: 'How many legs does a crab have?',
                  answer: '10 (eight legs and two claws)',
                },
                variants: {
                  little: { body: 'Find three pretty shells with a grown-up.' },
                  explorer_plus: {
                    fact: 'Crabs breathe through gills, even on land.',
                  },
                },
              },
              {
                id: 'a_2',
                kind: 'adult',
                title: 'Sunset drinks',
                booking: { name: 'Ola Beach Club', time: '18:30' },
                safety: {
                  note: 'Lenny: anaphylactic to nuts/legumes - confirm with kitchen.',
                  flags: ['nuts', 'legumes'],
                },
              },
            ],
          },
        ],
      },
    ],
  },
};

export const stubProfiles: Record<string, ChildProfile[]> = {
  t_123: [
    {
      id: 'cp_1',
      name: 'Lenny',
      age: 6,
      mode: 'explorer',
      type: 'child',
      pin_set: false,
      interests: ['dinosaurs', 'swimming'],
      dietary: ['nut-free', 'legume-free'],
      medical: ['anaphylaxis (EpiPen)'],
      created_at: '2026-05-01T09:00:00Z',
      updated_at: '2026-05-15T09:00:00Z',
    },
    {
      id: 'cp_2',
      name: 'Mia',
      age: 9,
      mode: 'explorer_plus',
      type: 'child',
      pin_set: false,
      interests: ['art', 'animals'],
      dietary: [],
      medical: [],
      created_at: '2026-05-01T09:00:00Z',
      updated_at: '2026-05-15T09:00:00Z',
    },
  ],
};

export const stubProgress: Record<string, AdminProgress[]> = {
  t_123: [
    { profileId: 'cp_1', activeMode: 'explorer', doneItems: ['a_1'] },
    { profileId: 'cp_2', activeMode: 'explorer_plus', doneItems: [] },
  ],
};

export const stubProducts: ProductSummary[] = [
  {
    priceId: 'price_holiday_byo',
    name: 'Holiday (BYO-AI)',
    amountUsd: 59,
    kind: 'tier',
    tier: 'byo',
    active: true,
  },
  {
    priceId: 'price_holiday_ai',
    name: 'Holiday (use-our-AI)',
    amountUsd: 129,
    kind: 'tier',
    tier: 'ours',
    active: true,
  },
  {
    priceId: 'price_datakeep_annual',
    name: 'Keep data (annual)',
    amountUsd: 9,
    kind: 'keep',
    extendsMonths: 12,
    active: true,
  },
];

export const stubUsers: StubUser[] = [
  {
    userId: 'u_1',
    email: 'family@example.com',
    tier: 'ours',
    retentionExpiresAt: '2027-07-07',
    deletionRequested: false,
    status: 'active',
    createdAt: '2026-01-12T09:30:00Z',
    lastLoginAt: '2026-06-24T18:02:00Z',
    explorerCount: 2,
    grownupCount: 2,
  },
  {
    userId: 'u_2',
    email: 'another@example.com',
    tier: 'byo',
    retentionExpiresAt: null,
    deletionRequested: true,
    status: 'deletion-requested',
    createdAt: '2025-11-03T14:10:00Z',
    lastLoginAt: '2026-05-30T08:45:00Z',
    explorerCount: 1,
    grownupCount: 1,
  },
  {
    userId: 'u_3',
    email: 'pending.invite@example.com',
    tier: null,
    retentionExpiresAt: null,
    deletionRequested: false,
    status: 'invited',
    createdAt: '2026-06-20T11:00:00Z',
    lastLoginAt: null,
    explorerCount: 0,
    grownupCount: 0,
  },
];

export const stubConnectors: AdminConnector[] = [
  {
    id: 'g_1',
    userId: 'u_2',
    ownerEmail: 'another@example.com',
    assistant: 'Claude (claude.ai)',
    clientId: 'mcp_client_anthropic',
    scopes: ['yaycay.read', 'yaycay.plan'],
    status: 'active',
    createdAt: '2026-06-02T20:10:00Z',
    lastUsedAt: '2026-06-13T22:41:00Z',
  },
  {
    id: 'g_2',
    userId: 'u_1',
    ownerEmail: 'family@example.com',
    assistant: 'ChatGPT (chatgpt.com)',
    clientId: 'mcp_client_openai',
    scopes: ['yaycay.read'],
    status: 'active',
    createdAt: '2026-06-05T11:20:00Z',
    lastUsedAt: null,
  },
  {
    id: 'g_3',
    userId: 'u_1',
    ownerEmail: 'family@example.com',
    assistant: 'Gemini',
    clientId: 'mcp_client_google',
    scopes: ['yaycay.read', 'yaycay.plan'],
    status: 'revoked',
    createdAt: '2026-05-18T09:00:00Z',
    lastUsedAt: '2026-05-30T14:05:00Z',
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

export const stubAffiliates: Affiliate[] = [
  {
    id: 'aff_1',
    name: 'Sunny Travels',
    email: 'sunny@example.com',
    handle: '@sunnytravels',
    code: 'SUNNY15',
    discountPercent: 15,
    commissionPercent: 20,
    landingSlug: 'sunnytravels',
    status: 'active',
    createdAt: '2026-05-01T09:00:00Z',
  },
  {
    id: 'aff_2',
    name: 'Dad on Tour',
    email: 'dad@example.com',
    handle: '@dadontour',
    code: 'DAD10',
    discountPercent: 10,
    commissionPercent: 15,
    landingSlug: 'dadontour',
    status: 'paused',
    createdAt: '2026-04-12T09:00:00Z',
  },
];

export const stubRedemptions: Record<string, AffiliateRedemption[]> = {
  SUNNY15: [
    {
      purchaseId: 'pur_a1',
      ownerEmail: 'green@example.com',
      priceId: 'price_holiday_ai',
      grossUsd: 129,
      discountUsd: 19.35,
      netUsd: 109.65,
      createdAt: '2026-06-03T10:00:00Z',
    },
    {
      purchaseId: 'pur_a2',
      ownerEmail: 'wong@example.com',
      priceId: 'price_holiday_byo',
      grossUsd: 59,
      discountUsd: 8.85,
      netUsd: 50.15,
      createdAt: '2026-06-20T16:30:00Z',
    },
    {
      purchaseId: 'pur_a3',
      ownerEmail: 'singh@example.com',
      priceId: 'price_holiday_ai',
      grossUsd: 129,
      discountUsd: 19.35,
      netUsd: 109.65,
      createdAt: '2026-05-28T11:15:00Z',
    },
  ],
  DAD10: [
    {
      purchaseId: 'pur_b1',
      ownerEmail: 'lee@example.com',
      priceId: 'price_holiday_byo',
      grossUsd: 59,
      discountUsd: 5.9,
      netUsd: 53.1,
      createdAt: '2026-06-09T08:00:00Z',
    },
  ],
};

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
