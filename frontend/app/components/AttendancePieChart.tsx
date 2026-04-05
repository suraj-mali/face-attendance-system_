"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";

interface AttendancePieChartProps {
  present: number;
  absent: number;
  title?: string;
}

export default function AttendancePieChart({
  present,
  absent,
  title,
}: AttendancePieChartProps) {
  const total = present + absent;
  const percentage = total === 0 ? 0 : (present / total) * 100;

  const data = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
  ];

  // colors based on the requested specification
  const COLORS = ["#16a34a", "#dc2626"];

  return (
    <div className="w-full flex flex-col items-center bg-white border border-gray-100 rounded-lg shadow-sm p-4 h-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 w-full text-center mb-2">
          {title}
        </h3>
      )}

      <div style={{ width: "100%", height: "220px" }} className="relative flex-1">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No Data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <Label
                  value={`${percentage.toFixed(1)}%`}
                  position="center"
                  fill="#1f2937"
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    fontFamily: "sans-serif",
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-center space-x-4 mt-2 mb-2 w-full">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-600 mr-2"></span>
          {present} Present
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span>
          {absent} Absent
        </div>
      </div>
    </div>
  );
}
