import React from 'react';
import { MonitorSmartphone, ShoppingBag, Store, Repeat } from 'lucide-react';
import { getOrderTypeBadgeMeta } from '../../shared/utils/orderTypeBadge';

const ICON_MAP = {
  subscription: Repeat,
  online: MonitorSmartphone,
  pos: Store,
  takeaway: ShoppingBag
};

const OrderTypeBadge = ({ order, orderType, className = '' }) => {
  const meta = getOrderTypeBadgeMeta(order, orderType);
  if (!meta) return null;

  const Icon = ICON_MAP[meta.icon] || ShoppingBag;

  return (
    <span
      className={`inline-flex items-center self-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider leading-none whitespace-nowrap border shadow-sm ${meta.classes} ${className}`.trim()}
      style={{
        backgroundColor: meta.bgColor,
        color: meta.textColor
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
};

export default OrderTypeBadge;
