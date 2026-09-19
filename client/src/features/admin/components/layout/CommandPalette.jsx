import { useMemo, useState } from 'react';
import { CornerDownLeft, Package, Search, ShoppingBag, Users } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Modal } from '@/components/ui';
import { cn } from '@/utils/cn';
import { NAV_ITEMS } from './nav';

const SEARCH_TARGETS = [
  { key: 'orders', label: 'Search orders', icon: ShoppingBag, to: (q) => `/admin/orders?q=${encodeURIComponent(q)}` },
  { key: 'products', label: 'Search products', icon: Package, to: (q) => `/admin/products?q=${encodeURIComponent(q)}` },
  { key: 'customers', label: 'Search customers', icon: Users, to: (q) => `/admin/customers?q=${encodeURIComponent(q)}` },
];

function PaletteBody({ onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const q = query.trim();
    const pages = NAV_ITEMS.filter((i) => !q || i.label.toLowerCase().includes(q.toLowerCase())).map((i) => ({
      id: i.to,
      label: i.label,
      hint: 'Go to page',
      icon: i.icon,
      to: i.to,
    }));
    const searches = q ? SEARCH_TARGETS.map((t) => ({ id: t.key, label: `${t.label} for “${q}”`, hint: 'Search', icon: t.icon, to: t.to(q) })) : [];
    return [...searches, ...pages];
  }, [query]);

  const go = (item) => {
    if (!item) return;
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <div className="-mx-6 -my-5">
      <div className="relative border-b border-line">
        <Search size={17} className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-ink-400" aria-hidden="true" />
        <input
          data-autofocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search orders, products, customers or jump to a page…"
          aria-label="Command search"
          aria-controls="admin-palette-results"
          aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
          role="combobox"
          aria-expanded="true"
          className="h-14 w-full bg-transparent pr-5 pl-12 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />
      </div>
      <ul id="admin-palette-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
        {results.map((item, i) => {
          const Icon = item.icon;
          return (
            <li
              key={item.id}
              id={`palette-${item.id}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item)}
              className={cn('flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm', i === active ? 'bg-ink-100 text-ink-900' : 'text-ink-700')}
            >
              <Icon size={16} className="text-ink-400" aria-hidden="true" />
              <span className="flex-1 truncate">{item.label}</span>
              <span className="text-xs text-ink-400">{item.hint}</span>
              {i === active && <CornerDownLeft size={14} className="text-ink-400" aria-hidden="true" />}
            </li>
          );
        })}
        {!results.length && <li className="px-3 py-6 text-center text-sm text-ink-500">No matches</li>}
      </ul>
    </div>
  );
}

/** Quick search / navigation (Ctrl/⌘ + K). */
export function CommandPalette({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Quick search" size="md" className="sm:self-start sm:mt-[12vh]">
      <PaletteBody onClose={onClose} />
    </Modal>
  );
}
