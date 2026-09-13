"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface SubjectDifficultyDatum {
  name: string;
  avg: number;
  color: string;
}

export default function SubjectDifficultyChart({
  data,
}: {
  data: SubjectDifficultyDatum[];
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            tick={{ fontSize: 12, fill: "#6B7280" }}
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
            cursor={{ fill: "rgba(79,70,229,0.06)" }}
            formatter={(value) => [`${value} / 5`, "Средняя сложность"]}
            contentStyle={{
              borderRadius: 12,
              borderColor: "#E5E7EB",
              fontSize: 13,
            }}
          />
          <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}