import { Link } from "react-router-dom"; // Make sure to use react-router-dom, not react-router

interface BreadcrumbItemProps {
  label: string;
  path: string;
}

interface BreadcrumbProps {
  pageTitle?: string;
  items?: BreadcrumbItemProps[];
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, items }) => {
  // If items are provided, use them, otherwise fallback to simple pageTitle version
  const useItems = Array.isArray(items) && items.length > 0;
  
  // If both pageTitle and items are provided, use the last item's label as pageTitle
  const displayTitle = useItems 
    ? (pageTitle || items![items!.length - 1].label) 
    : pageTitle;
  
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2
        className="text-xl font-semibold text-gray-800 dark:text-white/90"
      >
        {displayTitle}
      </h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          {useItems ? (
            // Render breadcrumb items if provided
            items!.map((item, index) => {
              const isLast = index === items!.length - 1;
              
              return isLast ? (
                // Last item is just text (current page)
                <li key={index} className="text-sm text-gray-800 dark:text-white/90">
                  {item.label}
                </li>
              ) : (
                // Other items are links
                <li key={index}>
                  <Link
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
                    to={item.path}
                  >
                    {item.label}
                    <svg
                      className="stroke-current"
                      width="17"
                      height="16"
                      viewBox="0 0 17 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                        stroke=""
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
              );
            })
          ) : (
            // Fall back to the simple Home > pageTitle pattern
            <>
              <li>
                <Link
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
                  to="/"
                >
                  Home
                  <svg
                    className="stroke-current"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      stroke=""
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </li>
              <li className="text-sm text-gray-800 dark:text-white/90">
                {pageTitle}
              </li>
            </>
          )}
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;