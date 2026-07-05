'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getStudyHistory } from '@/lib/api/gamification';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

const shiftDate = (date: Date, numDays: number) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + numDays);
  return newDate;
};

/**
 * Study statistics tab with calendar heatmap.
 */
export default function StudyStatsTab() {
  const [studyHistory, setStudyHistory] = useState<{ date: string; count: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getStudyHistory().then(data => {
      const mapped = data.map(item => ({
        date: item.study_date,
        count: item.vocabulary_learned
      }));
      setStudyHistory(mapped);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      // Use requestAnimationFrame or timeout to ensure DOM has rendered
      const container = containerRef.current;
      const scrollToEnd = () => {
        container.scrollLeft = container.scrollWidth;
      };
      
      // Execute immediately and also on next frame for safety
      scrollToEnd();
      const rafId = requestAnimationFrame(scrollToEnd);
      return () => cancelAnimationFrame(rafId);
    }
  }, [studyHistory]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <h3 className="text-xl font-bold text-primary mb-2">Lịch sử học tập (Heatmap)</h3>
      <p className="text-secondary text-sm mb-6">Theo dõi tần suất và mức độ chăm chỉ của bạn qua từng ngày.</p>

      <div ref={containerRef} className="w-full max-w-3xl overflow-x-auto">
        <div className="min-w-[450px] md:min-w-[700px]">
          <CalendarHeatmap
            startDate={shiftDate(new Date(), -150)}
            endDate={new Date()}
            values={studyHistory}
            classForValue={(value) => {
              if (!value) {
                return 'color-empty';
              }
              return `color-github-${Math.min(value.count, 4)}`;
            }}
            tooltipDataAttrs={(value: any) => {
              return {
                'data-tip': `${value?.date || 'Không có dữ liệu'} có ${value?.count || 0} từ được học`,
              } as any;
            }}
            showWeekdayLabels={true}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .react-calendar-heatmap .color-empty { fill: #f0f0f0; }
        .react-calendar-heatmap .color-github-1 { fill: #d6e685; }
        .react-calendar-heatmap .color-github-2 { fill: #8cc665; }
        .react-calendar-heatmap .color-github-3 { fill: #44a340; }
        .react-calendar-heatmap .color-github-4 { fill: #1e6823; }
        .react-calendar-heatmap rect { rx: 2; ry: 2; }
      `}} />
    </div>
  );
}
