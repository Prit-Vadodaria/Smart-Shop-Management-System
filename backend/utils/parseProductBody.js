const NUMERIC_FIELDS = [
  'price',
  'taxPercentage',
  'countInStock',
  'minStockThreshold',
];

export const parseProductBody = (body = {}) => {
  const parsed = { ...body };

  for (const field of NUMERIC_FIELDS) {
    if (parsed[field] !== undefined && parsed[field] !== '') {
      parsed[field] = Number(parsed[field]);
    }
  }

  if (parsed.isSubscriptionEligible !== undefined) {
    parsed.isSubscriptionEligible =
      parsed.isSubscriptionEligible === true ||
      parsed.isSubscriptionEligible === 'true';
  }

  if (parsed.isActive !== undefined) {
    parsed.isActive = parsed.isActive === true || parsed.isActive === 'true';
  }

  delete parsed.imageUrl;

  return parsed;
};
