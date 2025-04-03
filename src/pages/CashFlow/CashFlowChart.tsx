// src/pages/CashFlow/CashFlowChart.tsx
import React, { useState } from 'react';
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { formatCurrency } from '../../utils/formatters';

interface CashFlowChartProps {
  data: Array<{
    name: string;
    income: number;
    expense: number;
    balance: number;
  }>;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  
  // Base options for both chart types
  const baseOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 350,
      toolbar: {
        show: false,
      },
    },
    colors: ["#465FFF", "#EF4444", "#10B981"], // Blue for income, Red for expense, Green for balance
    stroke: {
      width: chartType === 'area' ? 2 : 0,
      curve: 'smooth',
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    fill: {
      type: chartType === 'area' ? 'gradient' : 'solid',
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
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
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
  };
  
  // Bar chart specific options
  const barOptions: ApexOptions = {
    ...baseOptions,
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
  };
  
  // Prepare data for ApexCharts
  const series = [
    {
      name: 'Ingresos',
      data: data.map(item => item.income),
    },
    {
      name: 'Gastos',
      data: data.map(item => item.expense),
    },
    {
      name: 'Balance',
      data: data.map(item => item.balance),
    },
  ];
  
  // Calculate totals
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = data.reduce((sum, item) => sum + item.expense, 0);
  const totalBalance = totalIncome - totalExpense;
  
  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Gráfico de Flujo de Caja
        </h4>
        
        <div className="inline-flex items-center rounded-md border border-stroke p-1.5 dark:border-strokedark">
          <button
            className={`rounded px-3 py-1 text-sm font-medium ${
              chartType === 'area'
                ? 'bg-primary text-white'
                : 'text-black dark:text-white'
            }`}
            onClick={() => setChartType('area')}
          >
            Línea
          </button>
          <button
            className={`rounded px-3 py-1 text-sm font-medium ${
              chartType === 'bar'
                ? 'bg-primary text-white'
                : 'text-black dark:text-white'
            }`}
            onClick={() => setChartType('bar')}
          >
            Barras
          </button>
        </div>
      </div>
      
      {/* Chart */}
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[1000px]">
            <Chart 
              options={chartType === 'bar' ? barOptions : baseOptions} 
              series={series} 
              type={chartType} 
              height={350} 
            />
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="16"
              viewBox="0 0 22 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 15.1156C4.19376 15.1156 0.825012 8.61876 0.687512 8.34376C0.584387 8.13751 0.584387 7.86251 0.687512 7.65626C0.825012 7.38126 4.19376 0.918762 11 0.918762C17.8063 0.918762 21.175 7.38126 21.3125 7.65626C21.4156 7.86251 21.4156 8.13751 21.3125 8.34376C21.175 8.61876 17.8063 15.1156 11 15.1156ZM2.26876 8.00001C3.02501 9.27189 5.98126 13.5688 11 13.5688C16.0188 13.5688 18.975 9.27189 19.7313 8.00001C18.975 6.72814 16.0188 2.43126 11 2.43126C5.98126 2.43126 3.02501 6.72814 2.26876 8.00001Z"
                fill=""
              />
              <path
                d="M11 10.9219C9.38438 10.9219 8.07812 9.61562 8.07812 8C8.07812 6.38438 9.38438 5.07812 11 5.07812C12.6156 5.07812 13.9219 6.38438 13.9219 8C13.9219 9.61562 12.6156 10.9219 11 10.9219ZM11 6.625C10.2437 6.625 9.625 7.24375 9.625 8C9.625 8.75625 10.2437 9.375 11 9.375C11.7563 9.375 12.375 8.75625 12.375 8C12.375 7.24375 11.7563 6.625 11 6.625Z"
                fill=""
              />
            </svg>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Ingresos Totales
            </h4>
            <h3 className="mt-1 text-xl font-bold text-black dark:text-white">
              {formatCurrency(totalIncome)}
            </h3>
          </div>
        </div>
        
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="20"
              height="22"
              viewBox="0 0 20 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.0203 17.8206C18.8892 17.6273 18.7014 17.486 18.486 17.4219C18.2706 17.3578 18.0426 17.3766 17.8406 17.4736L15.9006 18.3031C15.4061 17.0191 14.401 15.9765 13.1069 15.3955C11.8129 14.8146 10.3222 14.7392 8.9756 15.1853C7.629 15.6315 6.50234 16.5617 5.82689 17.784C5.15144 19.0063 4.9916 20.4326 5.3756 21.7736C5.40126 21.8822 5.45142 21.9842 5.52218 22.0719C5.59294 22.1597 5.6824 22.2311 5.78481 22.2809C5.88723 22.3306 6.00014 22.3577 6.1152 22.3599C6.23025 22.3622 6.34412 22.3396 6.4486 22.294C6.55307 22.2484 6.64519 22.1808 6.7194 22.0962C6.79361 22.0115 6.8491 21.9119 6.88139 21.8046C6.91368 21.6973 6.92201 21.5848 6.90576 21.4742C6.88951 21.3635 6.84901 21.2577 6.7866 21.1646C6.5256 20.2246 6.61924 19.2127 7.05365 18.3398C7.48805 17.467 8.23225 16.7911 9.13723 16.4432C10.0422 16.0953 11.0425 16.1005 11.9442 16.4577C12.846 16.8149 13.5838 17.4989 14.0096 18.3771L12.1656 19.1796C11.9662 19.2776 11.8097 19.4556 11.7343 19.6718C11.6588 19.888 11.6707 20.1252 11.7671 20.3326C11.8635 20.54 12.0349 20.7016 12.2468 20.7834C12.4587 20.8652 12.6958 20.8599 12.9036 20.7686L18.5511 18.2856C18.7464 18.1893 18.9039 18.0195 18.9938 17.809C19.0836 17.5985 19.1002 17.3612 19.0406 17.1386L19.0203 17.8206Z"
                fill=""
              />
              <path
                d="M16.0391 2.52637C15.5098 1.52002 14.6953 0.707393 13.7085 0.206201C12.7217 -0.294991 11.6134 -0.362115 10.5814 0.0163682C9.54929 0.394852 8.65228 1.1898 8.04947 2.25961C7.44666 3.32943 7.17499 4.6001 7.28907 5.86719V6.60156C7.28907 6.82765 7.37914 7.04443 7.53979 7.20508C7.70044 7.36573 7.91721 7.4558 8.14329 7.4558C8.36937 7.4558 8.58615 7.36573 8.7468 7.20508C8.90745 7.04443 8.99751 6.82765 8.99751 6.60156V5.86719C8.81798 4.86549 9.01751 3.83312 9.55976 2.97191C10.102 2.11071 10.9412 1.48452 11.9223 1.22947C12.9034 0.974422 13.9485 1.10865 14.8384 1.60646C15.7283 2.10428 16.3933 2.92843 16.7016 3.89941C16.7536 4.05162 16.8324 4.19358 16.9344 4.31703C17.0363 4.44048 17.16 4.54327 17.2983 4.61994C17.4365 4.69661 17.5867 4.74602 17.7425 4.7657C17.8983 4.78538 18.0564 4.77496 18.2079 4.73497C18.3594 4.69499 18.501 4.62628 18.6244 4.53263C18.7477 4.43897 18.8505 4.32266 18.9271 4.18996C19.0038 4.05726 19.0532 3.91079 19.0729 3.75839C19.0926 3.60599 19.0821 3.4514 19.0421 3.30346C18.7297 2.276 18.1459 1.35791 17.3526 0.648084C16.5594 -0.0617432 15.5874 -0.53715 14.5513 -0.718756C13.5151 -0.900362 12.4544 -0.779624 11.4917 -0.371338C10.5291 0.0369486 9.70387 0.721586 9.12517 1.59854C8.54647 2.47549 8.24073 3.50541 8.25001 4.55859C7.12261 4.72128 6.1 5.27544 5.37438 6.10988C4.64877 6.94431 4.26825 8.00548 4.30001 9.09375C4.30001 9.31983 4.39007 9.5366 4.55072 9.69726C4.71137 9.85791 4.92815 9.94797 5.15423 9.94797C5.38031 9.94797 5.59709 9.85791 5.75774 9.69726C5.91839 9.5366 6.00845 9.31983 6.00845 9.09375C6.00845 8.37949 6.29278 7.69453 6.79509 7.19222C7.2974 6.68991 7.98235 6.40559 8.69662 6.40559H15.3016C16.0158 6.40559 16.7008 6.68991 17.2031 7.19222C17.7054 7.69453 17.9897 8.37949 17.9897 9.09375V18.3359C17.9897 18.562 18.0798 18.7788 18.2404 18.9394C18.401 19.1001 18.6178 19.1901 18.8439 19.1901C19.07 19.1901 19.2867 19.1001 19.4474 18.9394C19.608 18.7788 19.6981 18.562 19.6981 18.3359V9.09375C19.7175 7.94179 19.3275 6.82284 18.5995 5.93832C17.8715 5.05379 16.8543 4.46169 15.7345 4.26329C15.9219 3.71322 16.0266 3.1267 16.0391 2.52637Z"
                fill=""
              />
            </svg>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Gastos Totales
            </h4>
            <h3 className="mt-1 text-xl font-bold text-black dark:text-white">
              {formatCurrency(totalExpense)}
            </h3>
          </div>
        </div>
        
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.1063 18.0469L19.3875 3.23126C19.2157 1.71876 17.9438 0.584381 16.3969 0.584381H5.56878C4.05628 0.584381 2.78441 1.71876 2.57816 3.23126L0.859406 18.0469C0.756281 18.9063 1.03128 19.7313 1.61566 20.3844C2.20003 21.0375 2.99066 21.3813 3.85003 21.3813H18.1157C18.975 21.3813 19.8 21.0031 20.35 20.3844C20.9 19.7656 21.2094 18.9063 21.1063 18.0469ZM19.2157 19.3531C18.9407 19.6625 18.5625 19.8344 18.15 19.8344H3.85003C3.43753 19.8344 3.05941 19.6625 2.78441 19.3531C2.50941 19.0438 2.37191 18.6313 2.44066 18.2188L4.12503 3.43751C4.19378 2.71563 4.81253 2.16563 5.56878 2.16563H16.4313C17.1532 2.16563 17.7719 2.71563 17.875 3.43751L19.5938 18.2531C19.6282 18.6656 19.4907 19.0438 19.2157 19.3531Z"
                fill=""
              />
              <path
                d="M14.3345 5.29375C13.922 5.39688 13.647 5.80938 13.7501 6.22188C13.7845 6.42813 13.8189 6.63438 13.8189 6.80625C13.8189 8.35313 12.547 9.625 11.0001 9.625C9.45327 9.625 8.1814 8.35313 8.1814 6.80625C8.1814 6.6 8.21577 6.42813 8.25015 6.22188C8.35327 5.80938 8.07827 5.39688 7.66577 5.29375C7.25327 5.19063 6.84077 5.46563 6.73765 5.87813C6.6689 6.1875 6.63452 6.49688 6.63452 6.80625C6.63452 9.2125 8.5939 11.1719 11.0001 11.1719C13.4064 11.1719 15.3658 9.2125 15.3658 6.80625C15.3658 6.49688 15.3314 6.1875 15.2626 5.87813C15.1595 5.46563 14.747 5.225 14.3345 5.29375Z"
                fill=""
              />
            </svg>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Balance Neto
            </h4>
            <h3 className={`mt-1 text-xl font-bold ${totalBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(totalBalance)}
            </h3>
          </div>
        </div>
      </div>
      
      {/* Trend Analysis */}
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
          Análisis de Tendencias
        </h4>
        
        <div className="flex flex-col">
          <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4">
            <div className="p-2.5 text-sm font-medium text-black dark:text-white xl:p-5">
              Periodo
            </div>
            <div className="p-2.5 text-sm font-medium text-black dark:text-white xl:p-5">
              Ingresos vs Gastos
            </div>
            <div className="p-2.5 text-sm font-medium text-black dark:text-white xl:p-5">
              Balance
            </div>
          </div>
          
          {data.map((item, index) => (
            <div 
              key={index}
              className="grid grid-cols-3 border-b border-stroke dark:border-strokedark"
            >
              <div className="flex items-center p-2.5 xl:p-5">
                <p className="text-black dark:text-white">{item.name}</p>
              </div>
              
              <div className="flex items-center p-2.5 xl:p-5">
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden dark:bg-gray-700">
                  <div 
                    className="bg-primary h-full" 
                    style={{ 
                      width: `${(item.income / (item.income + item.expense)) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="ml-2 text-xs">
                  {formatCurrency(item.income)} / {formatCurrency(item.expense)}
                </span>
              </div>
              
              <div className="flex items-center p-2.5 xl:p-5">
                <span
                  className={
                    item.balance >= 0 ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {formatCurrency(item.balance)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CashFlowChart;