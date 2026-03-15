const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_FOLDER = process.env.REACT_APP_CLOUDINARY_FOLDER || 'portfolio-projects';

const CLOUDINARY_UPLOAD_SEGMENT = '/upload/';

const isCloudinaryDeliveryUrl = (urlObject) => (
    urlObject.hostname.includes('res.cloudinary.com')
    && urlObject.pathname.includes(CLOUDINARY_UPLOAD_SEGMENT)
);

const optimizeCloudinaryDeliveryUrl = (urlObject, width) => {
    const optimizedTransform = `f_auto,q_auto,w_${width},c_limit,dpr_auto`;

    if (urlObject.pathname.includes(`${CLOUDINARY_UPLOAD_SEGMENT}${optimizedTransform}/`)) {
        return urlObject.toString();
    }

    urlObject.pathname = urlObject.pathname.replace(
        CLOUDINARY_UPLOAD_SEGMENT,
        `${CLOUDINARY_UPLOAD_SEGMENT}${optimizedTransform}/`
    );

    return urlObject.toString();
};

const optimizeUnsplashUrl = (urlObject, width) => {
    urlObject.searchParams.set('auto', 'format');
    urlObject.searchParams.set('fit', 'crop');
    urlObject.searchParams.set('q', '70');
    urlObject.searchParams.set('w', String(width));
    return urlObject.toString();
};

export const getOptimizedProjectImageUrl = (imageUrl, options = {}) => {
    if (!imageUrl) {
        return '';
    }

    const width = Number(options.width || 600);

    try {
        const urlObject = new URL(imageUrl);

        if (isCloudinaryDeliveryUrl(urlObject)) {
            return optimizeCloudinaryDeliveryUrl(urlObject, width);
        }

        if (urlObject.hostname.includes('unsplash.com')) {
            return optimizeUnsplashUrl(urlObject, width);
        }

        return imageUrl;
    } catch {
        return imageUrl;
    }
};

export const isCloudinaryConfigured = () => Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

const uploadToCloudinary = async (file, options = {}) => {
    if (!file) {
        throw new Error('No file provided.');
    }

    if (!isCloudinaryConfigured()) {
        throw new Error('Cloudinary is not configured. Set REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET.');
    }

    const resourceType = options.resourceType || 'auto';
    const folder = options.folder;
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    const payload = new FormData();
    payload.append('file', file);
    payload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    if (folder) {
        payload.append('folder', folder);
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        body: payload
    });

    let json;
    try {
        json = await response.json();
    } catch {
        throw new Error('Cloudinary upload failed.');
    }

    if (!response.ok) {
        const message = json?.error?.message || 'Cloudinary upload failed.';
        throw new Error(message);
    }

    if (!json?.secure_url) {
        throw new Error('Cloudinary did not return a secure image URL.');
    }

    return getOptimizedProjectImageUrl(json.secure_url, { width: 900 });
};

export const uploadImageToCloudinary = async (file) => (
    uploadToCloudinary(file, {
        resourceType: 'image',
        folder: CLOUDINARY_FOLDER
    })
);
