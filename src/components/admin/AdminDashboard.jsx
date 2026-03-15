import { useEffect, useMemo, useRef, useState } from 'react';
import { addProject, removeProject, reorderProjects, subscribeToProjects, updateProject } from '../../services/projectsService';
import { subscribeToResume, updateResume } from '../../services/resumeService';
import { addExperienceItem, removeExperienceItem, reorderExperienceItems, subscribeToExperience, updateExperienceItem } from '../../services/experienceService';
import { addQualificationItem, removeQualificationItem, subscribeToQualification, updateQualificationItem } from '../../services/qualificationService';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';
import { uploadResumeToSupabase } from '../../services/supabaseStorageService';
import { loginAdmin, logoutAdmin, subscribeToAdminAuth } from '../../services/adminAuthService';
import {
    CLOUDINARY_READY,
    SUPABASE_RESUME_READY,
    MAX_IMAGE_SIZE_MB,
    MAX_IMAGE_BYTES,
    MAX_RESUME_SIZE_MB,
    MAX_RESUME_BYTES,
    initialForm,
    initialExperienceForm,
    initialQualificationForm,
    experienceLevelOptions
} from './constants';
import AdminHeader from './AdminHeader';
import AdminLoginForm from './AdminLoginForm';
import AdminResumePanel from './AdminResumePanel';
import AdminExperiencePanel from './AdminExperiencePanel';
import AdminQualificationPanel from './AdminQualificationPanel';
import AdminProjectsPanel from './AdminProjectsPanel';
import AdminToastContainer from './AdminToastContainer';
import AdminConfirmDialog from './AdminConfirmDialog';
import './admin.css';

