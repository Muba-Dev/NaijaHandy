export default function NotificationsTab() {
  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-5">Notification Preferences</h2>
      <div className="space-y-4">
        {[
          { label: 'Booking Confirmations', sub: 'Get notified when a booking is confirmed', default: true },
          { label: 'Job Reminders', sub: '24-hour reminder before scheduled jobs', default: true },
          { label: 'New Messages', sub: 'Receive alerts for new messages from artisans', default: true },
          { label: 'Promotions & Offers', sub: 'Deals and platform news', default: false },
          { label: 'SMS Alerts', sub: 'Text messages for critical updates', default: false },
        ].map((n, idx) => (
          <label
            key={n.label}
            htmlFor={`notif-${idx}`}
            className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 cursor-pointer"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{n.label}</p>
              <p className="text-xs text-gray-500">{n.sub}</p>
            </div>
            <input id={`notif-${idx}`} type="checkbox" defaultChecked={n.default} className="w-5 h-5 accent-emerald-600" />
          </label>
        ))}
      </div>
    </div>
  )
}
