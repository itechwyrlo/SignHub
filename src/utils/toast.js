// File: src/utils/toast.js

export const toast = (() => {
    let containerEl = null;
    const activeToasts = new Map();
    let toastIdCounter = 0;

    // Toast type configurations
    const toastTypes = {
        success: {
            icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
                <path d="M6 10L8.5 12.5L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            bgColor: '#d1f4e0',
            borderColor: '#48c774',
            textColor: '#2d6a3e',
            iconColor: '#48c774'
        },
        warning: {
            icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
                <path d="M10 6V11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="10" cy="14" r="0.5" fill="currentColor"/>
            </svg>`,
            bgColor: '#fff4e5',
            borderColor: '#f39c12',
            textColor: '#8b5a00',
            iconColor: '#f39c12'
        },
        error: {
            icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
                <path d="M13 7L7 13M7 7L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
            bgColor: '#ffe5e5',
            borderColor: '#e74c3c',
            textColor: '#c0392b',
            iconColor: '#e74c3c'
        },
        info: {
            icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
                <circle cx="10" cy="6" r="0.5" fill="currentColor"/>
                <path d="M10 9V14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
            bgColor: '#e3f2fd',
            borderColor: '#3498db',
            textColor: '#1565c0',
            iconColor: '#3498db'
        }
    };

    // Build container for toasts
    const buildContainer = () => {
        if (!containerEl) {
            containerEl = document.createElement('div');
            containerEl.className = 'toast-container';
            containerEl.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 420px;
                pointer-events: none;
            `;
            document.body.appendChild(containerEl);
        }
    };

    // Create toast element
    const createToast = (message, type, options = {}) => {
        const toastId = ++toastIdCounter;
        const config = toastTypes[type] || toastTypes.info;
        
        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;
        toastEl.setAttribute('data-toast-id', toastId);
        toastEl.style.cssText = `
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            background-color: ${config.bgColor};
            border-left: 4px solid ${config.borderColor};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            min-width: 320px;
            max-width: 420px;
            pointer-events: auto;
            animation: slideIn 0.3s ease-out;
            transition: all 0.3s ease;
        `;

        // Icon
        const iconEl = document.createElement('div');
        iconEl.className = 'toast-icon';
        iconEl.innerHTML = config.icon;
        iconEl.style.cssText = `
            flex-shrink: 0;
            color: ${config.iconColor};
            margin-top: 2px;
        `;

        // Content
        const contentEl = document.createElement('div');
        contentEl.className = 'toast-content';
        contentEl.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

        // Title
        if (options.title !== false) {
            const titleEl = document.createElement('div');
            titleEl.className = 'toast-title';
            titleEl.textContent = options.title || type.charAt(0).toUpperCase() + type.slice(1);
            titleEl.style.cssText = `
                font-weight: 600;
                font-size: 14px;
                color: ${config.textColor};
                line-height: 1.4;
            `;
            contentEl.appendChild(titleEl);
        }

        // Message
        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.innerHTML = message;
        messageEl.style.cssText = `
            font-size: 13px;
            color: ${config.textColor};
            line-height: 1.5;
            opacity: 0.9;
        `;
        contentEl.appendChild(messageEl);

        // Buttons (if required)
        if (options.showButtons) {
            const buttonsEl = document.createElement('div');
            buttonsEl.className = 'toast-buttons';
            buttonsEl.style.cssText = `
                display: flex;
                gap: 8px;
                margin-top: 8px;
            `;

            const okBtn = document.createElement('button');
            okBtn.textContent = 'OK';
            okBtn.className = 'toast-btn toast-btn-ok';
            okBtn.style.cssText = `
                padding: 6px 16px;
                background-color: ${config.borderColor};
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: opacity 0.2s;
            `;
            okBtn.onmouseover = () => okBtn.style.opacity = '0.8';
            okBtn.onmouseout = () => okBtn.style.opacity = '1';
            okBtn.onclick = () => {
                if (options.onOk) options.onOk();
                removeToast(toastId);
            };

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.className = 'toast-btn toast-btn-cancel';
            cancelBtn.style.cssText = `
                padding: 6px 16px;
                background-color: transparent;
                color: ${config.textColor};
                border: 1px solid ${config.borderColor};
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            `;
            cancelBtn.onmouseover = () => cancelBtn.style.backgroundColor = 'rgba(0,0,0,0.05)';
            cancelBtn.onmouseout = () => cancelBtn.style.backgroundColor = 'transparent';
            cancelBtn.onclick = () => {
                if (options.onCancel) options.onCancel();
                removeToast(toastId);
            };

            buttonsEl.appendChild(okBtn);
            buttonsEl.appendChild(cancelBtn);
            contentEl.appendChild(buttonsEl);
        }

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            flex-shrink: 0;
            background: none;
            border: none;
            font-size: 24px;
            line-height: 1;
            color: ${config.textColor};
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.6;
            transition: opacity 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseout = () => closeBtn.style.opacity = '0.6';
        closeBtn.onclick = () => removeToast(toastId);

        // Assemble toast
        toastEl.appendChild(iconEl);
        toastEl.appendChild(contentEl);
        toastEl.appendChild(closeBtn);

        return { toastEl, toastId };
    };

    // Remove toast with animation
    const removeToast = (toastId) => {
        const toastEl = containerEl?.querySelector(`[data-toast-id="${toastId}"]`);
        if (toastEl) {
            toastEl.style.animation = 'slideOut 0.3s ease-out';
            toastEl.style.opacity = '0';
            toastEl.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                toastEl.remove();
                activeToasts.delete(toastId);
                
                // Remove container if no toasts
                if (containerEl && activeToasts.size === 0) {
                    containerEl.remove();
                    containerEl = null;
                }
            }, 300);
        }
    };

    // Add CSS animations
    const addStyles = () => {
        if (!document.getElementById('toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                
                @media (max-width: 640px) {
                    .toast-container {
                        left: 20px;
                        right: 20px;
                        max-width: none !important;
                    }
                    
                    .toast {
                        min-width: 100% !important;
                        max-width: 100% !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };

    // Show toast
    const show = (message, type = 'info', options = {}) => {
        buildContainer();
        addStyles();

        const { toastEl, toastId } = createToast(message, type, options);
        containerEl.appendChild(toastEl);
        activeToasts.set(toastId, toastEl);

        // Auto-hide if no buttons
        if (!options.showButtons) {
            const duration = options.duration || 5000;
            setTimeout(() => removeToast(toastId), duration);
        }

        return toastId;
    };

    // Convenience methods
    const success = (message, options = {}) => show(message, 'success', options);
    const warning = (message, options = {}) => show(message, 'warning', options);
    const error = (message, options = {}) => show(message, 'error', options);
    const info = (message, options = {}) => show(message, 'info', options);

    // Confirm dialog (with OK/Cancel)
    const confirm = (message, options = {}) => {
        return new Promise((resolve) => {
            show(message, options.type || 'warning', {
                ...options,
                showButtons: true,
                onOk: () => resolve(true),
                onCancel: () => resolve(false)
            });
        });
    };

    // Close specific toast
    const close = (toastId) => removeToast(toastId);

    // Close all toasts
    const closeAll = () => {
        activeToasts.forEach((_, toastId) => removeToast(toastId));
    };

    return {
        show,
        success,
        warning,
        error,
        info,
        confirm,
        close,
        closeAll
    };
})();