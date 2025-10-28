// src/components/Dashboard/BalanceAreaChart.tsx
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import type { CashFlowPeriod } from '../../types/dashboard';

interface BalanceAreaChartProps {
  incomeData: CashFlowPeriod[];
  expenseData: CashFlowPeriod[];
  loading?: boolean;
}

export default function BalanceAreaChart({ incomeData, expenseData, loading }: BalanceAreaChartProps) {
  const [chartOptions, setChartOptions] = useState<ApexOptions>({});
  const [chartSeries, setChartSeries] = useState<any[]>([]);

  useEffect(() => {
    if (!incomeData || !expenseData) return;

    // Crear un mapa combinado de períodos
    const periodMap = new Map<string, { income: number; expense: number }>();

    incomeData.forEach(item => {
      periodMap.set(item.period_label, {
        income: item.total_amount,
        expense: periodMap.get(item.period_label)?.expense || 0
      });
    });

    expenseData.forEach(item => {
      const existing = periodMap.get(item.period_label);
      periodMap.set(item.period_label, {
        income: existing?.income || 0,
        expense: item.total_amount
      });
    });

    // Ordenar períodos
    const sortedPeriods = Array.from(periodMap.keys()).sort();

    // Calcular balance (ingresos - egresos)
    const balanceData = sortedPeriods.map(period => {
      const data = periodMap.get(period);
      return (data?.income || 0) - (data?.expense || 0);
    });

    const options: ApexOptions = {
      chart: {
        type: 'area',
        height: 350,
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
        background: 'transparent',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100]
        }
      },
      xaxis: {
        categories: sortedPeriods,
        labels: {
          style: {
            fontSize: '11px'
          },
          rotate: -45,
          rotateAlways: sortedPeriods.length > 12
        }
      },
      yaxis: {
        title: {
          text: 'Balance (CLP)'
        },
        labels: {
          formatter: (val: number) => {
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
      tooltip: {
        theme: 'light',
        y: {
          formatter: (val: number) => {
            return new Intl.NumberFormat('es-CL', {
              style: 'currency',
              currency: 'CLP',
              minimumFractionDigits: 0
            }).format(val);
          },
          title: {
            formatter: () => 'Balance: '
          }
        }
      },
      colors: ['#10b981'],
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      title: {
        text: 'Evolución del Balance (Ingresos - Egresos)',
        align: 'left',
        style: {
          fontSize: '16px',
          fontWeight: 600,
          color: '#1f2937'
        }
      },
      annotations: {
        yaxis: [{
          y: 0,
          borderColor: '#ef4444',
          strokeDashArray: 4,
          label: {
            borderColor: '#ef4444',
            style: {
              color: '#fff',
              background: '#ef4444',
              fontSize: '10px'
            },
            text: 'Punto de equilibrio'
          }
        }]
      }
    };

    setChartOptions(options);
    setChartSeries([{
      name: 'Balance',
      data: balanceData
    }]);
  }, [incomeData, expenseData]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-[350px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!incomeData || !expenseData || incomeData.length === 0 || expenseData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <ReactApexChart
        options={chartOptions}
        series={chartSeries}
        type="area"
        height={350}
      />
    </div>
  );
}
