import { PieChart as RPie, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#146AFB', '#0B3D91', '#10B981', '#EAF2FF'];

interface Point {
  name: string;
  value: number;
}

export function PieChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <RPie>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </RPie>
      </ResponsiveContainer>
    </div>
  );
}
