import defaultResume from '../assets/siddarth_resume.pdf';
import { isAdminAuthenticated } from './adminAuthService';

const RESUME_STORAGE_KEY = 'portfolio_resume_v1';
const RESUME_UPDATED_EVENT = 'portfolio-resume-updated';
const RESUME_REFRESH_MS = 30000;
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_RESUME_TABLE = process.env.REACT_APP_SUPABASE_RESUME_TABLE || 'portfolio_resume';

const canUseStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const getBaseUrl = () => String(SUPABASE_URL || '').replace(/\/$/, '');
const isSupabaseResumeMetaConfigured = () => Boolean(getBaseUrl() && SUPABASE_ANON_KEY && SUPABASE_RESUME_TABLE);

const createSupabaseHeaders = (extra = {}) => ({
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra
});

const getSupabaseResumeEndpoint = (query = '') => {
    const encodedTable = encodeURIComponent(SUPABASE_RESUME_TABLE);
    return `${getBaseUrl()}/rest/v1/${encodedTable}${query ? `?${query}` : ''}`;
};

const normalizeResume = (resume) => ({
    url: String(resume?.url || defaultResume).trim() || defaultResume,
    fileName: String(resume?.fileName || 'Siddartha_Resume.pdf').trim() || 'Siddartha_Resume.pdf'
});

const readResumeFromStorage = () => {
    if (!canUseStorage) {
        return normalizeResume({});
    }

    const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);
    if (!raw) {
        return normalizeResume({});
    }

    try {
        return normalizeResume(JSON.parse(raw));
    } catch {
        return normalizeResume({});
    }
};

const writeResumeToStorage = (resume) => {
    if (!canUseStorage) {
        return;
    }

    const payload = normalizeResume(resume);
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(RESUME_UPDATED_EVENT, { detail: payload }));
};

const readResumeFromSupabase = async () => {
    const query = 'select=id,url,file_name&order=updated_at.desc&limit=1';
    const response = await fetch(getSupabaseResumeEndpoint(query), {
        method: 'GET',
        headers: createSupabaseHeaders()
    });

    if (!response.ok) {
        throw new Error('Could not load resume right now.');
    }

    const rows = await response.json();
    const row = Array.isArray(rows) && rows[0] ? rows[0] : null;

    if (!row) {
        return normalizeResume({});
    }

    return normalizeResume({
        url: row.url,
        fileName: row.file_name
    });
};

const emitResumeUpdated = () => {
    if (typeof window === 'undefined') {
        return;
    }
    window.dispatchEvent(new CustomEvent(RESUME_UPDATED_EVENT));
};

const readResume = async () => {
    if (isSupabaseResumeMetaConfigured()) {
        return readResumeFromSupabase();
    }
    return readResumeFromStorage();
};

export const subscribeToResume = (onData) => {
    const syncResume = async () => {
        try {
            onData(await readResume());
        } catch {
            onData(readResumeFromStorage());
        }
    };

    syncResume();

    const handleInTabUpdate = () => {
        syncResume();
    };

    if (typeof window !== 'undefined') {
        window.addEventListener(RESUME_UPDATED_EVENT, handleInTabUpdate);
    }

    if (isSupabaseResumeMetaConfigured()) {
        const refreshTimer = setInterval(syncResume, RESUME_REFRESH_MS);

        return () => {
            clearInterval(refreshTimer);
            if (typeof window !== 'undefined') {
                window.removeEventListener(RESUME_UPDATED_EVENT, handleInTabUpdate);
            }
        };
    }

    if (!canUseStorage) {
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener(RESUME_UPDATED_EVENT, handleInTabUpdate);
            }
        };
    }

    const handleStorage = (event) => {
        if (event.key === RESUME_STORAGE_KEY) {
            syncResume();
        }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(RESUME_UPDATED_EVENT, handleInTabUpdate);
    };
};

export const updateResume = async (resume) => {
    if (!isAdminAuthenticated()) {
        throw new Error('Unauthorized admin action.');
    }

    const payload = normalizeResume(resume);

    if (!payload.url) {
        throw new Error('Resume URL is required.');
    }

    if (isSupabaseResumeMetaConfigured()) {
        const body = {
            id: 'primary',
            url: payload.url,
            file_name: payload.fileName
        };

        const response = await fetch(getSupabaseResumeEndpoint('on_conflict=id'), {
            method: 'POST',
            headers: createSupabaseHeaders({
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates'
            }),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Could not update resume right now.');
        }

        emitResumeUpdated();
        return payload;
    }

    writeResumeToStorage(payload);
    return payload;
};

export const getDefaultResumeUrl = () => defaultResume;
