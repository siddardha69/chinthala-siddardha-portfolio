import defaultExperience from '../data/defaultExperience';
import { isAdminAuthenticated } from './adminAuthService';

const EXPERIENCE_STORAGE_KEY = 'portfolio_experience_v1';
const EXPERIENCE_UPDATED_EVENT = 'portfolio-experience-updated';
const EXPERIENCE_CATEGORIES = ['frontend', 'backend'];
const EXPERIENCE_REFRESH_MS = 30000;
const FETCH_TIMEOUT_MS = 8000;
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_EXPERIENCE_TABLE = process.env.REACT_APP_SUPABASE_EXPERIENCE_TABLE;

const canUseStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const getBaseUrl = () => String(SUPABASE_URL || '').replace(/\/$/, '');
const isSupabaseExperienceConfigured = () => Boolean(getBaseUrl() && SUPABASE_ANON_KEY && SUPABASE_EXPERIENCE_TABLE);

const normalizeCategory = (value) => (value === 'backend' ? 'backend' : 'frontend');
const normalizeSkill = (value) => String(value || '').trim();
const normalizeLevel = (value) => String(value || 'Intermediate').trim() || 'Intermediate';

const normalizeItem = (item, fallbackId) => ({
    id: String(item?.id || fallbackId),
    skill: normalizeSkill(item?.skill),
    level: normalizeLevel(item?.level),
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
    const encodedTable = encodeURIComponent(SUPABASE_EXPERIENCE_TABLE);
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
            throw new Error('Could not load experience skills right now.');
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
};

const createDefaultExperience = () => ({
    frontend: defaultExperience.frontend.map((item, index) => normalizeItem({
        ...item,
        category: 'frontend',
        sortOrder: index
    }, `frontend-${index + 1}`)),
    backend: defaultExperience.backend.map((item, index) => normalizeItem({
        ...item,
        category: 'backend',
        sortOrder: index
    }, `backend-${index + 1}`))
});

const normalizeExperience = (payload) => {
    const normalized = { frontend: [], backend: [] };

    EXPERIENCE_CATEGORIES.forEach((category) => {
        const source = Array.isArray(payload?.[category]) ? payload[category] : [];
        normalized[category] = source
            .map((item, index) => normalizeItem({
                ...item,
                category,
                sortOrder: Number(item?.sortOrder ?? index)
            }, `${category}-${Date.now()}-${index}`))
            .filter((item) => item.skill);
    });

    return normalized;
};

const rowToItem = (row, index = 0) => normalizeItem({
    id: row.id,
    category: row.category,
    skill: row.skill,
    level: row.level,
    sortOrder: row.sort_order ?? index,
    createdAt: row.created_at
}, row.id);

const itemToRow = (item) => ({
    id: String(item.id),
    category: normalizeCategory(item.category),
    skill: normalizeSkill(item.skill),
    level: normalizeLevel(item.level),
    sort_order: Number(item.sortOrder || 0),
    created_at: Number(item.createdAt || Date.now())
});

const rowsToExperience = (rows) => {
    const next = { frontend: [], backend: [] };
    rows.forEach((row, index) => {
        const item = rowToItem(row, index);
        next[item.category].push(item);
    });
    return next;
};

const emitExperienceUpdated = () => {
    if (typeof window === 'undefined') {
        return;
    }
    window.dispatchEvent(new CustomEvent(EXPERIENCE_UPDATED_EVENT));
};

const readExperienceFromStorage = () => {
    if (!canUseStorage) {
        return createDefaultExperience();
    }

    const raw = window.localStorage.getItem(EXPERIENCE_STORAGE_KEY);
    if (!raw) {
        const defaults = createDefaultExperience();
        window.localStorage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
    }

    try {
        return normalizeExperience(JSON.parse(raw));
    } catch {
        return createDefaultExperience();
    }
};

const writeExperienceToStorage = (experience) => {
    if (!canUseStorage) {
        return;
    }

    const payload = normalizeExperience(experience);
    window.localStorage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify(payload));
    emitExperienceUpdated();
};

const cacheExperienceToStorage = (experience) => {
    if (!canUseStorage) {
        return;
    }

    const payload = normalizeExperience(experience);
    window.localStorage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify(payload));
};

const readExperienceFromSupabase = async () => {
    const query = 'select=*&order=category.asc,sort_order.asc,created_at.asc';
    const response = await fetchWithTimeout(getSupabaseEndpoint(query), {
        method: 'GET',
        headers: createSupabaseHeaders()
    });

    if (!response.ok) {
        const message = await parseSupabaseError(response, 'Could not load experience skills right now.');
        throw new Error(message);
    }

    const rows = await response.json();
    return rowsToExperience(Array.isArray(rows) ? rows : []);
};

const readExperience = async () => {
    if (isSupabaseExperienceConfigured()) {
        const experience = await readExperienceFromSupabase();
        cacheExperienceToStorage(experience);
        return experience;
    }
    return readExperienceFromStorage();
};

const flattenExperience = (experience) => ([
    ...experience.frontend.map((item, index) => ({ ...item, category: 'frontend', sortOrder: index })),
    ...experience.backend.map((item, index) => ({ ...item, category: 'backend', sortOrder: index }))
]);

