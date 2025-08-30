import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

interface MailerCampaignReportChartProps {
  data: {
    id: string;
    opens_count: number;
    clicks_count: number;
  }[];
}

const MailerCampaignReportChart:React.FC<MailerCampaignReportChartProps> = ({ data }) => {
  console.log(data);
  return (
    <div>
      <h3>Mailer Campaign Report</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="id" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="opens_count" fill="#82ca9d" name="Opens" />
          <Bar dataKey="clicks_count" fill="#8884d8" name="Clicks" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MailerCampaignReportChart;
