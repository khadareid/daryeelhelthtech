import { LineChart as RLine, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Point {
  name: string;
  value: number;
}
// done
export function LineChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <RLine data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#146AFB" strokeWidth={2} />
        </RLine>
      </ResponsiveContainer>
    </div>
  );
}
