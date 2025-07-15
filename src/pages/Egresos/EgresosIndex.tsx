import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gastosApiService, OrdenCompra, GastoFilter } from '../../services/gastosService';
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

// Type for summary card data
interface ExpenseSummary {
  title: string;
  amount: number;
  count: number;
  path: string;
  icon?: React.ReactNode;
}

// Type for period filter
type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'annual';

const GastosIndex = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>({
    totalGastos: 0,
    pendingGastos: 0,
    recentGastos: [],
    byCategoryData: []
  });
  const [expensesByDate, setExpensesByDate] = useState<FinancialCategory[]>([]);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [periodType, setPeriodType] = useState<PeriodType>('weekly');
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Expense categories with paths
  const expenseCategories: ExpenseSummary[] = [
    { title: 'Remuneraciones', amount: 0, count: 0, path: '/gastos/remuneraciones' },
    { title: 'Cotizaciones Previsionales', amount: 0, count: 0, path: '/gastos/previsionales' },
    { title: 'Alimentación y Hospedaje', amount: 0, count: 0, path: '/gastos/servicios-alimentacion-hospedaje' },
    { title: 'Leasing y Maquinaria', amount: 0, count: 0, path: '/gastos/leasing-pagos-maquinaria' },
    { title: 'Subcontratos Crédito', amount: 0, count: 0, path: '/gastos/subcontratos-credito' },
    { title: 'Subcontratos Contado', amount: 0, count: 0, path: '/gastos/subcontratos-contado' },
    { title: 'OC Crédito', amount: 0, count: 0, path: '/gastos/ordenes-compra' },
    { title: 'OC Contado', amount: 0, count: 0, path: '/gastos/oc-contado' },
    { title: 'Contratos Notariales', amount: 0, count: 0, path: '/gastos/contratos-notariales' },
    { title: 'Costos Fijos', amount: 0, count: 0, path: '/gastos/costos-fijos' },
    { title: 'Costos Variables', amount: 0, count: 0, path: '/gastos/costos-variables' },
    { title: 'Pago Rendiciones', amount: 0, count: 0, path: '/gastos/pago-rendiciones' },
    { title: 'Impuestos', amount: 0, count: 0, path: '/gastos/impuestos' },
    { title: 'Seguros y Pólizas', amount: 0, count: 0, path: '/gastos/seguros-polizas' },
    { title: 'Certificaciones', amount: 0, count: 0, path: '/gastos/certificaciones-capacitaciones' },
    { title: 'Estudios y Asesorías', amount: 0, count: 0, path: '/gastos/estudios-asesorias' },
    { title: 'Gastos Imprevistos', amount: 0, count: 0, path: '/gastos/imprevistos' },
  ];

  // Project filter options
  const projectOptions = [
    { value: 'all', label: 'Todos los Proyectos' },
    { value: 'proyecto-a', label: 'Proyecto A' },
    { value: 'proyecto-b', label: 'Proyecto B' },
    { value: 'proyecto-c', label: 'Proyecto C' },
    { value: 'proyecto-d', label: 'Proyecto D' },
  ];

  // Load expense stats
  useEffect(() => {
    const fetchExpenseStats = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would come from your API
        // For now, we'll generate some mock data
        const data = await getMockExpenseStats();
        setStats(data);
        
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
        
        // Get expenses by date data
        const dateData = await getMockExpensesByDate(periodData);
        setExpensesByDate(dateData);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas de gastos');
        console.error('Error fetching expense stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseStats();
  }, [periodType, yearFilter, projectFilter]);

  // Generate mock stats for now - replace with real API call in production
  const getMockExpenseStats = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Filter by project if not "all"
    if (projectFilter !== 'all') {
      console.log(`Filtering by project: ${projectFilter}`);
      // In a real app, you would filter your data here
    }
    
    // Generate random amounts for each category
    const categoriesWithData = expenseCategories.map(cat => ({
      ...cat,
      amount: Math.floor(Math.random() * 100000000) + 1000000,
      count: Math.floor(Math.random() * 50) + 1
    }));
    
    // Calculate total
    const total = categoriesWithData.reduce((sum, cat) => sum + cat.amount, 0);
    const pendingCount = Math.floor(Math.random() * 30) + 5;
    
    // Generate some recent expenses
    const recentExpenses = Array(5).fill(null).map((_, i) => {
      const category = categoriesWithData[Math.floor(Math.random() * categoriesWithData.length)];
      return {
        id: i + 1,
        name: `Gasto ${i + 1} - ${category.title}`,
        category: category.title,
        amount: Math.floor(Math.random() * 10000000) + 100000,
        date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        state: ['draft', 'pending', 'approved', 'paid', 'rejected'][Math.floor(Math.random() * 5)]
      };
    });
    
    return {
      totalGastos: total,
      pendingGastos: pendingCount,
      byCategoryData: categoriesWithData,
      recentGastos: recentExpenses
    };
  };

  // Generate mock expense data by date
  const getMockExpensesByDate = async (periodsList: FinancialPeriod[]): Promise<FinancialCategory[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate expense data for each category and period
    return expenseCategories.map(category => {
      const periodAmounts: Record<string, number> = {};
      
      // Add amount for each period
      periodsList.forEach(period => {
        // Generate a random amount or 0 (some cells might be empty)
        periodAmounts[period.id] = Math.random() > 0.2 
          ? Math.floor(Math.random() * 50000000) + 100000 
          : 0;
      });
      
      return {
        category: category.title,
        path: category.path,
        amounts: periodAmounts
      };
    });
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

  return (
    <div className="w-full px-4 py-6">
      <PageBreadcrumb pageTitle="Gestión de Gastos" titleSize="2xl" />

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Overview */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <ComponentCard title="Total de Gastos" className="bg-white dark:bg-gray-800 h-48">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-3xl font-bold text-brand-500">{formatCurrency(stats.totalGastos)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monto total registrado</p>
          </div>
        </ComponentCard>

        <ComponentCard title="Gastos Pendientes" className="bg-white dark:bg-gray-800 h-48">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-3xl font-bold text-yellow-500">{stats.pendingGastos}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Registros por procesar</p>
          </div>
        </ComponentCard>

        <ComponentCard title="Importar Gastos" className="bg-white dark:bg-gray-800 h-48">
          <FileInput 
            onChange={(event) => {
              if (event.target.files && event.target.files[0]) {
                handleFileUpload(event.target.files[0]);
              }
            }} 
          />
        </ComponentCard>
      </div>

      {/* Expenses by Date Section */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Gastos por Período</h2>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-6 mb-6 bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Filtros</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Label htmlFor="projectFilter">Proyecto</Label>
              <Select
                options={projectOptions}
                defaultValue={projectFilter}
                onChange={(value) => setProjectFilter(value)}
                placeholder="Seleccione proyecto"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Financial Table */}
      <FinancialTable 
        title="Histórico de Gastos"
        type="expense"
        periods={periods}
        data={expensesByDate}
        loading={loading}
        className="mb-6"
      />

      {/* Category Cards */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Categorías de Gastos</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
        {stats.byCategoryData.map((category: ExpenseSummary, index: number) => (
          <Link to={category.path} key={index}>
            <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-all dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">{category.title}</h3>
              <p className="text-2xl font-bold text-brand-500 mb-1">{formatCurrency(category.amount)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{category.count} registros</p>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Recent Expenses Table */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white my-6">Gastos Recientes</h2>
      <RecentFinancialTable 
        data={stats.recentGastos}
        loading={loading}
        type="expense"
      />
    </div>
  );
};

export default GastosIndex;