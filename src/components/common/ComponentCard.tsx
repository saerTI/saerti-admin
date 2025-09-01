interface ComponentCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  titleCenter?: boolean;
  centerContent?: boolean;
  compact?: boolean; // Nueva prop para diseño compacto
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  titleCenter = true,
  centerContent = true,
  compact = false, // Por defecto false para mantener compatibilidad
}) => {
  // Check if we have a header (title or description)
  const hasHeader = title || desc;
  
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header - only render if title or desc exists */}
      {hasHeader && (
        <div className={compact ? "px-4 py-3" : "px-6 py-5"}>
          {title && (
            <h3 className={`text-base font-medium text-gray-800 dark:text-white/90 ${titleCenter ? 'text-center' : ''}`}>
              {title}
            </h3>
          )}
          {desc && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {desc}
            </p>
          )}
        </div>
      )}

      {/* Card Body - conditionally apply border-t only if there's a header */}
      <div className={`${compact ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} ${hasHeader ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}>
        <div className={`${compact ? 'space-y-4' : 'space-y-6'} ${centerContent ? 'flex flex-col items-center justify-center' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ComponentCard;