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
      <div className="rounded-md border border-brand-500/20 bg-brand-500/10 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-brand-400">
              {selectedCustomer.firstName} {selectedCustomer.lastName}
            </p>
            <p className="text-xs text-brand-400">{selectedCustomer.phone}</p>
            <p className="text-xs text-brand-400">{selectedCustomer.loyaltyPoints} points available</p>
          </div>
          <button
            onClick={onRemove}
            className="text-brand-400 hover:text-brand-500"
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
        className="w-full rounded-md border dark:border-white/10 border-black/10 dark:bg-surface-800 bg-surface-100 px-3 py-2 text-sm dark:text-white text-surface-900 placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {isOpen && searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border dark:border-white/10 border-black/10 dark:bg-surface-900 bg-white shadow-lg">
          <ul className="max-h-60 overflow-auto">
            {searchResults.map((customer) => (
              <li
                key={customer._id}
                className="cursor-pointer border-b dark:border-white/5 border-black/5 px-3 py-2 dark:hover:bg-white/5 hover:bg-black/5 last:border-b-0"
                onClick={() => handleSelect(customer)}
              >
                <div className="text-sm font-medium dark:text-white text-surface-900">
                  {customer.firstName} {customer.lastName}
                </div>
                <div className="text-xs text-surface-400">{customer.phone}</div>
                <div className="text-xs text-brand-400">{customer.loyaltyPoints} pts</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
