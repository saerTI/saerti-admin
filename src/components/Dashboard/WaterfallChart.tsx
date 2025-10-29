// src/components/Dashboard/WaterfallChart.tsx
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { formatCurrency } from '../../utils/dashboardHelpers';

interface WaterfallChartProps {
  periods: Array<{ display: string; backend: string }>;
  balanceData: number[]; // Array de balances por período
  title?: string;
}

export default function WaterfallChart({ periods, balanceData, title = 'Balance por Período' }: WaterfallChartProps) {
  const [chartOptions, setChartOptions] = useState<ApexOptions>({});
  const [chartSeries, setChartSeries] = useState<any[]>([]);

  useEffect(() => {
    // Preparar datos para el gráfico de cascada
    // Necesitamos calcular el acumulado y las diferencias
    const categories = periods.map(p => p.display);
    const data: number[] = [];
    const colors: string[] = [];

    let accumulated = 0;

    balanceData.forEach((balance, index) => {
      if (index === 0) {
        // Primera barra muestra el balance inicial
        data.push(balance);
        accumulated = balance;
      } else {
        // Las siguientes barras muestran el incremento/decremento
        data.push(balance);
        accumulated += balance;
      }

      // Color verde si es positivo, rojo si es negativo
      colors.push(balance >= 0 ? '#10b981' : '#ef4444');
    });

    const options: ApexOptions = {
      chart: {
        type: 'bar',
        height: 400,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '70%',
          colors: {
            ranges: [{
              from: -Infinity,
              to: 0,
              color: '#ef4444'
            }, {
              from: 0,
              to: Infinity,
              color: '#10b981'
            }]
          },
          dataLabels: {
            position: 'top'
          }
        }
      },
      colors: ['#10b981'],
      dataLabels: {
        enabled: true,
        formatter: function (val: any) {
          return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
            notation: 'compact',
            compactDisplay: 'short'
          }).format(val);
        },
        offsetY: -25,
        style: {
          fontSize: '11px',
          colors: ['#374151']
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            fontSize: '11px'
          },
          rotate: -90,
          rotateAlways: true,
          offsetY: 0,
          offsetX: 0
        }
      },
      yaxis: {
        title: {
          text: 'Balance'
        },
        labels: {
          formatter: function (val: number) {
            return new Intl.NumberFormat('es-CL', {
              style: 'currency',
              currency: 'CLP',
              minimumFractionDigits: 0,
              notation: 'compact',
              compactDisplay: 'short'
            }).format(val);
          }
        }
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        },
        xaxis: {
          lines: {
            show: false
          }
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: function (val: number) {
            return formatCurrency(val);
          },
          title: {
            formatter: () => 'Balance: '
          }
        }
      },
      legend: {
        show: false
      },
      title: {
        text: title,
        align: 'left',
        style: {
          fontSize: '16px',
          fontWeight: 600,
          color: '#1f2937'
        }
      }
    };

    setChartOptions(options);
    setChartSeries([{
      name: 'Balance',
      data: data
    }]);
  }, [periods, balanceData, title]);

  if (balanceData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No hay datos disponibles para mostrar el gráfico
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <ReactApexChart
        options={chartOptions}
        series={chartSeries}
        type="bar"
        height={400}
      />

      {/* Resumen de balance */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Balance Promedio</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(balanceData.reduce((sum, val) => sum + val, 0) / balanceData.length)}
          </p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">Mejor Balance</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(Math.max(...balanceData))}
          </p>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 mb-1">Peor Balance</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300">
            {formatCurrency(Math.min(...balanceData))}
          </p>
        </div>
      </div>
    </div>
  );
}
