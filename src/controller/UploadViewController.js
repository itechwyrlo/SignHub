import { componentManager } from "../core/ComponentManager.js";
import { ControllerBase } from "../core/ControllerBase.js";
import { Router } from "../core/router.js";
import { DocumentModel } from "../model/DocumentModel.js";
import { loading } from "../utils/loadingOverlay.js";
import { toast } from "../utils/toast.js";

export class UploadViewController extends ControllerBase {
    constructor() {
        super();
        this.documentModel = DocumentModel.getInstance();
        this.router = new Router();
        this.uploadedDocumentId = null;
        this.uploadedFileName = null;
    }

    setupConfigs() {
        this.configs = [
            {
                componentId: 'upload-form',
                model: this.documentModel,
            }
        ];
    }

    setupControls() {
        this.control({
            // Form submissions
            'upload-form': {
                'form-submit': this.handleSubmit
            },
            'send-form': {
                'form-submit': this.handleSend
            },
            
            // ✅ TabPanel lifecycle hooks
            // 'upload-tabpanel': {
            //     'beforeActivate': this.handleBeforeActivate,
            //     'afterActivate': this.handleAfterActivate,
            //     'beforeComplete': this.handleBeforeComplete,
            //     'afterComplete': this.handleAfterComplete,
            //     'success': this.handleAllStepsComplete
            // }
        });
    }

    // ============================================
    // FORM HANDLERS (Simplified - No Manual Step Management!)
    // ============================================

    handleSubmit(component, data, e) {
        loading.show('Uploading document...');
        
        this.documentModel.upload({
            file: data.file[0],
            recipientEmail: data.recipientEmail,
            recipientName: data.recipientName
        }).then(response => {
            this.uploadedDocumentId = response.documentId;
            this.uploadedFileName = response.fileName;

            toast.success(`Document ${this.uploadedFileName} uploaded successfully`);

            // Update UI
            const fileNameDisplay = document.getElementById('uploadedFileNameDisplay');
            if (fileNameDisplay) {
                fileNameDisplay.textContent = `File: ${this.uploadedFileName}`;
            }

            loading.hide();

        }).catch(error => {
            console.error('Upload failed:', error);
            toast.error(`Upload failed: ${error.message}`);
            loading.hide();
        });
    }

    handleSend(component, data, e) {
        loading.show('Sending to DocuSign...');

        this.documentModel.send({
            documentId: this.uploadedDocumentId,
            emailSubject: data.emailSubject || null,
            emailMessage: data.emailMessage || null
        }).then(response => {
            loading.hide();
            toast.success('Document sent successfully for signature!');

            // ✅ NO MANUAL STEP MANAGEMENT!
            // The 'success' lifecycle hook will handle final navigation

        }).catch(error => {
            toast.error(`Send failed: ${error.message}`);
            loading.hide();
        });
    }

    // ============================================
    // LIFECYCLE HOOKS
    // ============================================

    // /**
    //  * ✅ Before tab activation - Guard/validation logic
    //  * Return false or call e.preventDefault() to block
    //  */
    // handleBeforeActivate(component, data, e) {
    //     const { previousStep, nextStep, tabTitle } = data;
        
    //     console.log(`🔄 Attempting to switch from step ${previousStep} to ${nextStep}`);

    //     // Example: Block navigation to step 2 if no document uploaded
    //     if (nextStep === 1 && !this.uploadedDocumentId) {
    //         e.preventDefault(); // ← Block activation
    //         toast.warning('Please upload a document first!');
    //         console.warn('⚠️ Blocked: No document uploaded');
    //         return;
    //     }

    //     // Allow activation
    //     console.log('✅ Navigation allowed');
    // }

    // /**
    //  * ✅ After tab activation - Perform actions after switch
    //  */
    // handleAfterActivate(component, data, e) {
    //     const { previousStep, currentStep, tabTitle } = data;
        
    //     console.log(`✅ Switched to step ${currentStep}: ${tabTitle}`);

    //     // Example: Update breadcrumbs, load data for step, etc.
    //     if (currentStep === 1) {
    //         console.log('Now on send step, document ID:', this.uploadedDocumentId);
    //     }
    // }

    // /**
    //  * ✅ Before step completion - Validate business logic
    //  * Return false or call e.preventDefault() to block completion
    //  */
    // handleBeforeComplete(component, data, e) {
    //     const { stepIndex, stepTitle } = data;
        
    //     console.log(`🔍 Validating step ${stepIndex} completion`);

    //     // Example: Additional validation for step 0
    //     if (stepIndex === 0) {
    //         if (!this.uploadedDocumentId) {
    //             e.preventDefault(); // ← Block completion
    //             toast.error('Upload failed - cannot complete step');
    //             console.error('⚠️ Blocked: Upload verification failed');
    //             return;
    //         }
    //     }

    //     // Example: Validate step 1 before completion
    //     if (stepIndex === 1) {
    //         if (!this.uploadedDocumentId) {
    //             e.preventDefault();
    //             toast.error('No document to send!');
    //             return;
    //         }
    //     }

    //     console.log('✅ Step completion allowed');
    // }

    // /**
    //  * ✅ After step completion - Perform cleanup or notifications
    //  */
    // handleAfterComplete(component, data, e) {
    //     const { stepIndex, stepTitle, completedSteps, totalSteps } = data;
        
    //     console.log(`✅ Step ${stepIndex} completed: ${stepTitle}`);
    //     console.log(`Progress: ${completedSteps}/${totalSteps} steps completed`);

    //     // Example: Show progress notification
    //     toast.info(`Step ${stepIndex + 1} of ${totalSteps} complete!`);

    //     // Example: Track analytics
    //     // this.analytics.trackStepComplete(stepIndex);
    // }

    // /**
    //  * ✅ All steps completed - Handle final success
    //  */
    // handleAllStepsComplete(component, data, e) {
    //     const { allStepsCompleted, totalSteps } = data;
        
    //     console.log('🎉 All steps completed!');

    //     // Show success dialog
    //     toast.confirm('Document sent successfully! Would you like to send another document?', {
    //         showButtons: true,
    //         onOk: () => {
    //             // Reset and start over
    //             component.reset();
    //             this.uploadedDocumentId = null;
    //             this.uploadedFileName = null;
    //             this.router.navigateTo('/dashboard/documents/upload');
    //         },
    //         onCancel: () => {
    //             // Go to dashboard
    //             this.router.navigateTo('/dashboard');
    //         }
    //     });
    // }
}
