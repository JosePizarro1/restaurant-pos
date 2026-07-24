import {DateRangePicker} from "@/components/common/antd/date.range.picker.tsx";
import {useState} from "react";
import { useTranslation } from 'react-i18next';
import {DateTime} from "luxon";
import { Dayjs } from "dayjs";
import {getAppTimezone} from "@/lib/datetime.ts";

interface DateRangeProps {
  startName?: string;
  endName?: string;
  label?: string;
  isRequired?: boolean;
}

export function DateRange({
  startName = "start",
  endName = "end",
  label,
  isRequired = false,
}: DateRangeProps) {
  const { t } = useTranslation('reports');
  const displayLabel = label ?? t('filters.selectRange', 'Seleccionar un rango');
  const now = () => DateTime.now().setZone(getAppTimezone());
  const todayStart = now().startOf("day").toFormat(import.meta.env.VITE_DATE_TIME_FORMAT);
  const todayEnd = now().endOf("day").toFormat(import.meta.env.VITE_DATE_TIME_FORMAT);

  const presets = [
    { key: "Today", label: t('datePresets.today', 'Hoy'), value: `${todayStart}to${todayEnd}` },
    { key: "Yesterday", label: t('datePresets.yesterday', 'Ayer'), value: `${now().minus({'day': 1}).startOf("day").toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}to${now().minus({'day': 1}).endOf("day").toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}` },
    { key: "This week", label: t('datePresets.thisWeek', 'Esta semana'), value: `${now().startOf('week').toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}to${now().endOf('week').toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}` },
    { key: "Last week", label: t('datePresets.lastWeek', 'Semana pasada'), value: `${now().minus({week: 1}).startOf('week').toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}to${now().minus({week: 1}).endOf('week').toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}` },
    { key: "This month", label: t('datePresets.thisMonth', 'Este mes'), value: `${now().startOf('month').toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}to${now().endOf('month').toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}` },
    { key: "Last month", label: t('datePresets.lastMonth', 'Mes pasado'), value: `${now().minus({month: 1}).startOf('month').toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}to${now().minus({month: 1}).endOf('month').toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}` },
    { key: "This year", label: t('datePresets.thisYear', 'Este año'), value: `${now().startOf('year').toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}to${now().endOf('year').toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}` },
    { key: "Last year", label: t('datePresets.lastYear', 'Año pasado'), value: `${now().minus({year: 1}).startOf('year').toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}to${now().minus({year: 1}).endOf('year').toFormat(import.meta.env.VITE_DATE_TIME_FORMAT)}` },
    { key: "All time", label: t('datePresets.allTime', 'Todo el historial'), value: "to" },
    { key: "Custom", label: t('datePresets.custom', 'Personalizado'), value: "CUS" }
  ];

  const [isCustom, setCustom] = useState(false);
  const [preset, setPreset] = useState([todayStart, todayEnd]);
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  return (
    <div className="flex flex-col w-full">
      <label htmlFor="date-preset">{displayLabel}</label>
      <select
        id="date-preset"
        onChange={(event) => {
          const value = event.target.value.split('to');
          if(value[0] === 'CUS') {
            setCustom(true);
          }else {
            setPreset(value);
            setCustom(false);
          }
        }}
        className="form-control self-center"
      >
        {presets.map(item => (
          <option key={item.key} value={item.value}>{item.label}</option>
        ))}
      </select>
      {!isCustom && (
        <>
          <input type="hidden" name={startName} value={preset[0]} required={isRequired}/>
          <input type="hidden" name={endName} value={preset[1]} required={isRequired}/>
        </>
      )}
      {isCustom && (
        <div className="mt-3">
          <DateRangePicker
            startName={startName}
            endName={endName}
            required={isRequired}
            value={customRange}
            onChange={(nextValue) => {
              setCustomRange(nextValue);
            }}
          />
        </div>
      )}

    </div>
  );
}