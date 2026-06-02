const ORDER_TYPE_BADGE_MAP = {
  subscription: {
    label: 'Subscription Order',
    icon: 'subscription',
    classes: 'bg-purple-100 border-purple-200 dark:bg-purple-900/40 dark:border-purple-600',
    bgColor: '#e9d5ff',
    textColor: '#6b21a8'
  },
  online: {
    label: 'Online Order',
    icon: 'online',
    classes: 'bg-blue-100 border-blue-200 dark:bg-blue-900/40 dark:border-blue-600',
    bgColor: '#dbeafe',
    textColor: '#1e40af'
  },
  pos: {
    label: 'POS Order',
    icon: 'pos',
    classes: 'bg-emerald-100 border-emerald-200 dark:bg-green-900/40 dark:border-green-600',
    bgColor: '#d1fae5',
    textColor: '#065f46'
  },
  takeaway: {
    label: 'Takeaway Order',
    icon: 'takeaway',
    classes: 'bg-orange-100 border-orange-200 dark:bg-orange-900/40 dark:border-orange-600',
    bgColor: '#fed7aa',
    textColor: '#92400e'
  }
};

const extractOrderTypeCandidates = (order, explicitOrderType) => {
  const values = [
    explicitOrderType,
    order?.orderChannel,
    order?.orderType,
    order?.type,
    order?.orderSource,
    order?.source,
    order?.channel
  ].filter(Boolean);

  if (order?.isSubscriptionOrder || order?.subscriptionId || order?.subscription) {
    values.unshift('subscription');
  }

  return values.map((value) => String(value).toLowerCase().trim());
};

export const getOrderTypeBadgeMeta = (order, explicitOrderType) => {
  const candidates = extractOrderTypeCandidates(order, explicitOrderType);

  if (candidates.length === 0) return null;

  if (candidates.some((value) => value === 'subscription order')) return ORDER_TYPE_BADGE_MAP.subscription;
  if (candidates.some((value) => value === 'online order')) return ORDER_TYPE_BADGE_MAP.online;
  if (candidates.some((value) => value === 'pos order')) return ORDER_TYPE_BADGE_MAP.pos;
  if (candidates.some((value) => value === 'takeaway order')) return ORDER_TYPE_BADGE_MAP.takeaway;

  const hasAny = (terms) => candidates.some((value) => terms.some((term) => value.includes(term)));

  if (hasAny(['subscription', 'recurring'])) return ORDER_TYPE_BADGE_MAP.subscription;
  if (hasAny(['pos', 'in-store', 'instore', 'counter', 'store sale'])) return ORDER_TYPE_BADGE_MAP.pos;
  if (hasAny(['takeaway', 'take away', 'pickup', 'pick up'])) return ORDER_TYPE_BADGE_MAP.takeaway;
  if (hasAny(['online', 'home delivery', 'delivery', 'web', 'app', 'ecommerce'])) return ORDER_TYPE_BADGE_MAP.online;

  return null;
};
