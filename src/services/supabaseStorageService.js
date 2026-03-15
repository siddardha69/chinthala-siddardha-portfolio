const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_RESUME_BUCKET = process.env.REACT_APP_SUPABASE_RESUME_BUCKET || 'resumes';
const SUPABASE_RESUME_FOLDER = process.env.REACT_APP_SUPABASE_RESUME_FOLDER || 'portfolio';

const getBaseUrl = () => String(SUPABASE_URL || '').replace(/\/$/, '');

const sanitizeFileName = (fileName) => (
    String(fileName || 'Resume.pdf')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9._-]/g, '')
        || 'Resume.pdf'
);

const encodePath = (path) => path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

export const isSupabaseResumeConfigured = () => Boolean(getBaseUrl() && SUPABASE_ANON_KEY && SUPABASE_RESUME_BUCKET);

export const uploadResumeToSupabase = async (file) => {
    if (!file) {
        throw new Error('No resume file provided.');
    }

    if (!isSupabaseResumeConfigured()) {
        throw new Error('Supabase resume storage is not configured.');
    }

    const baseUrl = getBaseUrl();
    const safeName = sanitizeFileName(file.name);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const objectPath = `${SUPABASE_RESUME_FOLDER}/${uniqueName}`;
    const uploadUrl = `${baseUrl}/storage/v1/object/${encodePath(SUPABASE_RESUME_BUCKET)}/${encodePath(objectPath)}`;

    const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': file.type || 'application/pdf'
        },
        body: file
    });

    let json = null;
    try {
        json = await response.json();
    } catch {
        json = null;
    }

    if (!response.ok) {
        const message = json?.message || json?.error || 'Supabase upload failed.';
        throw new Error(message);
    }

    return `${baseUrl}/storage/v1/object/public/${encodePath(SUPABASE_RESUME_BUCKET)}/${encodePath(objectPath)}`;
};
