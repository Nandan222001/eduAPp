import { Chart as ChartJS, registerables } from 'chart.js';

export const inject3DChartStyles = () => {
  ChartJS.register(...registerables);
  
  // Apply "Pseudo-3D" depth to all bar/line elements globally
  if (ChartJS.defaults.elements.bar) {
    ChartJS.defaults.elements.bar.borderRadius = 8;
    ChartJS.defaults.elements.bar.borderWidth = 0;
  }
  if (ChartJS.defaults.elements.point) {
    ChartJS.defaults.elements.point.radius = 4;
    ChartJS.defaults.elements.point.hoverRadius = 6;
  }
  
  // Plugin to inject volumetric drop-shadow logic
  const shadowPlugin = {
    id: 'kinetic3DShadow',
    beforeDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      ctx.save();
      ctx.shadowColor = 'rgba(108, 92, 231, 0.35)'; // Stitch MCP Secondary token shadow
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 8;
    },
    afterDatasetsDraw: (chart: any) => {
      chart.ctx.restore();
    }
  };

  ChartJS.register(shadowPlugin);
  
  // Override typography to match Kinetic Scholar
  ChartJS.defaults.font.family = "'Inter', sans-serif";
  ChartJS.defaults.font.size = 13;
  ChartJS.defaults.color = "#888";
};
