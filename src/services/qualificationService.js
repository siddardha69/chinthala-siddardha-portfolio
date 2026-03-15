import defaultQualification from '../data/defaultQualification';
import { isAdminAuthenticated } from './adminAuthService';

const QUALIFICATION_STORAGE_KEY = 'portfolio_qualification_v1';
const QUALIFICATION_UPDATED_EVENT = 'portfolio-qualification-updated';
const QUALIFICATION_CATEGORIES = ['education', 'experience'];
const QUALIFICATION_REFRESH_MS = 30000;
const FETCH_TIMEOUT_MS = 8000;
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_QUALIFICATION_TABLE = process.env.REACT_APP_SUPABASE_QUALIFICATION_TABLE;

const canUseStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const getBaseUrl = () => String(SUPABASE_URL || '').replace(/\/$/, '');
const isSupabaseQualificationConfigured = () => Boolean(getBaseUrl() && SUPABASE_ANON_KEY && SUPABASE_QUALIFICATION_TABLE);

const normalizeCategory = (value) => (value === 'experience' ? 'experience' : 'education');
const normalizeText = (value) => String(value || '').trim();

const normalizeItem = (item, fallbackId) => ({
    id: String(item?.id || fallbackId),
    title: normalizeText(item?.title),
    subtitle: normalizeText(item?.subtitle),
    period: normalizeText(item?.period),
    category: normalizeCategory(item?.category),
    sortOrder: Number(item?.sortOrder || 0),
    createdAt: Number(item?.createdAt || Date.now())
});

const createSupabaseHeaders = (extra = {}) => ({
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra
});

const getSupabaseEndpoint = (query = '') => {
    const encodedTable = encodeURIComponent(SUPABASE_QUALIFICATION_TABLE);
    return `${getBaseUrl()}/rest/v1/${encodedTable}${query ? `?${query}` : ''}`;
};

const parseSupabaseError = async (response, fallbackMessage) => {
    let json = null;
    try {
        json = await response.json();
    } catch {
        json = null;
    }
    return json?.message || json?.error || fallbackMessage;
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error('Could not load qualification entries right now.');
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
};

const createDefaultQualification = () => ({
    education: defaultQualification.education.map((item, index) => normalizeItem({
        ...item,
        category: 'education',
        sortOrder: index
    }, `education-${index + 1}`)),
    experience: defaultQualification.experience.map((item, index) => normalizeItem({
        ...item,
        category: 'experience',
        sortOrder: index
    }, `experience-${index + 1}`))
});

const normalizeQualification = (payload) => {
    const normalized = {
        education: [],
        experience: []
    };

    QUALIFICATION_CATEGORIES.forEach((category) => {
        const source = Array.isArray(payload?.[category]) ? payload[category] : [];
        normalized[category] = source
            .map((item, index) => normalizeItem({
                ...item,
                category,
                sortOrder: Number(item?.sortOrder ?? index)
            }, `${category}-${Date.now()}-${index}`))
            .filter((item) => item.title && item.subtitle && item.period);
    });

    return normalized;
};

const rowToItem = (row, index = 0) => normalizeItem({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    period: row.period,
    category: row.category,
    sortOrder: row.sort_order ?? index,
    createdAt: row.created_at
}, row.id);

const itemToRow = (item) => ({
    id: String(item.id),
    category: normalizeCategory(item.category),
    title: normalizeText(item.title),
    subtitle: normalizeText(item.subtitle),
    period: normalizeText(item.period),
    sort_order: Number(item.sortOrder || 0),
    created_at: Number(item.createdAt || Date.now())
});

const rowsToQualification = (rows) => {
    const next = { education: [], experience: [] };
    rows.forEach((row, index) => {
        const item = rowToItem(row, index);
        next[item.category].push(item);
    });
    return next;
};

const emitQualificationUpdated = () => {
    if (typeof window === 'undefined') {
        return;
    }
    window.dispatchEvent(new CustomEvent(QUALIFICATION_UPDATED_EVENT));
};

