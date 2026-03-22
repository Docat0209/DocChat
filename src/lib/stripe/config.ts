export const STRIPE_CONFIG = {
  prices: {
    pro: process.env.STRIPE_PRICE_ID_PRO!,
  },
  plans: {
    free: { name: 'Free', documents: 3, questionsPerDay: 20 },
    pro: { name: 'Pro', price: 9, documents: Infinity, questionsPerDay: Infinity },
  },
} as const
