'use client';

import React, { useEffect, useState } from 'react';
import { getSubscriptionHistory, SubscriptionHistoryItem } from '@/lib/api/subscriptions';

/**
 * Subscription history tab with transaction table.
 */
export default function SubscriptionHistoryTab() {
  const [subHistory, setSubHistory] = useState<SubscriptionHistoryItem[]>([]);

  useEffect(() => {
    getSubscriptionHistory().then(data => setSubHistory(data)).catch(console.error);
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <h3 className="text-xl font-bold text-primary mb-6">Lịch sử bản đăng ký</h3>
      {subHistory.length === 0 ? (
        <div className="text-center py-10 bg-surface rounded-xl border border-outline border-dashed">
          <span className="material-symbols-outlined text-4xl text-secondary/50 mb-2">history</span>
          <p className="text-secondary font-medium">Chưa có lịch sử giao dịch nào.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-primary">
            <thead className="text-xs uppercase bg-surface text-secondary">
              <tr>
                <th className="px-6 py-3 rounded-tl-xl">Ngày</th>
                <th className="px-6 py-3">Hành động</th>
                <th className="px-6 py-3">Gói</th>
                <th className="px-6 py-3 rounded-tr-xl">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {subHistory.map((item) => (
                <tr key={item.id} className="border-b border-outline hover:bg-hover-bg transition-colors">
                  <td className="px-6 py-4">{new Date(item.changed_at).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.action === 'UPGRADE' ? 'bg-green-100 text-green-700' :
                      item.action === 'DOWNGRADE' ? 'bg-orange-100 text-orange-700' :
                      item.action === 'RENEW' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">{item.tier}</td>
                  <td className="px-6 py-4 text-secondary">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