const readQualificationFromStorage = () => {
    if (!canUseStorage) {
        return createDefaultQualification();
    }

    const raw = window.localStorage.getItem(QUALIFICATION_STORAGE_KEY);
    if (!raw) {
        const defaults = createDefaultQualification();
        window.localStorage.setItem(QUALIFICATION_STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
    }

    try {
        return normalizeQualification(JSON.parse(raw));
    } catch {
        return createDefaultQualification();
    }
};

const writeQualificationToStorage = (qualification) => {
    if (!canUseStorage) {
        return;
    }

    const payload = normalizeQualification(qualification);
    window.localStorage.setItem(QUALIFICATION_STORAGE_KEY, JSON.stringify(payload));
    emitQualificationUpdated();
};

const cacheQualificationToStorage = (qualification) => {
    if (!canUseStorage) {
        return;
    }

    const payload = normalizeQualification(qualification);
    window.localStorage.setItem(QUALIFICATION_STORAGE_KEY, JSON.stringify(payload));
};

const readQualificationFromSupabase = async () => {
    const query = 'select=*&order=category.asc,sort_order.asc,created_at.asc';
    const response = await fetchWithTimeout(getSupabaseEndpoint(query), {
        method: 'GET',
        headers: createSupabaseHeaders()
    });

    if (!response.ok) {
        const message = await parseSupabaseError(response, 'Could not load qualification entries right now.');
        throw new Error(message);
    }

    const rows = await response.json();
    return rowsToQualification(Array.isArray(rows) ? rows : []);
};

const readQualification = async () => {
    if (isSupabaseQualificationConfigured()) {
        const qualification = await readQualificationFromSupabase();
        cacheQualificationToStorage(qualification);
        return qualification;
    }
    return readQualificationFromStorage();
};

const flattenQualification = (qualification) => ([
    ...qualification.education.map((item, index) => ({ ...item, category: 'education', sortOrder: index })),
    ...qualification.experience.map((item, index) => ({ ...item, category: 'experience', sortOrder: index }))
]);

const writeQualification = async (qualification) => {
    if (isSupabaseQualificationConfigured()) {
        const payload = flattenQualification(normalizeQualification(qualification)).map((item) => itemToRow(item));
        const response = await fetchWithTimeout(getSupabaseEndpoint('on_conflict=id'), {
            method: 'POST',
            headers: createSupabaseHeaders({
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates'
            }),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const message = await parseSupabaseError(response, 'Could not save qualification right now.');
            throw new Error(message);
        }

        cacheQualificationToStorage(qualification);
        emitQualificationUpdated();
        return;
    }

    writeQualificationToStorage(qualification);
};

const findItemCategory = (qualification, itemId) => (
    QUALIFICATION_CATEGORIES.find((category) => qualification[category].some((item) => item.id === String(itemId))) || ''
);

export const subscribeToQualification = (onData, onError) => {
    if (isSupabaseQualificationConfigured() && canUseStorage) {
        onData(readQualificationFromStorage());
    }

    const syncQualification = async () => {
        try {
            onData(await readQualification());
        } catch (error) {
            if (isSupabaseQualificationConfigured() && canUseStorage) {
                onData(readQualificationFromStorage());
            }
            if (onError) {
                onError(error);
            }
        }
    };

    syncQualification();

    const handleInTabUpdate = () => {
        syncQualification();
    };

    if (typeof window !== 'undefined') {
        window.addEventListener(QUALIFICATION_UPDATED_EVENT, handleInTabUpdate);
    }

    if (isSupabaseQualificationConfigured()) {
        const refreshTimer = setInterval(syncQualification, QUALIFICATION_REFRESH_MS);
        return () => {
            clearInterval(refreshTimer);
            if (typeof window !== 'undefined') {
                window.removeEventListener(QUALIFICATION_UPDATED_EVENT, handleInTabUpdate);
            }
        };
    }

    if (!canUseStorage) {
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener(QUALIFICATION_UPDATED_EVENT, handleInTabUpdate);
            }
        };
    }

    const handleStorage = (event) => {
        if (event.key === QUALIFICATION_STORAGE_KEY) {
            syncQualification();
        }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(QUALIFICATION_UPDATED_EVENT, handleInTabUpdate);
    };
};

export const addQualificationItem = async ({ category, title, subtitle, period }) => {
    if (!isAdminAuthenticated()) {
        throw new Error('Unauthorized admin action.');
    }

    const normalizedTitle = normalizeText(title);
    const normalizedSubtitle = normalizeText(subtitle);
    const normalizedPeriod = normalizeText(period);
    if (!normalizedTitle || !normalizedSubtitle || !normalizedPeriod) {
        throw new Error('Title, subtitle and period are required.');
    }

    const nextCategory = normalizeCategory(category);
    const current = await readQualification();
    const newItem = normalizeItem({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        category: nextCategory,
        title: normalizedTitle,
        subtitle: normalizedSubtitle,
        period: normalizedPeriod,
        sortOrder: current[nextCategory].length,
        createdAt: Date.now()
    }, `${Date.now()}`);

    const next = {
        ...current,
        [nextCategory]: [...current[nextCategory], newItem]
    };

    await writeQualification(next);
    return newItem;
};

export const updateQualificationItem = async (itemId, updates) => {
    if (!isAdminAuthenticated()) {
        throw new Error('Unauthorized admin action.');
    }

    const targetId = String(itemId);
    const current = await readQualification();
    const currentCategory = findItemCategory(current, targetId);

    if (!currentCategory) {
        throw new Error('Qualification item not found.');
    }

    const currentItem = current[currentCategory].find((item) => item.id === targetId);
    const nextCategory = normalizeCategory(updates?.category || currentCategory);
    const nextItem = normalizeItem({
        ...currentItem,
        ...updates,
        id: currentItem.id,
        category: nextCategory,
        createdAt: currentItem.createdAt
    }, currentItem.id);

    if (!nextItem.title || !nextItem.subtitle || !nextItem.period) {
        throw new Error('Title, subtitle and period are required.');
    }

    const next = {
        education: current.education.filter((item) => item.id !== targetId),
        experience: current.experience.filter((item) => item.id !== targetId)
    };

    next[nextCategory] = [...next[nextCategory], nextItem].map((item, index) => ({
        ...item,
        category: nextCategory,
        sortOrder: index
    }));

    await writeQualification(next);
    return nextItem;
};

export const removeQualificationItem = async (itemId) => {
    if (!isAdminAuthenticated()) {
        throw new Error('Unauthorized admin action.');
    }

    const targetId = String(itemId);
    const current = await readQualification();
    const next = {
        education: current.education.filter((item) => item.id !== targetId).map((item, index) => ({
            ...item,
            category: 'education',
            sortOrder: index
        })),
        experience: current.experience.filter((item) => item.id !== targetId).map((item, index) => ({
            ...item,
            category: 'experience',
            sortOrder: index
        }))
    };

    if (isSupabaseQualificationConfigured()) {
        const response = await fetchWithTimeout(getSupabaseEndpoint(`id=eq.${encodeURIComponent(targetId)}`), {
            method: 'DELETE',
            headers: createSupabaseHeaders()
        });

        if (!response.ok) {
            const message = await parseSupabaseError(response, 'Could not remove qualification right now.');
            throw new Error(message);
        }
    }

    await writeQualification(next);
};
