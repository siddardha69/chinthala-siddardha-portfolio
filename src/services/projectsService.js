import defaultProjects from '../data/defaultProjects';
import { isAdminAuthenticated } from './adminAuthService';

const PROJECTS_STORAGE_KEY = 'portfolio_projects_v1';
const SUPABASE_PROJECTS_CACHE_KEY = 'portfolio_projects_supabase_cache_v1';
const PROJECTS_UPDATED_EVENT = 'portfolio-projects-updated';
const PROJECTS_REFRESH_MS = 30000;
const FETCH_TIMEOUT_MS = 8000;
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_PROJECTS_TABLE = process.env.REACT_APP_SUPABASE_PROJECTS_TABLE || 'portfolio_projects';

const normalizeProject = (project, fallbackId = String(Date.now())) => ({
    id: String(project.id || fallbackId),
    title: project.title || 'Untitled Project',
    image: project.image || '',
    github: project.github || '',
    demo: project.demo || '',
    tags: Array.isArray(project.tags) ? project.tags : [],
    desc: project.desc || '',
    isNew: Boolean(project.isNew),
    isFeatured: Boolean(project.isFeatured),
    isPopular: Boolean(project.isPopular),
    createdAt: Number(project.createdAt || Date.now()),
    sortOrder: Number(project.sortOrder || 0)
});

const canUseStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const getBaseUrl = () => String(SUPABASE_URL || '').replace(/\/$/, '');
const isSupabaseProjectsConfigured = () => Boolean(getBaseUrl() && SUPABASE_ANON_KEY && SUPABASE_PROJECTS_TABLE);

const createSupabaseHeaders = (extra = {}) => ({
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra
});

const projectToRow = (project) => ({
    id: String(project.id),
    title: project.title || 'Untitled Project',
    image: project.image || '',
    github: project.github || '',
    demo: project.demo || '',
    tags: Array.isArray(project.tags) ? project.tags : [],
    desc: project.desc || '',
    is_new: Boolean(project.isNew),
    is_featured: Boolean(project.isFeatured),
    is_popular: Boolean(project.isPopular),
    created_at: Number(project.createdAt || Date.now()),
    sort_order: Number(project.sortOrder || 0)
});

const rowToProject = (row, index = 0) => normalizeProject({
    id: row.id,
    title: row.title,
    image: row.image,
    github: row.github,
    demo: row.demo,
    tags: Array.isArray(row.tags) ? row.tags : [],
    desc: row.desc,
    isNew: row.is_new,
    isFeatured: row.is_featured,
    isPopular: row.is_popular,
    createdAt: row.created_at,
    sortOrder: row.sort_order ?? index
}, row.id);

const getSupabaseProjectsEndpoint = (query = '') => {
    const encodedTable = encodeURIComponent(SUPABASE_PROJECTS_TABLE);
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
            throw new Error('Could not load projects right now.');
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
};

const readProjectsFromStorage = () => {
    if (!canUseStorage) {
        return defaultProjects.map((project, index) => normalizeProject({
            ...project,
            sortOrder: index
        }, project.id));
    }

    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);

    if (!raw) {
        const initialProjects = defaultProjects.map((project, index) => normalizeProject({
            ...project,
            sortOrder: index
        }, project.id));
        window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(initialProjects));
        return initialProjects;
    }

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.map((project, index) => normalizeProject({
            ...project,
            sortOrder: Number(project?.sortOrder ?? index)
        }, `${Date.now()}-${index}`));
    } catch {
        return [];
    }
};

const writeProjectsToStorage = (projects) => {
    if (!canUseStorage) {
        return;
    }

    try {
        window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
        if (error && error.name === 'QuotaExceededError') {
            throw new Error('Storage limit reached. Try using smaller images or fewer projects.');
        }
        throw error;
    }
};

const readSupabaseProjectsCache = () => {
    if (!canUseStorage) {
        return [];
    }

    const raw = window.localStorage.getItem(SUPABASE_PROJECTS_CACHE_KEY);
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.map((project, index) => normalizeProject({
            ...project,
            sortOrder: Number(project?.sortOrder ?? index)
        }, `${Date.now()}-cache-${index}`));
    } catch {
        return [];
    }
};

