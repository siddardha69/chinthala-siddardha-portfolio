const ADMIN_CREDENTIALS_KEY = 'portfolio_admin_credentials_v1';
const ADMIN_SESSION_KEY = 'portfolio_admin_session_v1';
const ADMIN_AUTH_EVENT = 'portfolio-admin-auth-updated';

const canUseStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const isSha256Hex = (value) => /^[a-f0-9]{64}$/i.test(String(value || '').trim());

const getEnvCredentials = () => {
    const email = process.env.REACT_APP_ADMIN_EMAIL;
    const passwordHash = process.env.REACT_APP_ADMIN_PASSWORD_HASH;

    if (email && passwordHash) {
        return {
            email: String(email).trim().toLowerCase(),
            passwordHash: String(passwordHash).trim(),
            source: 'env'
        };
    }

    return null;
};

const readLocalCredentials = () => {
    if (!canUseStorage) {
        return null;
    }

    const raw = window.localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw);
        const storedEmail = parsed?.email || parsed?.username;
        if (!storedEmail || !parsed?.passwordHash) {
            return null;
        }

        return {
            email: String(storedEmail).trim().toLowerCase(),
            passwordHash: String(parsed.passwordHash),
            source: 'local'
        };
    } catch {
        return null;
    }
};

const getActiveCredentials = () => getEnvCredentials() || readLocalCredentials();

const emitAuthChange = () => {
    if (!canUseStorage) {
        return;
    }

    window.dispatchEvent(new CustomEvent(ADMIN_AUTH_EVENT));
};

const writeSession = (email) => {
    if (!canUseStorage) {
        return;
    }

    window.localStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({ email, loggedInAt: Date.now() })
    );
};

const clearSession = () => {
    if (!canUseStorage) {
        return;
    }

    window.localStorage.removeItem(ADMIN_SESSION_KEY);
};

const readSession = () => {
    if (!canUseStorage) {
        return null;
    }

    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw);
        const sessionEmail = parsed?.email || parsed?.username;
        if (!sessionEmail) {
            return null;
        }

        return {
            email: String(sessionEmail).trim().toLowerCase(),
            loggedInAt: Number(parsed.loggedInAt || 0)
        };
    } catch {
        return null;
    }
};

const toHex = (buffer) =>
    Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');

// Lightweight SHA-256 fallback for environments where crypto.subtle is unavailable.
const sha256Fallback = (ascii) => {
    const rightRotate = (value, amount) => (value >>> amount) | (value << (32 - amount));
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let result = '';
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = [];
    let k = [];
    let primeCounter = 0;
    const isComposite = {};

    for (let candidate = 2; primeCounter < 64; candidate += 1) {
        if (!isComposite[candidate]) {
            for (let i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
            }
            hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
            k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            primeCounter += 1;
        }
    }

    ascii += '\x80';
    while ((ascii.length % 64) - 56) {
        ascii += '\x00';
    }

    for (let i = 0; i < ascii.length; i += 1) {
        const j = ascii.charCodeAt(i);
        if (j >> 8) {
            return '';
        }
        words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;

    for (let j = 0; j < words.length;) {
        const w = words.slice(j, j += 16);
        const oldHash = hash.slice(0);
        hash = hash.slice(0, 8);

        for (let i = 0; i < 64; i += 1) {
            const w15 = w[i - 15];
            const w2 = w[i - 2];
            const a = hash[0];
            const e = hash[4];
            const temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                + ((e & hash[5]) ^ ((~e) & hash[6]))
                + k[i]
                + (w[i] = (i < 16)
                    ? w[i]
                    : (w[i - 16]
                        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                        + w[i - 7]
                        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                    ) | 0);
            const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
            hash.pop();
        }

        for (let i = 0; i < 8; i += 1) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }

    for (let i = 0; i < 8; i += 1) {
        for (let j = 3; j + 1; j -= 1) {
            const b = (hash[i] >> (j * 8)) & 255;
            result += ((b < 16) ? '0' : '') + b.toString(16);
        }
    }

    return result;
};

const hashPassword = async (value) => {
    const normalizedValue = String(value || '');

    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const buffer = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(normalizedValue)
        );
        return toHex(buffer);
    }

    const fallbackHash = sha256Fallback(normalizedValue);
    return fallbackHash || normalizedValue;
};

export const hasAdminCredentials = () => Boolean(getActiveCredentials());

export const isAdminAuthenticated = () => {
    const credentials = getActiveCredentials();
    const session = readSession();

    if (!credentials || !session) {
        return false;
    }

    return session.email === credentials.email;
};

export const getAdminAuthState = () => ({
    isConfigured: hasAdminCredentials(),
    isAuthenticated: isAdminAuthenticated(),
    email: isAdminAuthenticated() ? readSession()?.email || '' : ''
});

export const loginAdmin = async ({ email, password }) => {
    const credentials = getActiveCredentials();
    if (!credentials) {
        throw new Error('Admin is not configured yet.');
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '');
    const inputHash = await hashPassword(rawPassword);

    const passwordMatches = isSha256Hex(credentials.passwordHash)
        ? inputHash === credentials.passwordHash.toLowerCase()
        : rawPassword === credentials.passwordHash;

    if (
        normalizedEmail !== credentials.email ||
        !passwordMatches
    ) {
        throw new Error('Invalid email or password.');
    }

    writeSession(credentials.email);
    emitAuthChange();
};

export const logoutAdmin = () => {
    clearSession();
    emitAuthChange();
};

export const subscribeToAdminAuth = (onData) => {
    const emit = () => {
        onData(getAdminAuthState());
    };

    emit();

    if (!canUseStorage) {
        return () => { };
    }

    const handleStorage = (event) => {
        if (
            event.key === ADMIN_CREDENTIALS_KEY ||
            event.key === ADMIN_SESSION_KEY ||
            event.key === null
        ) {
            emit();
        }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(ADMIN_AUTH_EVENT, emit);

    return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(ADMIN_AUTH_EVENT, emit);
    };
};
