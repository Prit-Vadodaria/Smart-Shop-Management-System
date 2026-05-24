import React from 'react';
import { Check, X } from 'lucide-react';
import { PASSWORD_HINTS, validatePassword } from '../shared/utils/passwordValidation';

const CHECK_LABELS = {
  minLength: PASSWORD_HINTS[0],
  uppercase: PASSWORD_HINTS[1],
  lowercase: PASSWORD_HINTS[2],
  number: PASSWORD_HINTS[3],
  special: PASSWORD_HINTS[4],
};

const PasswordStrength = ({ password, showHints = true }) => {
  if (!password) return null;

  const { valid, checks } = validatePassword(password);
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const percent = Math.round((passed / total) * 100);

  const barColor =
    percent < 40 ? 'bg-red-500' : percent < 80 ? 'bg-amber-500' : valid ? 'bg-green-500' : 'bg-amber-500';

  return (
    <div className="mt-2 space-y-2">
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showHints && (
        <ul className="space-y-1">
          {Object.entries(CHECK_LABELS).map(([key, label]) => {
            const ok = checks[key];
            return (
              <li
                key={key}
                className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-gray-500'}`}
              >
                {ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
                {label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrength;
