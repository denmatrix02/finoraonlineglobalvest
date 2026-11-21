import { useState, useEffect, useCallback } from 'react';
import { ArrowLeftRight, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

/* ── Currency list with ISO 3166-1 alpha-2 country codes for flags ── */
const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee',       symbol: '₹',  country: 'in', region: 'India'           },
  { code: 'USD', name: 'United States Dollar',symbol: '$',  country: 'us', region: 'United States'   },
  { code: 'EUR', name: 'Euro',                symbol: '€',  country: 'eu', region: 'Europe'          },
  { code: 'GBP', name: 'British Pound',       symbol: '£',  country: 'gb', region: 'United Kingdom'  },
  { code: 'JPY', name: 'Japanese Yen',        symbol: '¥',  country: 'jp', region: 'Japan'           },
  { code: 'CAD', name: 'Canadian Dollar',     symbol: 'C$', country: 'ca', region: 'Canada'          },
  { code: 'AUD', name: 'Australian Dollar',   symbol: 'A$', country: 'au', region: 'Australia'       },
  { code: 'CHF', name: 'Swiss Franc',         symbol: 'Fr', country: 'ch', region: 'Switzerland'     },
  { code: 'CNY', name: 'Chinese Yuan',        symbol: '¥',  country: 'cn', region: 'China'           },
  { code: 'BRL', name: 'Brazilian Real',      symbol: 'R$', country: 'br', region: 'Brazil'          },
  { code: 'MXN', name: 'Mexican Peso',        symbol: '$',  country: 'mx', region: 'Mexico'          },
  { code: 'KRW', name: 'South Korean Won',    symbol: '₩',  country: 'kr', region: 'South Korea'     },
  { code: 'SGD', name: 'Singapore Dollar',    symbol: 'S$', country: 'sg', region: 'Singapore'       },
  { code: 'ZAR', name: 'South African Rand',  symbol: 'R',  country: 'za', region: 'South Africa'    },
  { code: 'NGN', name: 'Nigerian Naira',      symbol: '₦',  country: 'ng', region: 'Nigeria'         },
  { code: 'AED', name: 'UAE Dirham',          symbol: 'د.إ',country: 'ae', region: 'UAE'             },
  { code: 'SAR', name: 'Saudi Riyal',         symbol: '﷼',  country: 'sa', region: 'Saudi Arabia'    },
  { code: 'NOK', name: 'Norwegian Krone',     symbol: 'kr', country: 'no', region: 'Norway'          },
  { code: 'SEK', name: 'Swedish Krona',       symbol: 'kr', country: 'se', region: 'Sweden'          },
  { code: 'NZD', name: 'New Zealand Dollar',  symbol: 'NZ$',country: 'nz', region: 'New Zealand'     },
];

const SUPPORTED_BAR = ['in','us','gb','eu','jp'];

/* ── Get currency meta by code ── */
const getMeta = (code) => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];

