import { h } from 'preact';
import { useState, useMemo, useEffect, useRef } from 'preact/hooks';

interface Breed {
  name: string;
  slug: string;
  group: string;
  size: string;
  popularity_rank: number;
}

interface Props {
  breeds: Breed[];
}

const GROUPS = ['All Groups', 'Sporting', 'Hound', 'Working', 'Terrier', 'Toy', 'Non-Sporting', 'Herding'];
const SIZES = ['All Sizes', 'Small', 'Medium', 'Large', 'Giant'];

const styles = {
  wrapper: {
    fontFamily: 'inherit',
    color: '#2C1810',
  } as h.JSX.CSSProperties,

  controls: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
    marginBottom: '20px',
    alignItems: 'flex-end',
  } as h.JSX.CSSProperties,

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    flex: '1 1 200px',
    minWidth: '160px',
  } as h.JSX.CSSProperties,

  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#2C1810',
    letterSpacing: '0.02em',
  } as h.JSX.CSSProperties,

  input: {
    padding: '9px 13px',
    border: '1.5px solid #e0d5c0',
    borderRadius: '8px',
    fontSize: '15px',
    background: '#FDF6E3',
    color: '#2C1810',
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
    boxSizing: 'border-box' as const,
  } as h.JSX.CSSProperties,

  inputFocus: {
    borderColor: '#2D5F2D',
  } as h.JSX.CSSProperties,

  select: {
    padding: '9px 36px 9px 13px',
    border: '1.5px solid #e0d5c0',
    borderRadius: '8px',
    fontSize: '15px',
    background: '#FDF6E3',
    color: '#2C1810',
    outline: 'none',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%232C1810' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  } as h.JSX.CSSProperties,

  count: {
    fontSize: '14px',
    color: '#5a4a3a',
    marginBottom: '16px',
    fontStyle: 'italic',
  } as h.JSX.CSSProperties,

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '14px',
  } as h.JSX.CSSProperties,

  card: {
    display: 'block',
    padding: '16px 18px',
    background: '#fff',
    border: '1.5px solid #e0d5c0',
    borderRadius: '10px',
    textDecoration: 'none',
    color: '#2C1810',
    transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
    cursor: 'pointer',
  } as h.JSX.CSSProperties,

  cardHover: {
    borderColor: '#2D5F2D',
    boxShadow: '0 4px 14px rgba(45,95,45,0.12)',
    transform: 'translateY(-2px)',
  } as h.JSX.CSSProperties,

  cardName: {
    fontSize: '15px',
    fontWeight: 700,
    marginBottom: '10px',
    lineHeight: 1.3,
  } as h.JSX.CSSProperties,

  badges: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  } as h.JSX.CSSProperties,

  badgeGroup: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '20px',
    background: '#2D5F2D',
    color: '#fff',
    letterSpacing: '0.03em',
    textTransform: 'uppercase' as const,
  } as h.JSX.CSSProperties,

  badgeSize: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '20px',
    background: '#D4A843',
    color: '#fff',
    letterSpacing: '0.03em',
    textTransform: 'uppercase' as const,
  } as h.JSX.CSSProperties,

  empty: {
    textAlign: 'center' as const,
    padding: '48px 20px',
    color: '#7a6a5a',
    fontSize: '15px',
  } as h.JSX.CSSProperties,

  clearBtn: {
    alignSelf: 'flex-end' as const,
    padding: '9px 16px',
    background: 'transparent',
    border: '1.5px solid #e0d5c0',
    borderRadius: '8px',
    color: '#5a4a3a',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
    whiteSpace: 'nowrap' as const,
  } as h.JSX.CSSProperties,
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function BreedSearch({ breeds }: Props) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('All Groups');
  const [size, setSize] = useState('All Sizes');
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [groupFocused, setGroupFocused] = useState(false);
  const [sizeFocused, setSizeFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 150);

  const filtered = useMemo(() => {
    const lower = debouncedQuery.toLowerCase().trim();
    return breeds
      .filter((b) => {
        const matchesName = lower === '' || b.name.toLowerCase().includes(lower);
        const matchesGroup = group === 'All Groups' || b.group === group;
        const matchesSize = size === 'All Sizes' || b.size === size;
        return matchesName && matchesGroup && matchesSize;
      })
      .sort((a, b) => a.popularity_rank - b.popularity_rank);
  }, [breeds, debouncedQuery, group, size]);

  const isFiltered = query !== '' || group !== 'All Groups' || size !== 'All Sizes';

  function handleClear() {
    setQuery('');
    setGroup('All Groups');
    setSize('All Sizes');
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.controls}>
        {/* Search input */}
        <div style={styles.fieldGroup}>
          <label for="breed-search" style={styles.label}>
            Search breeds
          </label>
          <input
            id="breed-search"
            type="search"
            placeholder="e.g. Labrador, Poodle…"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              ...styles.input,
              ...(inputFocused ? styles.inputFocus : {}),
            }}
            aria-label="Search breeds by name"
            autocomplete="off"
          />
        </div>

        {/* Group filter */}
        <div style={styles.fieldGroup}>
          <label for="group-filter" style={styles.label}>
            Group
          </label>
          <select
            id="group-filter"
            value={group}
            onChange={(e) => setGroup((e.target as HTMLSelectElement).value)}
            onFocus={() => setGroupFocused(true)}
            onBlur={() => setGroupFocused(false)}
            style={{
              ...styles.select,
              ...(groupFocused ? styles.inputFocus : {}),
            }}
            aria-label="Filter by breed group"
          >
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Size filter */}
        <div style={styles.fieldGroup}>
          <label for="size-filter" style={styles.label}>
            Size
          </label>
          <select
            id="size-filter"
            value={size}
            onChange={(e) => setSize((e.target as HTMLSelectElement).value)}
            onFocus={() => setSizeFocused(true)}
            onBlur={() => setSizeFocused(false)}
            style={{
              ...styles.select,
              ...(sizeFocused ? styles.inputFocus : {}),
            }}
            aria-label="Filter by breed size"
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Clear button — only shown when filters are active */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleClear}
            style={styles.clearBtn}
            aria-label="Clear all filters"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p style={styles.count} aria-live="polite" aria-atomic="true">
        Showing {filtered.length} of {breeds.length} breed{breeds.length !== 1 ? 's' : ''}
      </p>

      {/* Results grid */}
      {filtered.length > 0 ? (
        <ul
          style={{ ...styles.grid, listStyle: 'none', padding: 0, margin: 0 }}
          role="list"
          aria-label="Breed results"
        >
          {filtered.map((breed) => (
            <li key={breed.slug}>
              <a
                href={`/breeds/${breed.slug}/`}
                style={{
                  ...styles.card,
                  ...(hoveredSlug === breed.slug ? styles.cardHover : {}),
                }}
                onMouseEnter={() => setHoveredSlug(breed.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
                onFocus={() => setHoveredSlug(breed.slug)}
                onBlur={() => setHoveredSlug(null)}
                aria-label={`${breed.name} — ${breed.group}, ${breed.size}`}
              >
                <div style={styles.cardName}>{breed.name}</div>
                <div style={styles.badges}>
                  <span style={styles.badgeGroup}>{breed.group}</span>
                  <span style={styles.badgeSize}>{breed.size}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div style={styles.empty} role="status">
          <p>No breeds match your search.</p>
          <button
            type="button"
            onClick={handleClear}
            style={{
              ...styles.clearBtn,
              marginTop: '12px',
              borderColor: '#2D5F2D',
              color: '#2D5F2D',
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
