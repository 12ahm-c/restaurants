import { useState, useEffect, useRef } from 'react';
import { useCustomerStore } from '../../stores/customerStore';
import { useDebounce } from '../../hooks/useDebounce';

interface CustomerSearchProps {
  onSelect: (customer: any) => void;
  selectedCustomer: any | null;
  onRemove: () => void;
}

export function CustomerSearch({ onSelect, selectedCustomer, onRemove }: CustomerSearchProps) {
  const { searchCustomers, searchResults, clearSearchResults } = useCustomerStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      searchCustomers(debouncedQuery);
      setIsOpen(true);
    } else {
      clearSearchResults();
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer: any) => {
    onSelect(customer);
    setQuery('');
    setIsOpen(false);
    clearSearchResults();
  };

  if (selectedCustomer) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">
              {selectedCustomer.firstName} {selectedCustomer.lastName}
            </p>
            <p className="text-xs text-green-600">{selectedCustomer.phone}</p>
            <p className="text-xs text-green-600">{selectedCustomer.loyaltyPoints} points available</p>
          </div>
          <button
            onClick={onRemove}
            className="text-green-600 hover:text-green-800"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search customer by phone or name..."
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {isOpen && searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <ul className="max-h-60 overflow-auto">
            {searchResults.map((customer) => (
              <li
                key={customer._id}
                className="cursor-pointer border-b border-gray-100 px-3 py-2 hover:bg-gray-50 last:border-b-0"
                onClick={() => handleSelect(customer)}
              >
                <div className="text-sm font-medium text-gray-900">
                  {customer.firstName} {customer.lastName}
                </div>
                <div className="text-xs text-gray-500">{customer.phone}</div>
                <div className="text-xs text-blue-600">{customer.loyaltyPoints} pts</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
