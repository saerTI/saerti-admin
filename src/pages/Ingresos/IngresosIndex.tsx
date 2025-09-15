import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ingresosApiService from '../../services/ingresosService';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import { formatCurrency } from '../../utils/formatters';
import Select from '../../components/form/Select';
import Label from '../../components/form/Label';
import FinancialTable, { 
  FinancialCategory, 
  FinancialPeriod, 
  generateWeekPeriods,
  generateMonthPeriods,
  generateQuarterPeriods
} from '../../components/tables/FinancialTable';
import FileInput from '../../components/form/input/FileInput';
import RecentFinancialTable from '../../components/tables/RecentFinantialTable';
import IngresosRecentTable from '../../components/tables/IngresosRecentTable';
import IngresosFullTable from '../../components/tables/IngresosFullTable';

// Type for summary card data
interface IncomeSummary {
  title: string;
  amount: number;
  count: number;
  path: string;
  icon?: React.ReactNode;
}

// Type for period filter
type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'annual';

const IngresosIndex = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingFinancialTable, setLoadingFinancialTable] = useState(false);
  const [stats, setStats] = useState<any>({
    totalIngresos: 0,
    pendingIngresos: 0,
    recentIngresos: [],
    byCategoryData: []
  });
  const [incomeByDate, setIncomeByDate] = useState<FinancialCategory[]>([]);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [periodType, setPeriodType] = useState<PeriodType>('weekly');
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [refreshTableKey, setRefreshTableKey] = useState(0);

  // Income categories with paths
  const incomeCategories: IncomeSummary[] = [
    { title: 'Pagos de Clientes', amount: 0, count: 0, path: '/ingresos/categoria/pagos-clientes' },
    { title: 'Anticipos', amount: 0, count: 0, path: '/ingresos/categoria/anticipos' },
    { title: 'Estados de Pago', amount: 0, count: 0, path: '/ingresos/categoria/estados-pago' },
    { title: 'Venta de Activos', amount: 0, count: 0, path: '/ingresos/categoria/venta-activos' },
    { title: 'Devoluciones', amount: 0, count: 0, path: '/ingresos/categoria/devoluciones' },
    { title: 'Subsidios', amount: 0, count: 0, path: '/ingresos/categoria/subsidios' },
    { title: 'Retorno de Inversiones', amount: 0, count: 0, path: '/ingresos/categoria/retorno-inversiones' },
    { title: 'Otros Ingresos', amount: 0, count: 0, path: '/ingresos/categoria/otros' },
  ];

  // Period type options
  const periodTypeOptions = [
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'annual', label: 'Anual' }
  ];

  // Year filter options (last 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array(5).fill(0).map((_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString()
  }));
  
  // Project filter options
  const projectOptions = [
    { value: 'all', label: 'Todos los Centros de Costos' },
    { value: 'proyecto-a', label: 'Proyecto A' },
    { value: 'proyecto-b', label: 'Proyecto B' },
    { value: 'proyecto-c', label: 'Proyecto C' },
    { value: 'proyecto-d', label: 'Proyecto D' },
  ];

  // Function to get statistics for each category
  const getCategoryStatistics = async () => {
    try {
      setLoadingCategories(true);
      
      // Map category names to IDs (these would come from the backend in a real scenario)
      const categoryMap = {
        'Pagos de Clientes': 1,
        'Anticipos': 2,
        'Estados de Pago': 3,
        'Venta de Activos': 4,
        'Devoluciones': 5,
        'Subsidios': 6,
        'Retorno de Inversiones': 7,
        'Otros Ingresos': 8
      };

      // Get statistics for each category
      const categoryPromises = incomeCategories.map(async (category) => {
        try {
          const categoryId = categoryMap[category.title as keyof typeof categoryMap];
          
          // Get ingresos for this specific category
          const categoryResponse = await ingresosApiService.getIngresos({
            categoryId: categoryId,
            limit: 1000, // Get all records for this category
            ...(projectFilter !== 'all' && { costCenterId: parseInt(projectFilter) })
          });

          const categoryIngresos = categoryResponse.data || [];
          const totalAmount = categoryIngresos.reduce((sum, ingreso) => sum + ingreso.total_amount, 0);
          const count = categoryIngresos.length;

          return {
            ...category,
            amount: totalAmount,
            count: count
          };
        } catch (error) {
          console.warn(`Error fetching category ${category.title}:`, error);
          // Return category with zero values if there's an error
          return {
            ...category,
            amount: 0,
            count: 0
          };
        }
      });

      const results = await Promise.all(categoryPromises);
      return results;
    } catch (error) {
      console.error('Error fetching category statistics:', error);
      // Return categories with zero values as fallback
      return incomeCategories.map(cat => ({
        ...cat,
        amount: 0,
        count: 0
      }));
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load income stats with real data
  useEffect(() => {
    const fetchIncomeStats = async () => {
      try {
        setLoading(true);
        
        // Get real income statistics
        const statsResponse = await ingresosApiService.getIngresoStats({
          // Add filters if needed based on selected project
          ...(projectFilter !== 'all' && { costCenterId: parseInt(projectFilter) })
        });
        
        // Get real data for categories by getting all ingresos and grouping by category
        const categoryStats = await getCategoryStatistics();
        
        // Calculate totals from real data
        const totalIngresos = categoryStats.reduce((sum, cat) => sum + cat.amount, 0);
        const pendingIngresos = statsResponse.data?.borrador || 0;
        
        setStats({
          totalIngresos,
          pendingIngresos,
          byCategoryData: categoryStats,
          recentIngresos: [] // Will be handled by IngresosRecentTable component
        });
        
        // Get periods based on selected period type
        let periodData: FinancialPeriod[] = [];
        const selectedYear = parseInt(yearFilter);
        
        if (periodType === 'weekly') {
          periodData = generateWeekPeriods(selectedYear);
        } else if (periodType === 'monthly') {
          periodData = generateMonthPeriods(selectedYear);
        } else if (periodType === 'quarterly') {
          periodData = generateQuarterPeriods(selectedYear);
        } else if (periodType === 'annual') {
          // Show last 5 years
          periodData = Array(5).fill(0).map((_, i) => ({
            id: `year-${selectedYear - 4 + i}`,
            label: (selectedYear - 4 + i).toString()
          }));
        }
        
        setPeriods(periodData);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas de ingresos');
        console.error('Error fetching income stats:', err);
      } finally {
        setLoadingFinancialTable(false);
        setLoading(false);
      }
    };

    fetchIncomeStats();
  }, [periodType, yearFilter, projectFilter]);

  // Trigger table refresh when project filter changes
  useEffect(() => {
    setRefreshTableKey(prev => prev + 1);
  }, [projectFilter]);

  // Reload financial table when period-related filters change
  useEffect(() => {
    const reloadFinancialData = async () => {
      if (periods.length > 0) {
        setLoadingFinancialTable(true);
        try {
          const dateData = await getIncomeByDateReal(periods);
          setIncomeByDate(dateData);
        } catch (error) {
          console.error('Error reloading financial data:', error);
          // Set empty data on error
          setIncomeByDate([]);
        } finally {
          setLoadingFinancialTable(false);
        }
      }
    };

    // Only reload if we're not in the initial loading state and have periods
    if (!loading && periods.length > 0) {
      reloadFinancialData();
    }
  }, [periods, projectFilter, loading]); // Removed periodType and yearFilter since they affect periods

  // Get real income data by date and category
  const getIncomeByDateReal = async (periodsList: FinancialPeriod[]): Promise<FinancialCategory[]> => {
    try {
      console.log('🔄 Loading financial table data for periods:', periodsList.length);
      
      // Map category names to IDs
      const categoryMap = {
        'Pagos de Clientes': 1,
        'Anticipos': 2,
        'Estados de Pago': 3,
        'Venta de Activos': 4,
        'Devoluciones': 5,
        'Subsidios': 6,
        'Retorno de Inversiones': 7,
        'Otros Ingresos': 8
      };

      // Get date ranges for each period
      const periodRanges = getPeriodDateRanges(periodsList, periodType, parseInt(yearFilter));

      // Generate data for each category
      const categoryPromises = incomeCategories.map(async (category) => {
        const categoryId = categoryMap[category.title as keyof typeof categoryMap];
        const periodAmounts: Record<string, number> = {};

        // Get data for each period
        for (const period of periodsList) {
          const dateRange = periodRanges[period.id];
          if (dateRange) {
            try {
              // Get ingresos for this category and period
              const response = await ingresosApiService.getIngresos({
                categoryId: categoryId,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                limit: 1000,
                ...(projectFilter !== 'all' && { costCenterId: parseInt(projectFilter) })
              });

              // Sum all amounts for this period
              const totalAmount = response.data?.reduce((sum, ingreso) => sum + ingreso.total_amount, 0) || 0;
              periodAmounts[period.id] = totalAmount;
            } catch (error) {
              console.warn(`Error fetching data for ${category.title} - ${period.label}:`, error);
              periodAmounts[period.id] = 0;
            }
          } else {
            periodAmounts[period.id] = 0;
          }
        }

        return {
          category: category.title,
          path: category.path,
          amounts: periodAmounts
        };
      });

      const results = await Promise.all(categoryPromises);
      console.log('✅ Financial table data loaded successfully');
      return results;
    } catch (error) {
      console.error('Error fetching real income by date:', error);
      // Return empty data as fallback
      return incomeCategories.map(category => ({
        category: category.title,
        path: category.path,
        amounts: periodsList.reduce((acc, period) => {
          acc[period.id] = 0;
          return acc;
        }, {} as Record<string, number>)
      }));
    }
  };

  // Helper function to get date ranges for periods
  const getPeriodDateRanges = (periodsList: FinancialPeriod[], type: PeriodType, year: number): Record<string, { startDate: string; endDate: string }> => {
    const ranges: Record<string, { startDate: string; endDate: string }> = {};

    periodsList.forEach(period => {
      switch (type) {
        case 'weekly':
          // For weekly periods, extract week number from period.id
          const weekMatch = period.id.match(/week-(\d+)/);
          if (weekMatch) {
            const weekNum = parseInt(weekMatch[1]);
            const startDate = getWeekStartDate(year, weekNum);
            const endDate = getWeekEndDate(year, weekNum);
            ranges[period.id] = {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0]
            };
          }
          break;

        case 'monthly':
          // For monthly periods, extract month from period.id
          const monthMatch = period.id.match(/month-(\d+)/);
          if (monthMatch) {
            const month = parseInt(monthMatch[1]);
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of the month
            ranges[period.id] = {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0]
            };
          }
          break;

        case 'quarterly':
          // For quarterly periods, extract quarter from period.id
          const quarterMatch = period.id.match(/quarter-(\d+)/);
          if (quarterMatch) {
            const quarter = parseInt(quarterMatch[1]);
            const startMonth = (quarter - 1) * 3;
            const startDate = new Date(year, startMonth, 1);
            const endDate = new Date(year, startMonth + 3, 0); // Last day of the quarter
            ranges[period.id] = {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0]
            };
          }
          break;

        case 'annual':
          // For annual periods, extract year from period.id
          const yearMatch = period.id.match(/year-(\d+)/);
          if (yearMatch) {
            const periodYear = parseInt(yearMatch[1]);
            const startDate = new Date(periodYear, 0, 1);
            const endDate = new Date(periodYear, 11, 31);
            ranges[period.id] = {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0]
            };
          }
          break;
      }
    });

    return ranges;
  };

  // Helper functions for week calculations
  const getWeekStartDate = (year: number, week: number): Date => {
    const firstDayOfYear = new Date(year, 0, 1);
    const firstMonday = new Date(firstDayOfYear);
    const dayOfWeek = firstDayOfYear.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    firstMonday.setDate(firstDayOfYear.getDate() + daysToMonday);
    
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
    return weekStart;
  };

  const getWeekEndDate = (year: number, week: number): Date => {
    const weekStart = getWeekStartDate(year, week);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  };

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // Simulate file processing - in a real application, you'd make an API call here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Complete upload
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      
      // Reset after a delay
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 1500);
      
      // In a real application, you'd handle the response here
      console.log('File processed:', file);
      
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadStatus('error');
      
      // Reset after a delay
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 1500);
    }
  };

  return (
    <div className="w-full px-4 py-6">
      <PageBreadcrumb pageTitle="Gestión de Ingresos" />



      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Overview */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <ComponentCard title="Total de Ingresos" className="bg-white dark:bg-gray-800">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-3xl font-bold text-green-500">{formatCurrency(stats.totalIngresos)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monto total registrado</p>
          </div>
        </ComponentCard>

        <ComponentCard title="Ingresos Pendientes" className="bg-white dark:bg-gray-800 h-48">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-3xl font-bold text-yellow-500">{stats.pendingIngresos}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Registros por procesar</p>
          </div>
        </ComponentCard>

        <ComponentCard title="Importar Ingresos" className="bg-white dark:bg-gray-800 h-48">
          <FileInput 
              onChange={(event) => {
                if (event.target.files && event.target.files[0]) {
                  handleFileUpload(event.target.files[0]);
                }
              }} 
            />
        </ComponentCard>
      </div>

      {/* Income by Date Section */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Ingresos por Período</h2>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-6 mb-6 bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="periodType">Tipo de Período</Label>
              <Select
                options={periodTypeOptions}
                defaultValue={periodType}
                onChange={(value) => setPeriodType(value as PeriodType)}
                placeholder="Seleccione tipo de período"
              />
            </div>
            
            <div>
              <Label htmlFor="yearFilter">Año</Label>
              <Select
                options={yearOptions}
                defaultValue={yearFilter}
                onChange={(value) => setYearFilter(value)}
                placeholder="Seleccione año"
              />
            </div>
            
            <div>
              <Label htmlFor="projectFilter">Centro de Costo</Label>
              <Select
                options={projectOptions}
                defaultValue={projectFilter}
                onChange={(value) => setProjectFilter(value)}
                placeholder="Seleccione centro de costo"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Financial Table */}
      <FinancialTable 
        title="Histórico de Ingresos"
        type="income"
        periods={periods}
        data={incomeByDate}
        loading={loadingFinancialTable}
        className="mb-6"
      />

      {/* Category Cards */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Categorías de Ingresos</h2>
      {loadingCategories ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
          {Array(8).fill(0).map((_, index) => (
            <div key={index} className="bg-white p-5 rounded-lg shadow dark:bg-gray-800 border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
          {stats.byCategoryData.map((category: IncomeSummary, index: number) => (
            <Link to={category.path} key={index}>
              <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-all dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <h3 className="font-medium text-gray-800 dark:text-white mb-2">{category.title}</h3>
                <p className="text-2xl font-bold text-green-500 mb-1">{formatCurrency(category.amount)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{category.count} registros</p>
                {category.amount === 0 && category.count === 0 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Sin datos disponibles</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    

      
      {/* Full Incomes Table with Pagination */}
      <div className="mt-8">
        <IngresosFullTable 
          key={refreshTableKey}
          showTitle={true}
          pageSize={10}
          showFilters={true}
          initialFilters={{
            ...(projectFilter !== 'all' && { costCenterId: parseInt(projectFilter) })
          }}
        />
      </div>
    </div>
  );
};

export default IngresosIndex;