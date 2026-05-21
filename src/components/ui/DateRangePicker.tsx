import React from 'react';
import { Calendar } from 'lucide-react';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  date: DateRange;
  onChange: (date: DateRange) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ date, onChange, className }) => {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const newDate = new Date(val + 'T00:00:00');
      onChange({ ...date, from: newDate });
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const newDate = new Date(val + 'T23:59:59');
      onChange({ ...date, to: newDate });
    }
  };

  const formatHtmlDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className={`flex items-center gap-2 p-1.5 bg-black/40 border border-white/10 rounded-xl backdrop-blur-md shadow-inner ${className || ''}`}>
      <div className="pl-3 pr-2 flex items-center text-indigo-400/80">
        <Calendar className="w-4 h-4" />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={formatHtmlDate(date.from)}
          onChange={handleFromChange}
          className="bg-transparent border-none text-xs font-semibold text-white/90 focus:outline-none focus:ring-0 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.8] cursor-pointer"
        />
        <span className="text-white/30 font-bold text-xs">Até</span>
        <input
          type="date"
          value={formatHtmlDate(date.to)}
          onChange={handleToChange}
          className="bg-transparent border-none text-xs font-semibold text-white/90 focus:outline-none focus:ring-0 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.8] cursor-pointer"
        />
      </div>
    </div>
  );
};
