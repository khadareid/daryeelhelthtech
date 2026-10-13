import { BarChart as RBar, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Point {
  name: string;
  value: number;
}

export function BarChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <RBar data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#146AFB" radius={4} />
        </RBar>
      </ResponsiveContainer>
    </div>
  );
}
