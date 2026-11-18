import React from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useGymOs } from '../context/GymOsContext';
import { formatDateTime } from '../utils/formatters';

export function NotificationsPage() {
  const { tenantNotifications, markNotificationRead, approveRenewalRequest } = useGymOs();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-white">
          Notifications & Renewal Requests
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Membership expiry alerts, pending installment notices, and member portal requests.
        </p>
      </div>

      {tenantNotifications.length === 0 ? (
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-10 text-center">
          <Bell className="w-6 h-6 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-white">All caught up</p>
          <p className="mt-1 text-xs text-slate-400">
            No pending alerts or member renewal requests for this workspace.
          </p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl divide-y divide-white/[0.06]">
          {tenantNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                notif.isRead ? 'opacity-70' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium text-emerald-400 capitalize">
                    {notif.type.replace('_', ' ')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{formatDateTime(notif.createdAt)}</span>
                  {!notif.isRead && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-400 font-medium">Unread</span>
                    </>
                  )}
                </div>
                <h3 className="text-sm font-display font-semibold text-white">{notif.title}</h3>
                <p className="text-xs text-slate-300">{notif.message}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {notif.type === 'renewal_request' && notif.actionStatus === 'pending' && (
                  <Button size="sm" onClick={() => approveRenewalRequest(notif.id)}>
                    Approve & Renew
                  </Button>
                )}
                {notif.actionStatus === 'approved' && (
                  <span className="text-xs font-medium text-emerald-400">Approved</span>
                )}
                {!notif.isRead && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => markNotificationRead(notif.id)}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Read</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
