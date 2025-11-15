import { ModelBase } from "../core/ModelBase.js";

export class DocumentModel extends ModelBase {
    constructor() {
        super();
        this.idProperty = 'documentId',
        this.pageSize = 10,
        this.proxy = {
            upload: '/api/document/upload',
            send: '/api/document/send',
            read: '/api/document',
            getById: '/api/document/:id',
            checkStatus: '/api/document/:id/status',
            refreshAll: '/api/document/refresh-all-statuses',
            destroy: '/api/document/:id',
            create: '/api/document'
        };
    }

    /**
     * Upload document with file
     * @param {Object} data - { file: File, recipientEmail: string, recipientName?: string }
     * @returns {Promise} Upload response with documentId
     */
    async upload(data) {
        if (!this.proxy.upload) {
            throw new Error('Upload proxy endpoint not defined');
        }

        if (!data.file) {
            throw new Error('File is required for upload');
        }

        if (!data.recipientEmail) {
            throw new Error('Recipient email is required');
        }

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', data.file);
            formData.append('recipientEmail', data.recipientEmail);
            
            if (data.recipientName) {
                formData.append('recipientName', data.recipientName);
            }

            // Call API with FormData (no Content-Type header - browser sets it automatically)
            const response = await this._apiRequestFormData('POST', this.proxy.upload, formData);
            
            return response;
        } catch (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }
    }

    /**
     * Send document to DocuSign
     * @param {Object} data - { documentId: number, emailSubject?: string, emailMessage?: string }
     * @returns {Promise} Send response with envelopeId
     */
    async send(data) {
        if (!this.proxy.send) {
            throw new Error('Send proxy endpoint not defined');
        }

        if (!data.documentId) {
            throw new Error('Document ID is required');
        }

        try {
            const payload = {
                documentId: data.documentId,
                emailSubject: data.emailSubject || null,
                emailMessage: data.emailMessage || null
            };

            const response = await this._apiRequest('POST', this.proxy.send, payload);
            return response;
        } catch (error) {
            throw new Error(`Send failed: ${error.message}`);
        }
    }

    /**
     * Get all documents for current user
     * @returns {Promise} Array of documents
     */
    async getAll() {
        if (!this.proxy.getAll) {
            throw new Error('GetAll proxy endpoint not defined');
        }

        try {
            const response = await this._apiRequest('GET', this.proxy.getAll);
            
            // Load documents into model data
            if (Array.isArray(response)) {
                this.load(response);
            }
            
            return response;
        } catch (error) {
            throw new Error(`Failed to fetch documents: ${error.message}`);
        }
    }

    /**
     * Get single document by ID
     * @param {number} id - Document ID
     * @returns {Promise} Document object
     */
    async getById(id) {
        if (!this.proxy.getById) {
            throw new Error('GetById proxy endpoint not defined');
        }

        try {
            const endpoint = this.proxy.getById.replace(':id', id);
            const response = await this._apiRequest('GET', endpoint);
            return response;
        } catch (error) {
            throw new Error(`Failed to fetch document: ${error.message}`);
        }
    }

    /**
     * Check document status from DocuSign
     * @param {number} id - Document ID
     * @returns {Promise} Status response
     */
    async checkStatus(id) {
        if (!this.proxy.checkStatus) {
            throw new Error('CheckStatus proxy endpoint not defined');
        }

        try {
            const endpoint = this.proxy.checkStatus.replace(':id', id);
            const response = await this._apiRequest('GET', endpoint);
            return response;
        } catch (error) {
            throw new Error(`Failed to check status: ${error.message}`);
        }
    }

    /**
     * Refresh all document statuses
     * @returns {Promise} Refresh response with counts
     */
    async refreshAll() {
        if (!this.proxy.refreshAll) {
            throw new Error('RefreshAll proxy endpoint not defined');
        }

        try {
            const response = await this._apiRequest('GET', this.proxy.refreshAll);
            return response;
        } catch (error) {
            throw new Error(`Failed to refresh statuses: ${error.message}`);
        }
    }

    /**
     * Delete document
     * @param {number} id - Document ID
     * @returns {Promise} Delete response
     */
    async delete(id) {
        if (!this.proxy.delete) {
            throw new Error('Delete proxy endpoint not defined');
        }

        try {
            const endpoint = this.proxy.delete.replace(':id', id);
            const response = await this._apiRequest('DELETE', endpoint);
            return response;
        } catch (error) {
            throw new Error(`Failed to delete document: ${error.message}`);
        }
    }

}