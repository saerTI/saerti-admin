import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRemuneracionById } from '../../services/CC/remuneracionesService';
import { Remuneracion } from '../../types/CC/remuneracion';


const REMUNERACION_STATUS_MAP: Record<string, { label: string; color: string }> = {
  'pendiente': { label: 'Pendiente', color: 'bg-yellow-200 text-yellow-800' },
  'pagada': { label: 'Pagada', color: 'bg-green-200 text-green-800' },
  'anulada': { label: 'Anulada', color: 'bg-gray-200 text-gray-800' }
};

export const RemuneracionesDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [remuneracion, setRemuneracion] = useState<Remuneracion | null>(null);

    useEffect(() => {
        const fetchRemuneracion = async () => {
            if (!id) {
                setError("ID de remuneración no proporcionado.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const remuneracionId = parseInt(id);
                if (isNaN(remuneracionId)) {
                    throw new Error("ID de remuneración inválido.");
                }
                const response = await getRemuneracionById(remuneracionId);
                if (!response) {
                    throw new Error("Remuneración no encontrada.");
                }
                console.log('Remuneración data:', response);
                setRemuneracion(response);
                setError(null);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error al cargar los datos de la remuneración.';
                setError(errorMessage);
                console.error('Error al cargar los datos de la remuneración:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRemuneracion();
    }, [id]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-CL').format(date);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    if (error || !remuneracion) {
        return (
            <div className="container px-4 py-6 mx-auto">
                <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
                    <p className="text-gray-700 dark:text-gray-300">{error || 'No se pudo cargar la remuneración'}</p>
                    <button
                        className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded"
                        onClick={() => navigate('/gastos/remuneraciones')}
                    >
                        Volver a Remuneraciones
                    </button>
                </div>
            </div>
        );
    }

    const status = REMUNERACION_STATUS_MAP[remuneracion.state] || REMUNERACION_STATUS_MAP['pendiente'];

    return (
        <div className="container px-4 py-6 mx-auto">
            <div className="max-w-6xl mx-auto">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Remuneración: {remuneracion.employeeName || 'Sin nombre'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Fecha: {formatDate(remuneracion.date)}
                        </p>
                    </div>
                    <div className="flex space-x-3 mt-4 md:mt-0">
                        <button
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                            onClick={() => navigate('/gastos/remuneraciones')}
                        >
                            Volver
                        </button>
                        <button
                            className="px-4 py-2 border border-brand-500 text-brand-500 rounded hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400"
                            onClick={() => navigate(`/gastos/remuneraciones/${id}/edit`)}
                        >
                            Editar Remuneración
                        </button>
                    </div>
                </div>

                {/* Status and details */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                            <div className="mt-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                                    {status.label}
                                </span>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Proyecto</p>
                            <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
                                {remuneracion.projectId ? (
                                    <button 
                                        onClick={() => navigate(`/cost-centers/${remuneracion.projectId}`)}
                                        className="text-brand-500 hover:text-brand-600"
                                    >
                                        {remuneracion.projectName || 'Sin proyecto'}
                                    </button>
                                ) : (
                                    'Sin proyecto'
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Período</p>
                            <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
                                {remuneracion.period}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Días Trabajados</p>
                            <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
                                {remuneracion.workDays}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Detailed information */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                Información del Empleado
                            </h2>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Nombre Completo</dt>
                                    <dd className="mt-1 text-gray-800 dark:text-white">{remuneracion.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">RUT</dt>
                                    <dd className="mt-1 text-gray-800 dark:text-white">
                                        {remuneracion.employeeRut || 'No especificado'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Cargo</dt>
                                    <dd className="mt-1 text-gray-800 dark:text-white">
                                        {remuneracion.employeePosition || 'No especificado'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Área</dt>
                                    <dd className="mt-1 text-gray-800 dark:text-white">
                                        {remuneracion.area || 'No especificado'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                Información de Pago
                            </h2>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Sueldo Líquido</dt>
                                    <dd className="mt-1 text-gray-800 dark:text-white">
                                        {remuneracion.sueldoLiquido ? formatCurrency(Number(remuneracion.sueldoLiquido)) : 'No especificado'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Anticipo</dt>
                                    <dd className="mt-1 text-gray-800 dark:text-white">
                                        {remuneracion.anticipo ? formatCurrency(Number(remuneracion.anticipo)) : '$0'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Monto Total</dt>
                                    <dd className="mt-1 text-gray-800 dark:text-white">
                                        {formatCurrency(Number(remuneracion.amount))}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Método de Pago</dt>
                                    <dd className="mt-1 text-gray-800 dark:text-white capitalize">
                                        {remuneracion.paymentMethod}
                                    </dd>
                                </div>
                                {remuneracion.paymentDate && (
                                    <div>
                                        <dt className="text-sm text-gray-500 dark:text-gray-400">Fecha de Pago</dt>
                                        <dd className="mt-1 text-gray-800 dark:text-white">
                                            {formatDate(remuneracion.paymentDate)}
                                        </dd>
                                    </div>
                                )}
                                {remuneracion.notes && (
                                    <div>
                                        <dt className="text-sm text-gray-500 dark:text-gray-400">Notas</dt>
                                        <dd className="mt-1 text-gray-800 dark:text-white whitespace-pre-wrap">
                                            {remuneracion.notes}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
                                    
};
