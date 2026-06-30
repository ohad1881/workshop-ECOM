import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../general_hooks/useDebounce';
import { searchUsers } from '../api/users';
import { searchProducts } from '../api/products';

// Mention config per trigger char. `@` resolves registered users, `#` resolves products.
const TRIGGERS = {
  '@': { kind: 'user', search: searchUsers, label: (u) => u.username, id: (u) => u.id },
  '#': { kind: 'product', search: searchProducts, label: (p) => p.name, id: (p) => p.id },
};

// Finds an in-progress mention token immediately before the caret, e.g. "...@jo|".
// Returns the trigger, the typed query, and the token's start index, or null.
const activeToken = (text, caret) => {
  if (typeof text !== 'string') return null;
  const upto = text.slice(0, caret);
  const match = upto.match(/(?:^|\s)([@#])([\p{L}\p{N}_]*)$/u);
  if (!match) return null;
  return { trigger: match[1], query: match[2], start: caret - match[2].length - 1 };
};

// Drives @user / #product autocomplete over a controlled text input. Caller supplies
// which triggers are enabled and an optional onInsert(kind, item) callback.
export const useMentions = ({ enabled = ['@', '#'], onInsert } = {}) => {
  const [value, setValue] = useState('');
  const [token, setToken] = useState(null); // { trigger, query, start }
  const [anchorEl, setAnchorEl] = useState(null);
  const resolved = useRef([]); // [{ trigger, label, kind, id }]
  const inputRef = useRef(null);

  const debouncedQuery = useDebounce(token?.query ?? '', 250);
  const trigger = token?.trigger;
  const config = trigger ? TRIGGERS[trigger] : null;
  const open = Boolean(token && enabled.includes(trigger) && debouncedQuery.trim().length >= 2);

  const { data: items = [], isFetching } = useQuery({
    queryKey: ['mention', trigger, debouncedQuery],
    queryFn: () => config.search(debouncedQuery),
    enabled: open,
  });

  const syncToken = useCallback((el) => {
    setAnchorEl(el);
    setToken(activeToken(el.value, el.selectionStart ?? el.value.length));
  }, []);

  const onChange = useCallback((e) => {
    setValue(e.target.value);
    syncToken(e.target);
  }, [syncToken]);

  // Selection can move without a value change (arrow keys / click).
  const onSelect = useCallback((e) => syncToken(e.target), [syncToken]);

  const closeMenu = useCallback(() => setToken(null), []);

  const insert = useCallback((item) => {
    if (!token) return;
    const label = config.label(item);
    const before = value.slice(0, token.start);
    const after = value.slice((inputRef.current?.selectionStart) ?? value.length);
    const next = `${before}${token.trigger}${label} ${after}`;
    setValue(next);
    resolved.current.push({ trigger: token.trigger, label, kind: config.kind, id: config.id(item) });
    setToken(null);
    onInsert?.(config.kind, item);
    // Restore focus after the dropdown closes.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [token, config, value, onInsert]);

  const reset = useCallback(() => {
    setValue('');
    setToken(null);
    resolved.current = [];
  }, []);

  // Only count a mention if its `@label` / `#label` still appears in the text.
  const getMentions = useCallback(() => {
    const userIds = new Set();
    const productIds = new Set();
    for (const m of resolved.current) {
      if (!value.includes(`${m.trigger}${m.label}`)) continue;
      (m.kind === 'user' ? userIds : productIds).add(m.id);
    }
    return { mentionedUserIds: [...userIds], mentionedProductIds: [...productIds] };
  }, [value]);

  return useMemo(() => ({
    value, setValue, onChange, onSelect, closeMenu, inputRef, anchorEl,
    open, items, isFetching, trigger, insert, reset, getMentions,
  }), [value, onChange, onSelect, closeMenu, anchorEl, open, items, isFetching, trigger, insert, reset, getMentions]);
};
