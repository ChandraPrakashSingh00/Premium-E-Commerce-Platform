import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Search, X } from 'lucide-react';
import { Spinner } from '@/components/ui';
import { useSuggestions } from '@/features/products/hooks';
import { useDebounce, useEscapeKey, useFocusTrap, useLockBodyScroll } from '@/hooks';
import { useRecentSearchStore, useUiStore } from '@/store/uiStore';
import { buildSearchOptions } from '@/features/products/searchOptions';
import { SearchIdle, SearchResults } from './SearchResults';

function SearchPanel({ onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const listId = useId();
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(term, 250);
  const addRecent = useRecentSearchStore((s) => s.add);
  useFocusTrap(panelRef, true);
  useLockBodyScroll(true);
  useEscapeKey(onClose);

  const trimmed = debounced.trim();
  const showResults = trimmed.length >= 2;
  const { data, isFetching, isError } = useSuggestions(showResults ? trimmed : '');
  const options = showResults ? buildSearchOptions(data, trimmed) : [];

  const go = (href, recordTerm) => {
    if (recordTerm) addRecent(recordTerm);
    onClose();
    navigate(href);
  };

  const submit = (value) => {
    const q = value.trim();
    if (!q) return;
    go(`/search?q=${encodeURIComponent(q)}`, q);
  };

  const onKeyDown = (e) => {
    if (!options.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0 && options[active]) {
      e.preventDefault();
      const opt = options[active];
      go(opt.href, opt.type === 'query' ? trimmed : undefined);
    }
  };

  const activeOption = options[active];

  return (
    <div className="fixed inset-0 z-[75]">
      <motion.div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className="relative flex max-h-dvh flex-col bg-white shadow-lift max-lg:h-dvh lg:max-h-[85dvh] lg:rounded-b-2xl"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -16, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      >
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            submit(term);
          }}
          className="border-b border-line"
        >
          <div className="container-page flex h-16 items-center gap-2 lg:h-20 lg:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-600 lg:hidden"
              aria-label="Close search"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-lg border border-brand-500 bg-white pl-3 ring-4 ring-brand-500/10 lg:h-12 lg:pl-4">
              <Search size={18} className="shrink-0 text-ink-400" aria-hidden="true" />
              <input
                data-autofocus
                type="search"
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setActive(-1);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search for products, brands and more"
                className="h-full min-w-0 flex-1 bg-transparent text-base text-ink-900 placeholder:text-ink-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                role="combobox"
                aria-expanded={options.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeOption ? `${listId}-${active}` : undefined}
                aria-label="Search"
                enterKeyHint="search"
                autoComplete="off"
              />
              {isFetching && <Spinner className="h-4 w-4 shrink-0 text-brand-500" label="Searching" />}
              {term && (
                <button
                  type="button"
                  onClick={() => {
                    setTerm('');
                    setActive(-1);
                  }}
                  className="flex h-10 shrink-0 items-center px-2 text-sm font-medium text-ink-500 hover:text-ink-900"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                className="flex h-full w-12 shrink-0 items-center justify-center bg-brand-500 text-white transition-colors hover:bg-brand-600"
                aria-label="Submit search"
              >
                <Search size={18} strokeWidth={2.2} />
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hidden h-11 w-11 items-center justify-center rounded-full text-ink-500 hover:bg-surface hover:text-ink-900 lg:flex"
              aria-label="Close search"
            >
              <X size={22} />
            </button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="container-page py-6 lg:py-8">
            {showResults ? (
              <SearchResults
                listId={listId}
                data={data}
                options={options}
                active={active}
                term={trimmed}
                isError={isError}
                loading={isFetching && !data}
                onHover={setActive}
                onSelect={(opt) => go(opt.href, opt.type === 'query' ? trimmed : undefined)}
              />
            ) : (
              <SearchIdle onPick={submit} />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** Full-screen (mobile) / top-sheet (desktop) search with live suggestions. */
export default function SearchOverlay() {
  const open = useUiStore((s) => s.overlay === 'search');
  const close = useUiStore((s) => s.close);
  return createPortal(<AnimatePresence>{open && <SearchPanel onClose={close} />}</AnimatePresence>, document.body);
}
