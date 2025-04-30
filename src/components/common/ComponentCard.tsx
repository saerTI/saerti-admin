interface ComponentCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  titleCenter?: boolean;
  centerContent?: boolean;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  titleCenter = true,
  centerContent = true,
}) => {
  // Check if we have a header (title or description)
  const hasHeader = title || desc;
  
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header - only render if title or desc exists */}
      {hasHeader && (
        <div className="px-6 py-5">
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
      <div className={`p-4 ${hasHeader ? 'border-t border-gray-100 dark:border-gray-800' : ''} sm:p-6`}>
        <div className={`space-y-6 ${centerContent ? 'flex flex-col items-center justify-center' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ComponentCard;