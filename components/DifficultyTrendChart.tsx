"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendDatum {
  label: string;
  avg: number | null;
}

export default function DifficultyTrendChart({
  data,
}: {
  data: TrendDatum[];
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            allowDecimals={false}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            tick={{ fontSize: 12, fill: "#6B7280" }}
          />
          <Tooltip
            formatter={(value) => [
              value === null ? "нет данных" : `${value} / 5`,
              "Средняя сложность",
            ]}
            contentStyle={{
              borderRadius: 12,
              borderColor: "#E5E7EB",
              fontSize: 13,
            }}
          />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="#4F46E5"
            strokeWidth={2}
            dot={{ r: 4, fill: "#4F46E5", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}