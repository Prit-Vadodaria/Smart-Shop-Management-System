import { getOrderTypeBadgeMeta } from './orderTypeBadge';

export const ORDER_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: 'online', label: 'Online Orders' },
  { value: 'takeaway', label: 'Takeaway Orders' },
  { value: 'subscription', label: 'Subscription Orders' },
  { value: 'pos', label: 'POS Orders' }
];

const ORDER_TYPE_LABEL_TO_FILTER = {
  'online order': 'online',
  'takeaway order': 'takeaway',
  'subscription order': 'subscription',
  'pos order': 'pos'
};

export const getOrderTypeFilterValue = (order) => {
  const badgeMeta = getOrderTypeBadgeMeta(order);
  if (!badgeMeta?.label) return null;

  return ORDER_TYPE_LABEL_TO_FILTER[badgeMeta.label.toLowerCase()] || null;
};

export const matchesOrderTypeFilter = (order, selectedOrderTypeFilter) => {
  if (selectedOrderTypeFilter === 'all') return true;

  const orderTypeFilterValue = getOrderTypeFilterValue(order);
  if (!orderTypeFilterValue) return false;

  return orderTypeFilterValue === selectedOrderTypeFilter;
};

export const filterOrdersByType = (orders, selectedOrderTypeFilter) => {
  if (!Array.isArray(orders)) return [];
  if (selectedOrderTypeFilter === 'all') return orders;
  return orders.filter((order) => matchesOrderTypeFilter(order, selectedOrderTypeFilter));
};

