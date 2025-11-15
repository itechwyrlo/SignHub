// File: src/utils/loadingOverlay.js

export const loading = (() => {
    let overlayEl = null;
    let messageEl = null;
    let showCount = 0; // Reference counter to prevent blinking
    let hideTimeout = null;
    let minDisplayTime = 300; // Minimum time to show loading (ms) to prevent flickering
    let showStartTime = null;

    const buildOverlayLoading = () => {
        if (!overlayEl) {
            overlayEl = document.createElement('div');
            overlayEl.className = 'loading-overlay';
            overlayEl.style.cssText = `
                position: fixed;
                inset: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                z-index: 9999;
                backdrop-filter: blur(4px);
                background-color: rgba(255, 255, 255, 0.85);
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                pointer-events: none;
            `;

            // Spinner (just a circle)
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            spinner.style.cssText = `
                width: 3rem;
                height: 3rem;
                border: 0.35em solid rgba(0, 0, 0, 0.1);
                border-top-color: #0d6efd;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            `;

            // Add CSS keyframes dynamically for spin animation
            const styleTag = document.createElement('style');
            styleTag.id = 'loading-overlay-styles';
            if (!document.getElementById('loading-overlay-styles')) {
                styleTag.textContent = `
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(styleTag);
            }

            // Message below spinner
            messageEl = document.createElement('p');
            messageEl.className = 'loading-message';
            messageEl.textContent = 'Processing...';
            messageEl.style.cssText = `
                margin-top: 1rem;
                font-size: 1rem;
                font-weight: 500;
                color: #0d6efd;
                opacity: 0;
                transition: opacity 0.2s ease 0.1s;
            `;

            overlayEl.appendChild(spinner);
            overlayEl.appendChild(messageEl);
            document.body.appendChild(overlayEl);
        }
    };

    const show = (message = 'Loading...', useOverlay = true) => {
        buildOverlayLoading();
        
        // Increment reference counter
        showCount++;
        
        // Clear any pending hide timeout
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        // Update message
        if (messageEl) {
            messageEl.textContent = message;
        }

        // Update background
        overlayEl.style.backgroundColor = useOverlay
            ? 'rgba(255, 255, 255, 0.85)'
            : 'transparent';

        // Show overlay with fade-in
        overlayEl.style.pointerEvents = 'auto';
        overlayEl.style.visibility = 'visible';
        
        // Use requestAnimationFrame for smooth transition
        requestAnimationFrame(() => {
            overlayEl.style.opacity = '1';
            if (messageEl) {
                messageEl.style.opacity = '1';
            }
        });

        // Record show time for minimum display duration
        showStartTime = Date.now();
    };

    const hide = () => {
        if (!overlayEl) return;

        // Decrement reference counter
        showCount = Math.max(0, showCount - 1);

        // Don't hide if there are still pending show calls
        if (showCount > 0) {
            return;
        }

        // Calculate elapsed time since show
        const elapsedTime = showStartTime ? Date.now() - showStartTime : 0;
        const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

        // Clear any existing hide timeout
        if (hideTimeout) {
            clearTimeout(hideTimeout);
        }

        // Hide with fade-out, respecting minimum display time
        hideTimeout = setTimeout(() => {
            if (overlayEl && showCount === 0) {
                // Fade out
                overlayEl.style.opacity = '0';
                if (messageEl) {
                    messageEl.style.opacity = '0';
                }

                // Hide after transition completes
                setTimeout(() => {
                    if (overlayEl && showCount === 0) {
                        overlayEl.style.visibility = 'hidden';
                        overlayEl.style.pointerEvents = 'none';
                    }
                }, 300); // Match transition duration
            }
            hideTimeout = null;
        }, remainingTime);
    };

    // Force hide (for error cases)
    const forceHide = () => {
        showCount = 0;
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
        if (overlayEl) {
            overlayEl.style.opacity = '0';
            overlayEl.style.visibility = 'hidden';
            overlayEl.style.pointerEvents = 'none';
            if (messageEl) {
                messageEl.style.opacity = '0';
            }
        }
    };

    return {
        show,
        hide,
        forceHide
    };
})();