/* ── Flag image from flagcdn.com (16×12 png) ── */
const Flag = ({ country, size = 20 }) => (
  <div
    style={{
      width: size, height: size, borderRadius: '50%',
      overflow: 'hidden', flexShrink: 0, border: '1px solid #333',
      background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    <img
      src={`https://flagcdn.com/w40/${country}.png`}
      alt={country}
      style={{ width: '140%', height: '140%', objectFit: 'cover', objectPosition: 'center' }}
      onError={e => { e.currentTarget.style.display = 'none'; }}
    />
  </div>
);

/* ── Currency Select Row (flag + code + name) ── */
function CurrencySelector({ value, onChange, id }) {
  const meta = getMeta(value);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <Flag country={meta.country} size={24} />
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="exchange-select"
        style={{ flex: 1 }}
      >
        {CURRENCIES.map(c => (
          <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
        ))}
      </select>
    </div>
  );
}

async function fetchRate(from, to) {
  if (from === to) return 1;
  const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
  if (!res.ok) throw new Error('Rate unavailable');
  const data = await res.json();
  return data.rates[to];
}

export default function MoneyExchange() {
  const [from,      setFrom]      = useState('INR');
  const [to,        setTo]        = useState('USD');
  const [amount,    setAmount]    = useState('5,000');
  const [rate,      setRate]      = useState(null);
  const [converted, setConverted] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [rateFlash, setRateFlash] = useState(false);
  const [swapAnim,  setSwapAnim]  = useState(false);

  const numericAmount = () => parseFloat((amount || '0').replace(/,/g, '')) || 0;

  const loadRate = useCallback(async (f, t) => {
    setLoading(true); setError(null);
    try {
      const r = await fetchRate(f, t);
      setRate(r);
      setRateFlash(true);
      setTimeout(() => setRateFlash(false), 700);
    } catch {
      setError('Rate unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRate(from, to); }, [from, to, loadRate]);

  useEffect(() => {
    if (rate !== null) {
      const result = numericAmount() * rate;
      setConverted(result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  }, [rate, amount]);

  const handleSwap = () => {
    setSwapAnim(true);
    setTimeout(() => setSwapAnim(false), 380);
    setFrom(to);
    setTo(from);
  };

  const fromMeta = getMeta(from);
  const toMeta   = getMeta(to);

  return (
    <div className="exchange-card shimmer" style={{ padding: '18px 20px 16px' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.01em' }}>
          Money Exchange
        </p>
        <button
          onClick={() => loadRate(from, to)}
          title="Refresh"
          style={{
            width: 26, height: 26, borderRadius: 8,
            background: '#222', border: '1px solid #2a2a2a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#8a8a8a', cursor: 'pointer', transition: 'color .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#c5f82a'}
          onMouseLeave={e => e.currentTarget.style.color = '#8a8a8a'}
        >
          {loading
            ? <span className="spinner" />
            : <RefreshCw size={12} />
          }
        </button>
      </div>

      {/* ── FROM row ── */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 10.5, color: '#8a8a8a', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>
          From
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Flag + selector */}
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger className="flex items-center gap-2 bg-[#222] border-[#2a2a2a] rounded-[10px] h-[48px] py-[7px] px-[10px] flex-1 hover:border-primary transition-colors focus:ring-0 shadow-none">
              <div className="flex items-center gap-2 flex-1 text-left min-w-0">
                <Flag country={fromMeta.country} size={22} />
                <div className="flex-1 min-w-0 truncate">
                  <p className="text-[11px] font-semibold text-[#f4f4f5] leading-[1.2]">{fromMeta.code}</p>
                  <p className="text-[10px] text-[#8a8a8a] leading-[1.2] truncate">{fromMeta.region}</p>
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f4f4f5]">
              {CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code} className="focus:bg-[#222] focus:text-primary cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Flag country={c.country} size={16} />
                    <span>{c.code} — {c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Amount */}
          <div style={{ position: 'relative', width: 90 }}>
            <input
              id="ex-amount"
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px',
                background: '#222', border: '1px solid #2a2a2a', borderRadius: 10,
                color: '#f4f4f5', fontSize: 13, fontWeight: 600,
                fontFamily: 'Lexend, sans-serif', outline: 'none', textAlign: 'right',
              }}
              onFocus={e => e.target.style.borderColor = '#c5f82a'}
              onBlur={e => e.target.style.borderColor = '#2a2a2a'}
            />
          </div>
        </div>
      </div>

      {/* ── TO row ── */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10.5, color: '#8a8a8a', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>
          To
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Flag + selector */}
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className="flex items-center gap-2 bg-[#222] border-[#2a2a2a] rounded-[10px] h-[48px] py-[7px] px-[10px] flex-1 hover:border-primary transition-colors focus:ring-0 shadow-none">
              <div className="flex items-center gap-2 flex-1 text-left min-w-0">
                <Flag country={toMeta.country} size={22} />
                <div className="flex-1 min-w-0 truncate">
                  <p className="text-[11px] font-semibold text-[#f4f4f5] leading-[1.2]">{toMeta.code}</p>
                  <p className="text-[10px] text-[#8a8a8a] leading-[1.2] truncate">{toMeta.region}</p>
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f4f4f5]">
              {CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code} className="focus:bg-[#222] focus:text-primary cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Flag country={c.country} size={16} />
                    <span>{c.code} — {c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Converted result */}
          <div style={{
            width: 90, padding: '8px 10px',
            background: '#222', border: '1px solid #2a2a2a', borderRadius: 10,
            fontSize: 13, fontWeight: 600, textAlign: 'right',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minHeight: 38,
          }}>
            {loading
              ? <span className="spinner" />
              : error
              ? <span style={{ color: '#ff6b6b', fontSize: 11 }}>—</span>
              : <span className={rateFlash ? 'rate-flash' : ''} style={{ color: '#f4f4f5' }}>{converted}</span>
            }
          </div>
        </div>
      </div>

      {/* ── Rate line ── */}
      {rate !== null && !error && (
        <div style={{ fontSize: 10.5, color: '#8a8a8a', marginBottom: 14, textAlign: 'center' }}>
          1 {from} = <span style={{ color: '#c5f82a', fontWeight: 600 }}>{rate.toFixed(4)}</span> {to}
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#ff6b6b', marginBottom: 12, padding: '6px 10px', background: 'rgba(255,107,107,.07)', borderRadius: 8 }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {/* ── Exchange button ── */}
      <button
        id="ex-submit"
        onClick={handleSwap}
        className="exchange-btn"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <ArrowLeftRight size={13} />
        Exchange
      </button>

      {/* ── Supported Currency row ── */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #222' }}>
        <p style={{ fontSize: 10, color: '#8a8a8a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 500 }}>
          Supported Currency
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {SUPPORTED_BAR.map(cc => {
            const cur = CURRENCIES.find(c => c.country === cc);
            return (
              <button
                key={cc}
                onClick={() => { if (cur) setTo(cur.code); }}
                title={cur?.code}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: '50%',
                  border: to === cur?.code ? '2px solid #c5f82a' : '1px solid #2a2a2a',
                  background: '#1a1a1a', padding: 2, cursor: 'pointer', transition: 'border-color .2s',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={`https://flagcdn.com/w40/${cc}.png`}
                  alt={cc}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </button>
            );
          })}
          <span style={{ fontSize: 10, color: '#8a8a8a', marginLeft: 2 }}>+15</span>
        </div>
      </div>
    </div>
  );
}