const writeExperience = async (experience) => {
    if (isSupabaseExperienceConfigured()) {
        const payload = flattenExperience(normalizeExperience(experience)).map((item) => itemToRow(item));
        const response = await fetchWithTimeout(getSupabaseEndpoint('on_conflict=id'), {
            method: 'POST',
            headers: createSupabaseHeaders({
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates'
            }),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const message = await parseSupabaseError(response, 'Could not save experience right now.');
            throw new Error(message);
        }

        cacheExperienceToStorage(experience);
        emitExperienceUpdated();
        return;
    }

    writeExperienceToStorage(experience);
};

const findItemCategory = (experience, itemId) => (
    EXPERIENCE_CATEGORIES.find((category) => experience[category].some((item) => item.id === String(itemId))) || ''
);

export const subscribeToExperience = (onData, onError) => {
    if (isSupabaseExperienceConfigured() && canUseStorage) {
        onData(readExperienceFromStorage());
    }

    const syncExperience = async () => {
        try {
            onData(await readExperience());
        } catch (error) {
            if (isSupabaseExperienceConfigured() && canUseStorage) {
                onData(readExperienceFromStorage());
            }
            if (onError) {
                onError(error);
            }
        }
    };

    syncExperience();

    const handleInTabUpdate = () => {
        syncExperience();
    };

    if (typeof window !== 'undefined') {
        window.addEventListener(EXPERIENCE_UPDATED_EVENT, handleInTabUpdate);
    }

    if (isSupabaseExperienceConfigured()) {
        const refreshTimer = setInterval(syncExperience, EXPERIENCE_REFRESH_MS);
        return () => {
            clearInterval(refreshTimer);
            if (typeof window !== 'undefined') {
                window.removeEventListener(EXPERIENCE_UPDATED_EVENT, handleInTabUpdate);
            }
        };
    }

    if (!canUseStorage) {
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener(EXPERIENCE_UPDATED_EVENT, handleInTabUpdate);
            }
        };
    }

    const handleStorage = (event) => {
        if (event.key === EXPERIENCE_STORAGE_KEY) {
            syncExperience();
        }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(EXPERIENCE_UPDATED_EVENT, handleInTabUpdate);
    };
};

export const addExperienceItem = async ({ category, skill, level }) => {
    if (!isAdminAuthenticated()) {
        throw new Error('Unauthorized admin action.');
    }

    const normalizedSkill = normalizeSkill(skill);
    if (!normalizedSkill) {
        throw new Error('Skill is required.');
    }

    const nextCategory = normalizeCategory(category);
    const current = await readExperience();
    const newItem = normalizeItem({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        category: nextCategory,
        skill: normalizedSkill,
        level: normalizeLevel(level),
        sortOrder: current[nextCategory].length,
        createdAt: Date.now()
    }, `${Date.now()}`);

    const next = {
        ...current,
        [nextCategory]: [...current[nextCategory], newItem]
    };

    await writeExperience(next);
    return newItem;
};

export const updateExperienceItem = async (itemId, updates) => {
    if (!isAdminAuthenticated()) {
        throw new Error('Unauthorized admin action.');
    }

    const targetId = String(itemId);
    const current = await readExperience();
    const currentCategory = findItemCategory(current, targetId);

    if (!currentCategory) {
        throw new Error('Experience item not found.');
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

    if (!nextItem.skill) {
        throw new Error('Skill is required.');
    }

    const next = {
        frontend: current.frontend.filter((item) => item.id !== targetId),
        backend: current.backend.filter((item) => item.id !== targetId)
    };

    next[nextCategory] = [...next[nextCategory], nextItem].map((item, index) => ({
        ...item,
        category: nextCategory,
        sortOrder: index
    }));

    await writeExperience(next);
    return nextItem;
};

export const removeExperienceItem = async (itemId) => {
    if (!isAdminAuthenticated()) {
        throw new Error('Unauthorized admin action.');
    }

    const targetId = String(itemId);
    const current = await readExperience();
    const next = {
        frontend: current.frontend.filter((item) => item.id !== targetId).map((item, index) => ({
            ...item,
            category: 'frontend',
            sortOrder: index
        })),
        backend: current.backend.filter((item) => item.id !== targetId).map((item, index) => ({
            ...item,
            category: 'backend',
            sortOrder: index
        }))
    };

    if (isSupabaseExperienceConfigured()) {
        const response = await fetchWithTimeout(getSupabaseEndpoint(`id=eq.${encodeURIComponent(targetId)}`), {
            method: 'DELETE',
            headers: createSupabaseHeaders()
        });
        if (!response.ok) {
            const message = await parseSupabaseError(response, 'Could not remove experience right now.');
            throw new Error(message);
        }
    }

    await writeExperience(next);
};

export const reorderExperienceItems = async (category, sourceItemId, targetItemId) => {
    if (!isAdminAuthenticated()) {
        throw new Error('Unauthorized admin action.');
    }

    const nextCategory = normalizeCategory(category);
    const sourceId = String(sourceItemId);
    const targetId = String(targetItemId);

    if (!sourceId || !targetId || sourceId === targetId) {
        return;
    }

    const current = await readExperience();
    const items = [...current[nextCategory]];
    const sourceIndex = items.findIndex((item) => item.id === sourceId);
    const targetIndex = items.findIndex((item) => item.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
        throw new Error('Could not reorder experience skills.');
    }

    const [movedItem] = items.splice(sourceIndex, 1);
    items.splice(targetIndex, 0, movedItem);

    const next = {
        ...current,
        [nextCategory]: items.map((item, index) => ({
            ...item,
            category: nextCategory,
            sortOrder: index
        }))
    };

    await writeExperience(next);
};
