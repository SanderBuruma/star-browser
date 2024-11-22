'use client';
import React from 'react';
import data from '../data.json';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function StatsGraphs() {
  // Process time distribution data
  const timeDistribution = React.useMemo(() => {
    const distribution = new Array(50).fill(0);
    
    data.stars.details.forEach(detail => {
      if (detail?.time_played) {
        const [hours] = detail.time_played.split(':').map(Number);
        if (hours < 50) {
          distribution[hours]++;
        }
      }
    });

    return {
      labels: Array.from({ length: 50 }, (_, i) => `${i}h`),
      datasets: [{
        label: 'Players',
        data: distribution,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    };
  }, []);

  // Process daily completions data
  const dailyCompletions = React.useMemo(() => {
    const completions: { [key: string]: number } = {};
    
    data.stars.creation_update.forEach(date => {
      if (date) {
        const dayStr = date.split('T')[0];
        completions[dayStr] = (completions[dayStr] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(completions).sort();
    
    return {
      labels: sortedDates,
      datasets: [{
        label: 'Completions',
        data: sortedDates.map(date => completions[date]),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.1
      }]
    };
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="p-4 space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Completion Time Distribution</h2>
        <div className="h-[400px] w-full">
          <Bar data={timeDistribution} options={options} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Daily Completions</h2>
        <div className="h-[400px] w-full">
          <Line data={dailyCompletions} options={options} />
        </div>
      </div>
    </div>
  );
} 