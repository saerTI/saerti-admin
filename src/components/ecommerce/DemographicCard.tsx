// Modified DemographicCard.jsx
import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import CountryMap from "./CountryMap";

export default function DemographicCard() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Distribución de Clientes en Chile
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Número de clientes por región
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Ver Más
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Exportar
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
      
      {/* Map container - adjusted to be responsive */}
      <div className="px-4 py-6 my-6 border border-gary-200 rounded-2xl dark:border-gray-800 sm:px-6">
        <div className="flex justify-center">
          <div 
            id="mapOne"
            className="mapOne map-btn h-[382px] w-full max-w-full overflow-hidden"
          >
            <CountryMap mapColor="#3B82F6" />
          </div>
        </div>
      </div>

      {/* Statistics section - adjusted to be responsive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 flex-shrink-0">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
              Región de Atacama
            </p>
            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
              3 Clientes
            </span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative block h-2 w-20 sm:w-24 rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="absolute left-0 top-0 flex h-full w-[45%] items-center justify-center rounded-sm bg-red-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 w-8">
              45%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 flex-shrink-0">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
              Arica y Parinacota
            </p>
            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
              4 Clientes
            </span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative block h-2 w-20 sm:w-24 rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="absolute left-0 top-0 flex h-full w-[18%] items-center justify-center rounded-sm bg-blue-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 w-8">
              18%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 flex-shrink-0">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
              Región de los Ríos
            </p>
            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
              12 Clientes
            </span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative block h-2 w-20 sm:w-24 rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="absolute left-0 top-0 flex h-full w-[32%] items-center justify-center rounded-sm bg-green-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 w-8">
              32%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}