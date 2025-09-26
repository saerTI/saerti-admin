// src/pages/CashFlow/CashFlowChart.tsx - Versión mejorada usando tipos del backend
import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { formatCurrency } from '../../utils/formatters';
import { CashFlowChartData } from '../../services/cashFlowService';

interface CashFlowChartProps {
  data: CashFlowChartData[];
}

type ChartType = 'line' | 'bar' | 'area' | 'mixed' | 'forecast' | 'pie' | 'waterfall';

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<ChartType>('mixed');
  const [showForecast, setShowForecast] = useState(true);

  // Configuración base para todos los gráficos
  const baseOptions: ApexOptions = {
    chart: {
      fontFamily: 'Outfit, sans-serif',
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
      animations: {
        enabled: true,
        speed: 800,
      },
    },
    theme: {
      mode: 'light',
    },
    grid: {
      show: true,
      borderColor: '#f3f4f6',
      strokeDashArray: 3,
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    xaxis: {
      categories: data.map(item => item.name),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatCurrency(val),
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "center",
      fontFamily: "Outfit",
      fontSize: '14px',
      markers: {
        size: 12,
        strokeWidth: 3,
      },
    },
    colors: ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'],
  };

  // Función para generar series según el tipo de gráfico
  const getChartSeries = () => {
    switch (chartType) {
      case 'line':
        return [
          {
            name: 'Ingresos',
            data: data.map(item => item.income),
            type: 'line',
          },
          {
            name: 'Gastos',
            data: data.map(item => item.expense),
            type: 'line',
          },
          {
            name: 'Balance',
            data: data.map(item => item.balance),
            type: 'line',
          },
        ];

      case 'bar':
        return [
          {
            name: 'Ingresos',
            data: data.map(item => item.income),
          },
          {
            name: 'Gastos',
            data: data.map(item => item.expense),
          },
        ];

      case 'area':
        return [
          {
            name: 'Ingresos',
            data: data.map(item => item.income),
          },
          {
            name: 'Gastos',
            data: data.map(item => item.expense),
          },
          {
            name: 'Balance Neto',
            data: data.map(item => item.balance),
          },
        ];

      case 'mixed':
        return [
          {
            name: 'Ingresos',
            type: 'column',
            data: data.map(item => item.income),
          },
          {
            name: 'Gastos',
            type: 'column',
            data: data.map(item => item.expense),
          },
          {
            name: 'Balance',
            type: 'line',
            data: data.map(item => item.balance),
          },
        ];

      case 'forecast':
        const series = [
          {
            name: 'Ingresos Reales',
            type: 'column',
            data: data.map(item => item.actual_income || item.income),
          },
          {
            name: 'Gastos Reales',
            type: 'column',
            data: data.map(item => item.actual_expense || item.expense),
          },
        ];

        if (showForecast) {
          series.push({
            name: 'Ingresos Proyectados',
            type: 'line',
            data: data.map(item => item.forecast_income || 0),
          });
          series.push({
            name: 'Gastos Proyectados',
            type: 'line',
            data: data.map(item => item.forecast_expense || 0),
          });
        }

        return series;

      case 'waterfall':
        // Waterfall chart is handled by custom rendering
        return [];

      default:
        return [];
    }
  };

  // Configuraciones específicas por tipo de gráfico
  const getChartOptions = (): ApexOptions => {
    const options = { ...baseOptions };

    switch (chartType) {
      case 'bar':
        return {
          ...options,
          chart: {
            ...options.chart,
            type: 'bar',
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '55%',
              borderRadius: 4,
              borderRadiusApplication: 'end',
            },
          },
        };

      case 'area':
        return {
          ...options,
          chart: {
            ...options.chart,
            type: 'area',
          },
          fill: {
            type: 'gradient',
            gradient: {
              opacityFrom: 0.55,
              opacityTo: 0.3,
            },
          },
          stroke: {
            curve: 'smooth',
            width: 2,
          },
        };

      case 'mixed':
      case 'forecast':
        return {
          ...options,
          chart: {
            ...options.chart,
            type: 'line',
          },
          stroke: {
            width: [0, 0, 3],
            curve: 'smooth',
          },
          plotOptions: {
            bar: {
              columnWidth: '50%',
              borderRadius: 4,
            },
          },
        };

      case 'line':
        return {
          ...options,
          chart: {
            ...options.chart,
            type: 'line',
          },
          stroke: {
            curve: 'smooth',
            width: 3,
          },
          markers: {
            size: 5,
            hover: {
              size: 7,
            },
          },
        };

      case 'waterfall':
        // Waterfall chart is handled by custom rendering
        return options;

      default:
        return options;
    }
  };

  // Datos para gráfico de pie (categorías)
  const getPieData = () => {
    const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = data.reduce((sum, item) => sum + item.expense, 0);
    
    return {
      series: [totalIncome, totalExpense],
      options: {
        ...baseOptions,
        chart: {
          ...baseOptions.chart,
          type: 'pie' as const,
        },
        labels: ['Ingresos Totales', 'Gastos Totales'],
        colors: ['#10b981', '#ef4444'],
        plotOptions: {
          pie: {
            size: 100,
            donut: {
              size: '70%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Balance Neto',
                  formatter: () => formatCurrency(totalIncome - totalExpense),
                },
              },
            },
          },
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }],
      }
    };
  };

  // Calcular métricas para mostrar
  const metrics = {
    totalIncome: data.reduce((sum, item) => sum + item.income, 0),
    totalExpense: data.reduce((sum, item) => sum + item.expense, 0),
    avgIncome: data.length > 0 ? data.reduce((sum, item) => sum + item.income, 0) / data.length : 0,
    avgExpense: data.length > 0 ? data.reduce((sum, item) => sum + item.expense, 0) / data.length : 0,
    bestPeriod: data.reduce((best, current) => current.balance > best.balance ? current : best, data[0] || { name: '', balance: 0 }),
    worstPeriod: data.reduce((worst, current) => current.balance < worst.balance ? current : worst, data[0] || { name: '', balance: 0 }),
  };

  return (
    <div className="space-y-6">
      {/* Controles del gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Análisis Visual del Flujo de Caja
        </h4>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de tipo de gráfico */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[
              { key: 'mixed', label: 'Mixto', icon: '📊' },
              { key: 'line', label: 'Línea', icon: '📈' },
              { key: 'bar', label: 'Barras', icon: '📊' },
              { key: 'area', label: 'Área', icon: '🏔️' },
              { key: 'waterfall', label: 'Cascada', icon: '🌊' },
              { key: 'forecast', label: 'Proyección', icon: '🔮' },
              { key: 'pie', label: 'Circular', icon: '🥧' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  chartType === key
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
                onClick={() => setChartType(key as ChartType)}
              >
                <span className="hidden sm:inline">{icon} </span>
                {label}
              </button>
            ))}
          </div>
          
          {/* Toggle para mostrar proyección */}
          {chartType === 'forecast' && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showForecast}
                onChange={(e) => setShowForecast(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Mostrar proyección</span>
            </label>
          )}
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-center">
            <p className="text-sm text-green-600 dark:text-green-400">Ingresos Totales</p>
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">
              {formatCurrency(metrics.totalIncome)}
            </p>
            <p className="text-xs text-green-500 mt-1">
              Promedio: {formatCurrency(metrics.avgIncome)}
            </p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">Gastos Totales</p>
            <p className="text-lg font-semibold text-red-700 dark:text-red-300">
              {formatCurrency(metrics.totalExpense)}
            </p>
            <p className="text-xs text-red-500 mt-1">
              Promedio: {formatCurrency(metrics.avgExpense)}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <p className="text-sm text-blue-600 dark:text-blue-400">Mejor Período</p>
            <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              {metrics.bestPeriod?.name || 'N/A'}
            </p>
            <p className="text-xs text-blue-500 mt-1">
              {formatCurrency(metrics.bestPeriod?.balance || 0)}
            </p>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="text-center">
            <p className="text-sm text-orange-600 dark:text-orange-400">Período Crítico</p>
            <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
              {metrics.worstPeriod?.name || 'N/A'}
            </p>
            <p className="text-xs text-orange-500 mt-1">
              {formatCurrency(metrics.worstPeriod?.balance || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico principal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        {chartType === 'pie' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <Chart 
                options={getPieData().options}
                series={getPieData().series}
                type="donut"
                height={350}
              />
            </div>
            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Distribución Total
              </h5>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-800 dark:text-white/90">Ingresos</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(metrics.totalIncome)}</p>
                    <p className="text-xs text-green-500">
                      {metrics.totalIncome + metrics.totalExpense > 0 
                        ? Math.round((metrics.totalIncome / (metrics.totalIncome + metrics.totalExpense)) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-gray-800 dark:text-white/90">Gastos</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{formatCurrency(metrics.totalExpense)}</p>
                    <p className="text-xs text-red-500">
                      {metrics.totalIncome + metrics.totalExpense > 0 
                        ? Math.round((metrics.totalExpense / (metrics.totalIncome + metrics.totalExpense)) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 dark:text-white/90">Balance Neto</span>
                    <span className={`font-bold text-lg ${
                      metrics.totalIncome - metrics.totalExpense >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(metrics.totalIncome - metrics.totalExpense)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : chartType === 'waterfall' ? (
          // Custom waterfall chart rendering
          <div className="w-full">
            <div className="text-center text-lg font-semibold mb-6 text-gray-700 dark:text-gray-300">
              Balance Acumulado - Gráfico de Cascada
            </div>
            {/* Debug info */}
            <div className="text-xs text-gray-500 mb-4 text-center">
              Flujo neto acumulado - {data.length} períodos |
              {data.length > 0 && ` ${data[0].name}: Balance del período = ${formatCurrency(data[0].balance)}`}
            </div>
            <div className="relative h-80 border border-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
              {/* Chart container */}
              <div className="flex items-end justify-around h-full relative" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
                {/* Y-axis line at 0 - positioned within the chart area */}
                <div className="absolute left-0 w-full h-px bg-red-400 z-10" style={{ top: '50%' }}></div>
                <div className="absolute left-2 text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 rounded z-20" style={{ top: 'calc(50% - 10px)' }}>
                  $0
                </div>
                {data.length === 0 ? (
                  <div className="text-center text-gray-500 w-full">
                    No hay datos para mostrar
                  </div>
                ) : (
                  data.map((item, index) => {
                    // Calculate accumulated balance (net flow) up to this period
                    let accumulatedBalance = 0;
                    for (let i = 0; i <= index; i++) {
                      accumulatedBalance += data[i].balance;
                    }
                    const isPositive = accumulatedBalance >= 0;

                    // Calculate max absolute value for scaling
                    const allAccumulatedValues = data.map((_, i) => {
                      let acc = 0;
                      for (let j = 0; j <= i; j++) {
                        acc += data[j].balance;
                      }
                      return Math.abs(acc);
                    });

                    const maxAbsValue = Math.max(...allAccumulatedValues, 100000);
                    const heightRatio = Math.abs(accumulatedBalance) / maxAbsValue;
                    const height = Math.max(heightRatio * 100, 8); // Min height 8px, max 100px

                    console.log(`Period ${index}: ${item.name}, Period Balance: ${formatCurrency(item.balance)}, Accumulated Balance: ${formatCurrency(accumulatedBalance)}, Height: ${height}px, IsPositive: ${isPositive}`);

                    // Position relative to the zero line (50% from top of chart container)
                    const zeroLinePosition = 50; // 50% from top of chart container

                    // For positive values: bar grows upward, so top position = zero line - height
                    // For negative values: bar starts at zero line and grows downward
                    const barTop = isPositive
                      ? `calc(${zeroLinePosition}% - ${height}px)` // Exact positioning using calc()
                      : `${zeroLinePosition}%`; // Start exactly at zero line

                    return (
                      <div key={index} className="relative flex flex-col items-center min-w-[80px] h-full">
                        {/* Bar positioned relative to zero line */}
                        <div
                          className={`w-16 ${isPositive ? 'bg-green-500' : 'bg-red-500'} border border-gray-400 shadow-sm absolute`}
                          style={{
                            height: `${height}px`,
                            top: barTop,
                            left: '50%',
                            transform: 'translateX(-50%)',
                          }}
                          title={`${item.name}: ${formatCurrency(accumulatedBalance)}`}
                        />

                        {/* Value label */}
                        <div
                          className="text-xs text-gray-600 dark:text-gray-400 font-medium text-center absolute whitespace-nowrap"
                          style={{
                            top: isPositive
                              ? `calc(${zeroLinePosition}% - ${height + 20}px)` // Above the bar for positive values
                              : `calc(${zeroLinePosition}% + ${height + 5}px)`,  // Below the bar for negative values
                            left: '50%',
                            transform: 'translateX(-50%)',
                          }}
                        >
                          {formatCurrency(accumulatedBalance)}
                        </div>

                        {/* Period label at bottom */}
                        <div className="text-xs text-gray-600 dark:text-gray-400 text-center font-medium absolute bottom-2 left-1/2 transform -translate-x-1/2">
                          {item.name.length > 10 ? `${item.name.substring(0, 10)}...` : item.name}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-center space-x-6">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Balance Positivo</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Balance Negativo</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px]">
              <Chart
                options={getChartOptions()}
                series={getChartSeries()}
                type={chartType === 'mixed' || chartType === 'forecast' ? 'line' : chartType}
                height={400}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabla de datos detallada */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Datos del Período
          </h5>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gastos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Eficiencia
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((item, index) => {
                const efficiency = item.income > 0 ? (item.balance / item.income) * 100 : 0;
                
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      {formatCurrency(item.income)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                      {formatCurrency(item.expense)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                      item.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(item.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        efficiency >= 20 
                          ? 'bg-green-100 text-green-800' 
                          : efficiency >= 0 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {efficiency.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights automáticos */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h5 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Insights Automáticos
        </h5>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h6 className="font-medium text-blue-700 dark:text-blue-300">Tendencias Identificadas:</h6>
            <ul className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  Promedio de eficiencia: {
                    data.length > 0 
                      ? (data.reduce((sum, item) => sum + (item.income > 0 ? (item.balance / item.income) * 100 : 0), 0) / data.length).toFixed(1)
                      : 0
                  }%
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  Períodos rentables: {data.filter(item => item.balance > 0).length} de {data.length}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  Ratio promedio ingresos/gastos: {
                    metrics.totalExpense > 0 
                      ? (metrics.totalIncome / metrics.totalExpense).toFixed(2)
                      : '∞'
                  }:1
                </span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h6 className="font-medium text-blue-700 dark:text-blue-300">Recomendaciones:</h6>
            <ul className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
              {metrics.totalIncome - metrics.totalExpense < 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">⚠</span>
                  <span>Balance negativo detectado - revisar gastos</span>
                </li>
              )}
              {data.filter(item => item.balance < 0).length > data.length / 2 && (
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">⚠</span>
                  <span>Mayoría de períodos con pérdidas - plan de contingencia necesario</span>
                </li>
              )}
              {metrics.avgIncome > 0 && metrics.avgExpense / metrics.avgIncome > 0.8 && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">⚠</span>
                  <span>Margen de ganancia bajo - optimizar costos</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Continúar monitoreando tendencias de flujo de caja</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowChart;