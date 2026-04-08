"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X, Clock } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isWithinInterval, addMonths, subMonths, eachDayOfInterval, startOfDay } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

// --- Types ---
type DatePreset = {
  label: string;
  getValue: () => [Date, Date];
  id: string;
};

const PRESETS: DatePreset[] = [
  { label: "Hoje", id: "today", getValue: () => [new Date(), new Date()] },
  { label: "Ontem", id: "yesterday", getValue: () => [subDays(new Date(), 1), subDays(new Date(), 1)] },
  { label: "Últimos 3 dias", id: "last_3d", getValue: () => [subDays(new Date(), 2), new Date()] },
  { label: "Últimos 7 dias", id: "last_7d", getValue: () => [subDays(new Date(), 6), new Date()] },
  { label: "Últimos 14 dias", id: "last_14d", getValue: () => [subDays(new Date(), 13), new Date()] },
  { label: "Últimos 30 dias", id: "last_30d", getValue: () => [subDays(new Date(), 29), new Date()] },
  { label: "Últimos 90 dias", id: "last_90d", getValue: () => [subDays(new Date(), 89), new Date()] },
  { label: "Esta Semana", id: "this_week", getValue: () => [startOfWeek(new Date()), new Date()] },
  { label: "Semana Passada", id: "last_week", getValue: () => [startOfWeek(subDays(new Date(), 7)), endOfWeek(subDays(new Date(), 7))] },
  { label: "Este Mês", id: "this_month", getValue: () => [startOfMonth(new Date()), new Date()] },
  { label: "Mês Passado", id: "last_month", getValue: () => [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))] },
  { label: "Máximo", id: "maximum", getValue: () => [new Date(2010, 0, 1), new Date()] },
];

export function DateRangePicker() {
  const { period, customStart, customEnd, isCompare, setPeriod, setCustomRange, setIsCompare } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState<Date | null>(customStart ? new Date(customStart) : null);
  const [tempEnd, setTempEnd] = useState<Date | null>(customEnd ? new Date(customEnd) : null);
  const [viewMonth, setViewMonth] = useState(new Date());
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleApply = () => {
    if (tempStart && tempEnd) {
      setCustomRange(format(tempStart, "yyyy-MM-dd"), format(tempEnd, "yyyy-MM-dd"));
      setIsOpen(false);
    }
  };

  const selectPreset = (preset: DatePreset) => {
    // STANDARD PRESETS (today, last_7d, etc)
    // We only set the period. The API will use date_preset.
    setPeriod(preset.id);
    if (preset.id !== "custom") {
      setIsOpen(false);
    }
  };

  const onDateClick = (date: Date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (date < tempStart) {
        setTempEnd(tempStart);
        setTempStart(date);
      } else {
        setTempEnd(date);
      }
    }
  };

  // Rendering Helpers
  const renderCalendar = (month: Date) => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="w-64">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {format(month, "MMMM yyyy")}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <div key={i} className="h-8 flex items-center justify-center text-[10px] font-bold text-muted uppercase">
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            const isSelected = (tempStart && isSameDay(day, tempStart)) || (tempEnd && isSameDay(day, tempEnd));
            const isRange = tempStart && tempEnd && isWithinInterval(day, { start: tempStart, end: tempEnd });
            const isCurrentMonth = day.getMonth() === month.getMonth();

            return (
              <button
                key={i}
                onClick={() => onDateClick(day)}
                disabled={!isCurrentMonth}
                className={cn(
                  "h-8 w-8 flex items-center justify-center text-[11px] rounded transition-all",
                  !isCurrentMonth && "text-transparent pointer-events-none",
                  isCurrentMonth && "text-white/70 hover:bg-white/10",
                  isSelected && "bg-accent text-white font-bold rounded-full scale-110 z-10",
                  isRange && !isSelected && "bg-accent/20 text-accent font-medium rounded-none"
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const currentLabel = PRESETS.find(p => p.id === period)?.label || 
                 (customStart && customEnd ? `${format(new Date(customStart), "dd MMM")} - ${format(new Date(customEnd), "dd MMM")}` : "Período Personalizado");

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
      >
        <CalendarIcon className="w-4 h-4 text-accent" />
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Intervalo de Datas</span>
          <span className="text-xs font-bold text-white tracking-tight">{currentLabel}</span>
        </div>
        <ChevronLeft className={cn("w-4 h-4 text-muted transition-transform ml-2", isOpen ? "rotate-90" : "-rotate-90")} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 z-[100] glass border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl flex overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 min-w-[700px]">
          {/* Presets List */}
          <div className="w-48 border-r border-white/5 py-4 flex flex-col gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPreset(p)}
                className={cn(
                  "px-4 py-2 text-left text-xs font-medium transition-colors",
                  period === p.id ? "text-accent bg-accent/5 border-r-2 border-accent" : "text-muted hover:text-white hover:bg-white/5"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Calendar View */}
          <div className="p-6">
            <div className="flex gap-8">
              {renderCalendar(viewMonth)}
              {renderCalendar(addMonths(viewMonth, 1))}
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors border border-white/10"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button 
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors border border-white/10"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Comparar</span>
                  <button 
                    onClick={() => setIsCompare(!isCompare)}
                    className={cn(
                      "w-8 h-4 rounded-full relative transition-colors bg-white/10",
                      isCompare && "bg-accent"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                      isCompare ? "left-4.5" : "left-0.5"
                    )} />
                  </button>
                </div>
                
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[11px] font-bold text-muted hover:text-white uppercase tracking-widest transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleApply}
                  disabled={!tempStart || !tempEnd}
                  className="flex items-center gap-2 px-6 py-2 bg-accent text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-accent/80 transition-all disabled:opacity-30"
                >
                  <Check className="w-3 h-3" />
                  Aplicar
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[9px] text-muted/60 uppercase font-bold tracking-tighter">
              <Clock className="w-3 h-3" />
              Fuso Horário da Conta: (GMT-03:00) America/Sao_Paulo
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