const getImmediateProjectsForSupabase = () => {
    const cachedProjects = readSupabaseProjectsCache();
    if (cachedProjects.length > 0) {
        return cachedProjects;
    }

    const localProjects = readProjectsFromStorage();
    if (localProjects.length > 0) {
        return localProjects;
    }

    return [];
};

const writeSupabaseProjectsCache = (projects) => {
    if (!canUseStorage) {
        return;
    }

    try {
        window.localStorage.setItem(SUPABASE_PROJECTS_CACHE_KEY, JSON.stringify(projects));
    } catch {
    }
};

const readProjectsFromSupabase = async () => {
    const query = 'select=id,title,image,github,demo,tags,desc,is_new,is_featured,is_popular,created_at,sort_order&order=sort_order.asc,created_at.desc';
    const response = await fetchWithTimeout(getSupabaseProjectsEndpoint(query), {
        method: 'GET',
        headers: createSupabaseHeaders()
    });

    if (!response.ok) {
        const message = await parseSupabaseError(response, 'Could not load projects right now.');
        throw new Error(message);
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) {
        return [];
    }

    const projects = rows.map((row, index) => rowToProject(row, index));
    writeSupabaseProjectsCache(projects);
    return projects;
};

const updateProjectSortOrders = async (projects) => {
    const payload = projects.map((project, index) => projectToRow({
        ...project,
        sortOrder: index
    }));

    const response = await fetch(getSupabaseProjectsEndpoint('on_conflict=id'), {
        method: 'POST',
        headers: createSupabaseHeaders({
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates'
        }),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const message = await parseSupabaseError(response, 'Could not reorder projects.');
        throw new Error(message);
    }
};

const emitProjectsUpdated = (projects) => {
    if (typeof window === 'undefined') {
        return;
    }
    window.dispatchEvent(new CustomEvent(PROJECTS_UPDATED_EVENT, { detail: projects }));
};

const readProjects = async () => {
    if (isSupabaseProjectsConfigured()) {
        return readProjectsFromSupabase();
    }
    return readProjectsFromStorage();
};

const writeProjects = async (projects) => {
    if (isSupabaseProjectsConfigured()) {
        await updateProjectSortOrders(projects);
        emitProjectsUpdated(projects);
        return;
    }

    writeProjectsToStorage(projects);
    emitProjectsUpdated(projects);
};

export const subscribeToProjects = (onData, onError, options = {}) => {
    const autoRefresh = options.autoRefresh !== false;
    const refreshMs = Number(options.refreshMs) || PROJECTS_REFRESH_MS;

    if (isSupabaseProjectsConfigured()) {
        const immediateProjects = getImmediateProjectsForSupabase();
        if (immediateProjects.length > 0) {
            onData(immediateProjects);
        }
    }

    let isSyncing = false;

    const syncProjects = async () => {
        if (isSyncing) {
            return;
        }

        isSyncing = true;

        try {
            onData(await readProjects());
        } catch (error) {
            if (isSupabaseProjectsConfigured()) {
                const cachedProjects = readSupabaseProjectsCache();
                if (cachedProjects.length > 0) {
                    onData(cachedProjects);
                    return;
                }
            }

            if (onError) {
                onError(error);
            }
        } finally {
            isSyncing = false;
        }
    };

    syncProjects();

    const handleInTabUpdate = () => {
        syncProjects();
    };

    if (typeof window !== 'undefined') {
        window.addEventListener(PROJECTS_UPDATED_EVENT, handleInTabUpdate);
    }

    if (isSupabaseProjectsConfigured() && autoRefresh) {
        const refreshTimer = setInterval(syncProjects, Math.max(15000, refreshMs));

        return () => {
            clearInterval(refreshTimer);
            if (typeof window !== 'undefined') {
                window.removeEventListener(PROJECTS_UPDATED_EVENT, handleInTabUpdate);
            }
        };
    }

    if (!canUseStorage) {
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener(PROJECTS_UPDATED_EVENT, handleInTabUpdate);
            }
        };
    }

    const handleStorage = (event) => {
        if (event.key === PROJECTS_STORAGE_KEY) {
            syncProjects();
        }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(PROJECTS_UPDATED_EVENT, handleInTabUpdate);
    };
};