const AdminDashboard = () => {
    const TOAST_DURATION_MS = 3200;
    const [projects, setProjects] = useState([]);
    const [resume, setResume] = useState({ url: '', fileName: 'Resume.pdf' });
    const [experience, setExperience] = useState({ frontend: [], backend: [] });
    const [qualification, setQualification] = useState({ education: [], experience: [] });
    const [authState, setAuthState] = useState({ isConfigured: false, isAuthenticated: false, email: '' });
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState('');
    const [isSavingId, setIsSavingId] = useState('');
    const [editingId, setEditingId] = useState('');
    const [isUploadingCreateImage, setIsUploadingCreateImage] = useState(false);
    const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
    const [isUploadingResume, setIsUploadingResume] = useState(false);
    const [isResumeDragOver, setIsResumeDragOver] = useState(false);
    const [isExperienceLoading, setIsExperienceLoading] = useState(true);
    const [isExperienceSubmitting, setIsExperienceSubmitting] = useState(false);
    const [isDeletingExperienceId, setIsDeletingExperienceId] = useState('');
    const [isSavingExperienceId, setIsSavingExperienceId] = useState('');
    const [editingExperienceId, setEditingExperienceId] = useState('');
    const [draggingExperienceId, setDraggingExperienceId] = useState('');
    const [dropTargetExperienceId, setDropTargetExperienceId] = useState('');
    const [isQualificationLoading, setIsQualificationLoading] = useState(true);
    const [isQualificationSubmitting, setIsQualificationSubmitting] = useState(false);
    const [isDeletingQualificationId, setIsDeletingQualificationId] = useState('');
    const [isSavingQualificationId, setIsSavingQualificationId] = useState('');
    const [editingQualificationId, setEditingQualificationId] = useState('');
    const [draggingId, setDraggingId] = useState('');
    const [dropTargetId, setDropTargetId] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [form, setForm] = useState(initialForm);
    const [editForm, setEditForm] = useState(initialForm);
    const [experienceForm, setExperienceForm] = useState(initialExperienceForm);
    const [experienceEditForm, setExperienceEditForm] = useState(initialExperienceForm);
    const [qualificationForm, setQualificationForm] = useState(initialQualificationForm);
    const [qualificationEditForm, setQualificationEditForm] = useState(initialQualificationForm);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [toasts, setToasts] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmLabel: 'Delete'
    });
    const [confirmAction, setConfirmAction] = useState(null);
    const draggingProjectIdRef = useRef('');

    useEffect(() => {
        const unsubAuth = subscribeToAdminAuth((nextState) => {
            setAuthState(nextState);
            setIsAuthLoading(false);
        });

        return () => {
            unsubAuth();
        };
    }, []);

    useEffect(() => {
        const unsubProjects = subscribeToProjects(
            (items) => {
                setProjects(items);
                setIsLoadingProjects(false);
            },
            () => {
                setError('Could not load projects right now.');
                setIsLoadingProjects(false);
            }
        );

        return () => {
            unsubProjects();
        };
    }, []);

    useEffect(() => {
        const unsubResume = subscribeToResume((nextResume) => {
            setResume(nextResume);
        });

        return () => {
            unsubResume();
        };
    }, []);

    useEffect(() => {
        const unsubExperience = subscribeToExperience(
            (nextExperience) => {
                setExperience(nextExperience);
                setIsExperienceLoading(false);
            },
            () => {
                setError('Could not load experience skills right now.');
                setIsExperienceLoading(false);
            }
        );

        return () => {
            unsubExperience();
        };
    }, []);

    useEffect(() => {
        const unsubQualification = subscribeToQualification(
            (nextQualification) => {
                setQualification(nextQualification);
                setIsQualificationLoading(false);
            },
            () => {
                setError('Could not load qualification entries right now.');
                setIsQualificationLoading(false);
            }
        );

        return () => {
            unsubQualification();
        };
    }, []);

    const parsedTags = useMemo(
        () => form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        [form.tags]
    );

    const addToast = (message, type = 'success') => {
        if (!message) {
            return;
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, TOAST_DURATION_MS);
    };

    const dismissToast = (toastId) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    };

    const openDeleteConfirm = ({ title, message, confirmLabel = 'Delete' }, action) => {
        setConfirmDialog({
            isOpen: true,
            title,
            message,
            confirmLabel
        });
        setConfirmAction(() => action);
    };

    const closeDeleteConfirm = () => {
        setConfirmDialog({
            isOpen: false,
            title: '',
            message: '',
            confirmLabel: 'Delete'
        });
        setConfirmAction(null);
    };

    const handleConfirmDelete = async () => {
        if (!confirmAction) {
            closeDeleteConfirm();
            return;
        }

        const action = confirmAction;
        closeDeleteConfirm();
        await action();
    };

    useEffect(() => {
        if (!error) {
            return;
        }
        addToast(error, 'error');
        setError('');
    }, [error]);

    useEffect(() => {
        if (!status) {
            return;
        }
        addToast(status, 'success');
        setStatus('');
    }, [status]);

    const handleAddProject = async (event) => {
        event.preventDefault();
        setError('');
        setStatus('');

        if (!form.title || !form.image || !form.github || !form.desc || parsedTags.length === 0) {
            setError('Title, image, github, description and tags are required.');
            return;
        }

        try {
            setIsSubmitting(true);
            await addProject({
                ...form,
                tags: parsedTags
            });
            setForm(initialForm);
            setStatus('Project added. It is now live on your portfolio.');
        } catch (addError) {
            setError(addError?.message || 'Could not add project right now.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProject = async (projectId) => {
        setError('');
        setStatus('');

        try {
            setIsDeletingId(projectId);
            await removeProject(projectId);
            setStatus('Project removed successfully.');
        } catch {
            setError('Could not remove project right now.');
        } finally {
            setIsDeletingId('');
        }
    };

    const requestDeleteProject = (project) => {
        openDeleteConfirm(
            {
                title: 'Delete Project?',
                message: `Are you sure you want to delete "${project.title}"? This action cannot be undone.`,
                confirmLabel: 'Delete Project'
            },
            async () => handleDeleteProject(project.id)
        );
    };

    const startEditing = (project) => {
        setError('');
        setStatus('');
        setEditingId(project.id);
        setEditForm({
            title: project.title || '',
            image: project.image || '',
            github: project.github || '',
            demo: project.demo || '',
            tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
            desc: project.desc || '',
            isNew: Boolean(project.isNew),
            isFeatured: Boolean(project.isFeatured),
            isPopular: Boolean(project.isPopular)
        });
    };

    const cancelEditing = () => {
        setEditingId('');
        setEditForm(initialForm);
    };

    const handleSaveProject = async (projectId) => {
        setError('');
        setStatus('');
        const parsedEditTags = editForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean);

        if (!editForm.title || !editForm.image || !editForm.github || !editForm.desc || parsedEditTags.length === 0) {
            setError('Title, image, github, description and tags are required.');
            return;
        }

        try {
            setIsSavingId(projectId);
            await updateProject(projectId, {
                ...editForm,
                tags: parsedEditTags
            });
            setEditingId('');
            setEditForm(initialForm);
            setStatus('Project updated successfully.');
        } catch (updateError) {
            setError(updateError?.message || 'Could not update project right now.');
        } finally {
            setIsSavingId('');
        }
    };

    const handleImageUpload = async (event, mode) => {
        const input = event.target;
        const file = input.files && input.files[0];

        if (!file) {
            return;
        }

        setError('');
        setStatus('');

        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file.');
            input.value = '';
            return;
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setError(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);
            input.value = '';
            return;
        }

        if (!CLOUDINARY_READY) {
            setError('Image upload is not configured. Set REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET.');
            input.value = '';
            return;
        }

        try {
            if (mode === 'edit') {
                setIsUploadingEditImage(true);
            } else {
                setIsUploadingCreateImage(true);
            }

            const imageUrl = await uploadImageToCloudinary(file);
            if (mode === 'edit') {
                setEditForm((prev) => ({ ...prev, image: imageUrl }));
            } else {
                setForm((prev) => ({ ...prev, image: imageUrl }));
            }
            setStatus('Image uploaded successfully.');
        } catch (uploadError) {
            setError(uploadError?.message || 'Could not upload image right now.');
        } finally {
            if (mode === 'edit') {
                setIsUploadingEditImage(false);
            } else {
                setIsUploadingCreateImage(false);
            }
            input.value = '';
        }
    };

    const handleProjectDragStart = (projectId, event) => {
        if (editingId) {
            return;
        }

        const sourceId = String(projectId);
        draggingProjectIdRef.current = sourceId;
        setDraggingId(sourceId);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', sourceId);
        event.dataTransfer.setData('application/x-portfolio-project-id', sourceId);
    };

    const handleProjectDragEnter = (projectId) => {
        if (editingId) {
            return;
        }
        if (dropTargetId !== projectId) {
            setDropTargetId(projectId);
        }
    };

    const handleProjectDragOver = (projectId, event) => {
        if (editingId) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        if (dropTargetId !== projectId) {
            setDropTargetId(projectId);
        }
    };

    const handleProjectDrop = async (projectId, event) => {
        if (editingId) {
            return;
        }

        event.preventDefault();
        const sourceProjectId = event.dataTransfer.getData('application/x-portfolio-project-id')
            || event.dataTransfer.getData('text/plain')
            || draggingProjectIdRef.current
            || draggingId;
        setDropTargetId('');

        if (!sourceProjectId || sourceProjectId === projectId) {
            setDraggingId('');
            draggingProjectIdRef.current = '';
            return;
        }

        setError('');
        setStatus('');

        try {
            await reorderProjects(sourceProjectId, projectId);
            setStatus('Project order updated.');
        } catch (reorderError) {
            setError(reorderError?.message || 'Could not reorder projects right now.');
        } finally {
            setDraggingId('');
            draggingProjectIdRef.current = '';
        }
    };

    const handleProjectDragEnd = () => {
        setDraggingId('');
        setDropTargetId('');
        draggingProjectIdRef.current = '';
    };

    const handleResumeFile = async (file) => {
        if (!file) {
            return;
        }

        setError('');
        setStatus('');

        const isPdfType = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdfType) {
            setError('Please upload a PDF file for resume.');
            return;
        }

        if (file.size > MAX_RESUME_BYTES) {
            setError(`Resume PDF must be smaller than ${MAX_RESUME_SIZE_MB}MB.`);
            return;
        }

        if (!SUPABASE_RESUME_READY) {
            setError('Supabase resume storage is not configured. Set REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY and REACT_APP_SUPABASE_RESUME_BUCKET.');
            return;
        }

        try {
            setIsUploadingResume(true);
            const resumeUrl = await uploadResumeToSupabase(file);
            await updateResume({
                url: resumeUrl,
                fileName: file.name || 'Resume.pdf'
            });
            setStatus('Resume updated successfully. Download CV is live now.');
        } catch (resumeError) {
            setError(resumeError?.message || 'Could not upload resume right now.');
        } finally {
            setIsUploadingResume(false);
            setIsResumeDragOver(false);
        }
    };

    const handleResumeInputChange = async (event) => {
        const input = event.target;
        const file = input.files && input.files[0];

        await handleResumeFile(file);
        input.value = '';
    };

    const handleResumeDragOver = (event) => {
        event.preventDefault();
        if (!isUploadingResume) {
            setIsResumeDragOver(true);
        }
    };

    const handleResumeDragLeave = (event) => {
        event.preventDefault();
        setIsResumeDragOver(false);
    };

    const handleResumeDrop = async (event) => {
        event.preventDefault();
        setIsResumeDragOver(false);
        if (isUploadingResume) {
            return;
        }

        const file = event.dataTransfer?.files?.[0];
        await handleResumeFile(file);
    };

    const handleAddExperience = async (event) => {
        event.preventDefault();
        setError('');
        setStatus('');

        if (!experienceForm.skill.trim()) {
            setError('Skill name is required.');
            return;
        }

        try {
            setIsExperienceSubmitting(true);
            await addExperienceItem(experienceForm);
            setExperienceForm((prev) => ({ ...prev, skill: '' }));
            setStatus('Experience skill added successfully.');
        } catch (experienceError) {
            setError(experienceError?.message || 'Could not add experience right now.');
        } finally {
            setIsExperienceSubmitting(false);
        }
    };

    const startEditingExperience = (item, category) => {
        setError('');
        setStatus('');
        setEditingExperienceId(item.id);
        setExperienceEditForm({
            category,
            skill: item.skill || '',
            level: item.level || 'Intermediate'
        });
    };

    const cancelEditingExperience = () => {
        setEditingExperienceId('');
        setExperienceEditForm(initialExperienceForm);
    };

    const handleSaveExperience = async (itemId) => {
        setError('');
        setStatus('');

        if (!experienceEditForm.skill.trim()) {
            setError('Skill name is required.');
            return;
        }

        try {
            setIsSavingExperienceId(itemId);
            await updateExperienceItem(itemId, experienceEditForm);
            setEditingExperienceId('');
            setExperienceEditForm(initialExperienceForm);
            setStatus('Experience skill updated successfully.');
        } catch (experienceError) {
            setError(experienceError?.message || 'Could not update experience right now.');
        } finally {
            setIsSavingExperienceId('');
        }
    };

    const handleDeleteExperience = async (itemId) => {
        setError('');
        setStatus('');

        try {
            setIsDeletingExperienceId(itemId);
            await removeExperienceItem(itemId);
            if (editingExperienceId === itemId) {
                cancelEditingExperience();
            }
            setStatus('Experience skill removed successfully.');
        } catch (experienceError) {
            setError(experienceError?.message || 'Could not remove experience right now.');
        } finally {
            setIsDeletingExperienceId('');
        }
    };

    const requestDeleteExperience = (item) => {
        openDeleteConfirm(
            {
                title: 'Delete Skill?',
                message: `Delete "${item.skill}" from your experience list? This action cannot be undone.`,
                confirmLabel: 'Delete Skill'
            },
            async () => handleDeleteExperience(item.id)
        );
    };

    const findExperienceCategoryById = (itemId) => {
        const targetId = String(itemId);
        if (experience.frontend.some((item) => item.id === targetId)) {
            return 'frontend';
        }
        if (experience.backend.some((item) => item.id === targetId)) {
            return 'backend';
        }
        return '';
    };

    const handleExperienceDragStart = (itemId, category, event) => {
        if (editingExperienceId) {
            return;
        }

        const payload = JSON.stringify({ id: itemId, category });
        setDraggingExperienceId(itemId);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', payload);
    };

    const handleExperienceDragOver = (itemId, event) => {
        if (editingExperienceId) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (dropTargetExperienceId !== itemId) {
            setDropTargetExperienceId(itemId);
        }
    };

    const handleExperienceDrop = async (targetItemId, targetCategory, event) => {
        if (editingExperienceId) {
            return;
        }

        event.preventDefault();
        setDropTargetExperienceId('');

        let sourceItemId = draggingExperienceId;
        let sourceCategory = findExperienceCategoryById(draggingExperienceId);
        const rawPayload = event.dataTransfer.getData('text/plain');

        if (rawPayload) {
            try {
                const parsed = JSON.parse(rawPayload);
                sourceItemId = String(parsed?.id || sourceItemId);
                sourceCategory = String(parsed?.category || sourceCategory);
            } catch {
                sourceItemId = rawPayload || sourceItemId;
            }
        }

        if (!sourceItemId || sourceItemId === targetItemId) {
            setDraggingExperienceId('');
            return;
        }

        if (sourceCategory !== targetCategory) {
            setError('Drag to reorder works within the same category column.');
            setDraggingExperienceId('');
            return;
        }

        setError('');
        setStatus('');

        try {
            await reorderExperienceItems(targetCategory, sourceItemId, targetItemId);
            setStatus('Experience order updated.');
        } catch (reorderError) {
            setError(reorderError?.message || 'Could not reorder experience right now.');
        } finally {
            setDraggingExperienceId('');
        }
    };

    const handleExperienceDragEnd = () => {
        setDraggingExperienceId('');
        setDropTargetExperienceId('');
    };

    const handleAddQualification = async (event) => {
        event.preventDefault();
        setError('');
        setStatus('');

        if (!qualificationForm.title.trim() || !qualificationForm.subtitle.trim() || !qualificationForm.period.trim()) {
            setError('Title, subtitle and period are required.');
            return;
        }

        try {
            setIsQualificationSubmitting(true);
            await addQualificationItem(qualificationForm);
            setQualificationForm((prev) => ({ ...prev, title: '', subtitle: '', period: '' }));
            setStatus('Qualification entry added successfully.');
        } catch (qualificationError) {
            setError(qualificationError?.message || 'Could not add qualification right now.');
        } finally {
            setIsQualificationSubmitting(false);
        }
    };

    const startEditingQualification = (item, category) => {
        setError('');
        setStatus('');
        setEditingQualificationId(item.id);
        setQualificationEditForm({
            category,
            title: item.title || '',
            subtitle: item.subtitle || '',
            period: item.period || ''
        });
    };

    const cancelEditingQualification = () => {
        setEditingQualificationId('');
        setQualificationEditForm(initialQualificationForm);
    };

    const handleSaveQualification = async (itemId) => {
        setError('');
        setStatus('');

        if (!qualificationEditForm.title.trim() || !qualificationEditForm.subtitle.trim() || !qualificationEditForm.period.trim()) {
            setError('Title, subtitle and period are required.');
            return;
        }

        try {
            setIsSavingQualificationId(itemId);
            await updateQualificationItem(itemId, qualificationEditForm);
            setEditingQualificationId('');
            setQualificationEditForm(initialQualificationForm);
            setStatus('Qualification entry updated successfully.');
        } catch (qualificationError) {
            setError(qualificationError?.message || 'Could not update qualification right now.');
        } finally {
            setIsSavingQualificationId('');
        }
    };

    const handleDeleteQualification = async (itemId) => {
        setError('');
        setStatus('');

        try {
            setIsDeletingQualificationId(itemId);
            await removeQualificationItem(itemId);
            if (editingQualificationId === itemId) {
                cancelEditingQualification();
            }
            setStatus('Qualification entry removed successfully.');
        } catch (qualificationError) {
            setError(qualificationError?.message || 'Could not remove qualification right now.');
        } finally {
            setIsDeletingQualificationId('');
        }
    };

    const requestDeleteQualification = (item) => {
        openDeleteConfirm(
            {
                title: 'Delete Qualification Entry?',
                message: `Delete "${item.title}" from your timeline? This action cannot be undone.`,
                confirmLabel: 'Delete Entry'
            },
            async () => handleDeleteQualification(item.id)
        );
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        setError('');
        setStatus('');

        try {
            setIsSubmitting(true);
            await loginAdmin({
                email: credentials.email,
                password: credentials.password
            });
            setCredentials((prev) => ({ ...prev, password: '' }));
            setStatus('Login successful.');
        } catch (loginError) {
            setError(loginError?.message || 'Invalid email or password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        logoutAdmin();
        setStatus('Logged out successfully.');
        setError('');
        setCredentials((prev) => ({ ...prev, password: '' }));
    };

    const renderAdminContent = () => (
        <div className='admin-layout-sections'>
            <AdminProjectsPanel
                form={form}
                setForm={setForm}
                editForm={editForm}
                setEditForm={setEditForm}
                isSubmitting={isSubmitting}
                isDeletingId={isDeletingId}
                isSavingId={isSavingId}
                editingId={editingId}
                isUploadingCreateImage={isUploadingCreateImage}
                isUploadingEditImage={isUploadingEditImage}
                draggingId={draggingId}
                dropTargetId={dropTargetId}
                projects={projects}
                isLoadingProjects={isLoadingProjects}
                cloudinaryReady={CLOUDINARY_READY}
                onAddProject={handleAddProject}
                onImageUpload={handleImageUpload}
                onProjectDragStart={handleProjectDragStart}
                onProjectDragEnter={handleProjectDragEnter}
                onProjectDragOver={handleProjectDragOver}
                onProjectDrop={handleProjectDrop}
                onProjectDragEnd={handleProjectDragEnd}
                onSaveProject={handleSaveProject}
                onCancelEditing={cancelEditing}
                onStartEditing={startEditing}
                onRequestDeleteProject={requestDeleteProject}
            />

            <AdminResumePanel
                resume={resume}
                isResumeDragOver={isResumeDragOver}
                isUploadingResume={isUploadingResume}
                onDragOver={handleResumeDragOver}
                onDragLeave={handleResumeDragLeave}
                onDrop={handleResumeDrop}
                onInputChange={handleResumeInputChange}
                supabaseReady={SUPABASE_RESUME_READY}
                maxResumeSizeMb={MAX_RESUME_SIZE_MB}
            />

            <AdminExperiencePanel
                experienceForm={experienceForm}
                setExperienceForm={setExperienceForm}
                experienceLevelOptions={experienceLevelOptions}
                isExperienceSubmitting={isExperienceSubmitting}
                onAddExperience={handleAddExperience}
                isExperienceLoading={isExperienceLoading}
                experience={experience}
                editingExperienceId={editingExperienceId}
                experienceEditForm={experienceEditForm}
                setExperienceEditForm={setExperienceEditForm}
                onSaveExperience={handleSaveExperience}
                isSavingExperienceId={isSavingExperienceId}
                onCancelEditingExperience={cancelEditingExperience}
                onStartEditingExperience={startEditingExperience}
                isDeletingExperienceId={isDeletingExperienceId}
                onRequestDeleteExperience={requestDeleteExperience}
                draggingExperienceId={draggingExperienceId}
                dropTargetExperienceId={dropTargetExperienceId}
                onExperienceDragStart={handleExperienceDragStart}
                onExperienceDragOver={handleExperienceDragOver}
                onExperienceDrop={handleExperienceDrop}
                onExperienceDragEnd={handleExperienceDragEnd}
            />

            <AdminQualificationPanel
                qualificationForm={qualificationForm}
                setQualificationForm={setQualificationForm}
                isQualificationSubmitting={isQualificationSubmitting}
                onAddQualification={handleAddQualification}
                isQualificationLoading={isQualificationLoading}
                qualification={qualification}
                editingQualificationId={editingQualificationId}
                qualificationEditForm={qualificationEditForm}
                setQualificationEditForm={setQualificationEditForm}
                onSaveQualification={handleSaveQualification}
                isSavingQualificationId={isSavingQualificationId}
                onCancelEditingQualification={cancelEditingQualification}
                onStartEditingQualification={startEditingQualification}
                isDeletingQualificationId={isDeletingQualificationId}
                onRequestDeleteQualification={requestDeleteQualification}
            />
        </div>
    );

    return (
        <main className='admin-page'>
            <section className='container admin-shell'>
                <AdminHeader authState={authState} onLogout={handleLogout} />

                {isAuthLoading
                    ? <p className='admin-info'>Loading auth...</p>
                    : (authState.isAuthenticated ? renderAdminContent() : (
                        <AdminLoginForm
                            authState={authState}
                            credentials={credentials}
                            setCredentials={setCredentials}
                            isSubmitting={isSubmitting}
                            onSubmit={handleLogin}
                        />
                    ))}
            </section>
            <AdminToastContainer toasts={toasts} onDismiss={dismissToast} />
            <AdminConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmLabel={confirmDialog.confirmLabel}
                onConfirm={handleConfirmDelete}
                onCancel={closeDeleteConfirm}
            />
        </main>
    );
};

export default AdminDashboard;
