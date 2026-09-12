import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { COUNTRIES, CountryCode, DEFAULT_COUNTRY } from '../utils/countryCodes';

interface PhoneCountryInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedCountry: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const PhoneCountryInput: React.FC<PhoneCountryInputProps> = ({
  value,
  onChange,
  selectedCountry,
  onCountryChange,
  id = 'phone-input',
  placeholder,
  required = false,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter(c => 
    c.country.toLowerCase().includes(search.toLowerCase()) ||
    c.dialCode.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectCountry = (country: CountryCode) => {
    onCountryChange(country);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex rounded-lg border border-slate-300 shadow-2xs focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 bg-white transition-all overflow-hidden">
        {/* Country selector trigger */}
        <button
          type="button"
          id={`${id}-country-btn`}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 text-xs font-semibold text-slate-700 transition-colors shrink-0 cursor-pointer disabled:opacity-60"
          title="Sélectionner l'indicatif et le pays"
        >
          <span className="text-base leading-none" role="img" aria-label={selectedCountry.country}>
            {selectedCountry.flag}
          </span>
          <span className="font-mono text-slate-800">{selectedCountry.dialCode}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Phone number input */}
        <input
          type="tel"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || selectedCountry.placeholder}
          required={required}
          disabled={disabled}
          className="w-full px-3 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
        />
      </div>

      {/* Country selection dropdown modal */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher pays ou indicatif..."
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Aucun pays trouvé
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-indigo-50/60 transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg leading-none">{c.flag}</span>
                      <span className="truncate">{c.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[11px]">{c.dialCode}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            🇨🇲 Cameroun par défaut · Zone CEMAC & International
          </div>
        </div>
      )}
    </div>
  );
};