export const addProject = async (project) => {
    if (!isAdminAuthenticated()) {
        throw new Error('Unauthorized admin action.');
    }

    const current = await readProjects();
    const topSortOrder = current.length > 0 ? Math.min(...current.map((item) => Number(item.sortOrder || 0))) - 1 : 0;
    const payload = normalizeProject({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: project.title,
        image: project.image,
        github: project.github,
        demo: project.demo,
        tags: project.tags,
        desc: project.desc,
        isNew: Boolean(project.isNew),
        isFeatured: Boolean(project.isFeatured),
        isPopular: Boolean(project.isPopular),
        createdAt: Date.now(),
        sortOrder: topSortOrder
    });

    if (isSupabaseProjectsConfigured()) {
        const response = await fetch(getSupabaseProjectsEndpoint(), {
            method: 'POST',
            headers: createSupabaseHeaders({
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
            }),
            body: JSON.stringify(projectToRow(payload))
        });

        if (!response.ok) {
            const message = await parseSupabaseError(response, 'Could not add project right now.');
            throw new Error(message);
        }

        const rows = await response.json();
        const created = Array.isArray(rows) && rows[0] ? rowToProject(rows[0]) : payload;
        emitProjectsUpdated([created, ...current]);
        return created;
    }

    const next = [payload, ...current];
    await writeProjects(next);
    return payload;
};

export const updateProject = async (projectId, project) => {
    if (!isAdminAuthenticated()) {
        throw new Error('Unauthorized admin action.');
    }

    const targetId = String(projectId);
    const current = await readProjects();
    const existing = current.find((item) => item.id === targetId);

    if (!existing) {
        throw new Error('Project not found.');
    }

    const updatedProject = normalizeProject({
        ...existing,
        ...project,
        id: existing.id,
        createdAt: existing.createdAt,
        sortOrder: existing.sortOrder
    }, existing.id);

    if (isSupabaseProjectsConfigured()) {
        const response = await fetch(getSupabaseProjectsEndpoint(`id=eq.${encodeURIComponent(targetId)}`), {
            method: 'PATCH',
            headers: createSupabaseHeaders({
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
            }),
            body: JSON.stringify(projectToRow(updatedProject))
        });

        if (!response.ok) {
            const message = await parseSupabaseError(response, 'Could not update project right now.');
            throw new Error(message);
        }

        const rows = await response.json();
        const saved = Array.isArray(rows) && rows[0] ? rowToProject(rows[0]) : updatedProject;
        const next = current.map((item) => (item.id === targetId ? saved : item));
        emitProjectsUpdated(next);
        return saved;
    }

    const next = current.map((item) => (item.id === targetId ? updatedProject : item));
    await writeProjects(next);
    return updatedProject;
};

export const removeProject = async (projectId) => {
    if (!isAdminAuthenticated()) {
        throw new Error('Unauthorized admin action.');
    }

    const targetId = String(projectId);
    const current = await readProjects();

    if (isSupabaseProjectsConfigured()) {
        const response = await fetch(getSupabaseProjectsEndpoint(`id=eq.${encodeURIComponent(targetId)}`), {
            method: 'DELETE',
            headers: createSupabaseHeaders()
        });

        if (!response.ok) {
            const message = await parseSupabaseError(response, 'Could not remove project right now.');
            throw new Error(message);
        }

        const next = current.filter((project) => project.id !== targetId);
        emitProjectsUpdated(next);
        return;
    }

    const next = current.filter((project) => project.id !== targetId);
    await writeProjects(next);
};

export const reorderProjects = async (sourceProjectId, targetProjectId) => {
    if (!isAdminAuthenticated()) {
        throw new Error('Unauthorized admin action.');
    }

    const sourceId = String(sourceProjectId);
    const targetId = String(targetProjectId);

    if (!sourceId || !targetId || sourceId === targetId) {
        return readProjects();
    }

    const current = await readProjects();
    const sourceIndex = current.findIndex((project) => project.id === sourceId);
    const targetIndex = current.findIndex((project) => project.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) {
        throw new Error('Could not reorder projects.');
    }

    const next = [...current];
    const [movedProject] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, movedProject);

    const normalizedOrder = next.map((item, index) => normalizeProject({
        ...item,
        sortOrder: index
    }, item.id));

    if (isSupabaseProjectsConfigured()) {
        await updateProjectSortOrders(normalizedOrder);
        emitProjectsUpdated(normalizedOrder);
        return normalizedOrder;
    }

    await writeProjects(normalizedOrder);
    return normalizedOrder;
};
