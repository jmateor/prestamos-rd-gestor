import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useEmpresas, type EmpresaData } from '@/hooks/useEmpresas';
import { Building2 } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (empresa: EmpresaData) => void;
  placeholder?: string;
  className?: string;
}

export function EmpresaAutocomplete({ value, onChange, onSelect, placeholder, className }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const { data: empresas } = useEmpresas(search);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => { if (value.length >= 2) setOpen(true); }}
        placeholder={placeholder ?? 'Lugar de trabajo'}
        className={className}
      />
      {open && empresas && empresas.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {empresas.map((emp, i) => (
            <button
              key={i}
              type="button"
              className="w-full flex items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
              onClick={() => {
                onChange(emp.lugar_trabajo);
                onSelect?.(emp);
                setOpen(false);
              }}
            >
              <Building2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">{emp.lugar_trabajo}</p>
                {emp.direccion_trabajo && (
                  <p className="text-xs text-muted-foreground">{emp.direccion_trabajo}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
