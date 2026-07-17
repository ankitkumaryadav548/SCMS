import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartCard = ({ title, type = 'line', data, options }) => {
  const renderChart = () => {
    switch (type.toLowerCase()) {
      case 'bar':
        return <Bar data={data} options={options} />;
      case 'pie':
        return <Pie data={data} options={options} />;
      case 'line':
      default:
        return <Line data={data} options={options} />;
    }
  };

  return (
    <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 shadow-lg flex flex-col justify-between h-[320px]">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <div className="flex-1 relative w-full h-full flex items-center justify-center">
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartCard;
