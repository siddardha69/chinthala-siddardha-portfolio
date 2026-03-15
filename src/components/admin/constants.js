import { isCloudinaryConfigured } from '../../services/cloudinaryService';
import { isSupabaseResumeConfigured } from '../../services/supabaseStorageService';

export const initialForm = {
  title: '',
  image: '',
  github: '',
  demo: '',
  tags: '',
  desc: '',
  isNew: false,
  isFeatured: false,
  isPopular: false
};

export const initialExperienceForm = {
  category: 'frontend',
  skill: '',
  level: 'Intermediate'
};

export const initialQualificationForm = {
  category: 'education',
  title: '',
  subtitle: '',
  period: ''
};

export const experienceLevelOptions = ['Basic', 'Intermediate', 'Proficient'];

export const MAX_IMAGE_SIZE_MB = 1.5;
export const MAX_IMAGE_BYTES = Math.floor(MAX_IMAGE_SIZE_MB * 1024 * 1024);
export const MAX_RESUME_SIZE_MB = 5;
export const MAX_RESUME_BYTES = Math.floor(MAX_RESUME_SIZE_MB * 1024 * 1024);
export const CLOUDINARY_READY = isCloudinaryConfigured();
export const SUPABASE_RESUME_READY = isSupabaseResumeConfigured();
