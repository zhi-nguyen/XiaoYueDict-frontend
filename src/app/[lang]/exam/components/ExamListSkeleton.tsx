'use client';

import React from 'react';

export default function ExamListSkeleton() {
  return (
    <div className="w-full p-8 pb-16">
      <div className="max-w-[1280px] mx-auto animate-pulse">
        {/* Title skeleton */}
        <div className="h-9 w-64 bg-slate-200 rounded-lg mb-8" />

        {/* Category container */}
        <div className="mb-12 bg-white border border-outline/60 rounded-[2rem] p-6 shadow-sm">
          {/* Header skeleton */}
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-outline/30">
            <div className="h-7 w-40 bg-slate-200 rounded" />
            <div className="h-5 w-5 bg-slate-200 rounded-full" />
          </div>

          {/* Level tabs skeleton */}
          <div className="flex gap-3 mb-6">
            <div className="h-8 w-16 bg-slate-200 rounded-full" />
            <div className="h-8 w-16 bg-slate-200 rounded-full" />
            <div className="h-8 w-16 bg-slate-200 rounded-full" />
          </div>

          {/* Cards skeleton */}
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-100 rounded-[1.5rem] p-5 w-[290px] h-[210px] shrink-0 flex flex-col justify-between border border-slate-200"
              >
                <div>
                  <div className="flex justify-between mb-3">
                    <div className="h-5 w-14 bg-slate-200 rounded-full" />
                    <div className="h-5 w-16 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-5 w-44 bg-slate-200 rounded mb-2" />
                  <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-28 bg-slate-200 rounded" />
                    <div className="h-3 w-32 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                  <div className="h-4 w-12 bg-slate-200 rounded" />
                  <div className="h-8 w-24 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
