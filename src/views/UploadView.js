import { TabPanel } from "../components/TabPanel.js";
import { Form } from "../components/Form.js";
import { BreadCrumb } from "../components/BreadCrumb.js";
import { ViewBase } from "../core/ViewBase.js";
export class UploadView extends ViewBase {
    constructor() {
        super();
    }

    template() {
        return `
        <x-bread-crumb data-id="upload-breadcrumb"></x-bread-crumb>
            <div class="upload-view-container">
                <div class="upload-view-header">
                    <h1 class="page-title">
                        <i class="fa-solid fa-paper-plane"></i> Send Document for Signature
                    </h1>
                    <p class="page-subtitle">Upload a PDF document and send it to a recipient for digital signature</p>
                </div>

                <x-tabpanel data-variant="basic" data-id="upload-tabpanel" id="uploadTabPanel">
                    <!-- Step 1: Upload -->
                    <div data-tab="upload" 
                         data-title="Upload Document" 
                         data-icon="fa-solid fa-upload">
                        <div class="step-card">
                            <x-form data-id="upload-form">
                                <!-- File Upload -->
                                <div class="mb-3"
                                     data-field="file"
                                     data-label="Select PDF Document"
                                     data-name="file"
                                     data-accept=".pdf"
                                     data-required
                                     data-class="form-control">
                                </div>

                                <!-- Recipient Email -->
                                <div class="mb-3"
                                     data-field="email"
                                     data-label="Recipient Email"
                                     data-name="recipientEmail"
                                     data-placeholder="client@example.com"
                                     data-required
                                     data-class="form-control">
                                </div>

                                <!-- Recipient Name (Optional) -->
                                <div class="mb-3"
                                     data-field="text"
                                     data-label="Recipient Name (Optional)"
                                     data-name="recipientName"
                                     data-placeholder="John Doe"
                                     data-class="form-control">
                                </div>

                                <!-- Upload Button -->
                                <div class="d-grid"
                                     data-field="submit"
                                     data-text="Upload Document"
                                     data-class="btn btn-primary btn-lg">
                                </div>
                            </x-form>
                        </div>
                    </div>

                    <!-- Step 2: Send -->
                    <div data-tab="send" 
                         data-title="Send for Signature" 
                         data-icon="fa-solid fa-paper-plane">
                        <div class="step-card">

                            <x-form data-id="send-form">
                                <!-- Email Subject -->
                                <div class="mb-3"
                                     data-field="text"
                                     data-label="Email Subject (Optional)"
                                     data-name="emailSubject"
                                     data-placeholder="Please sign this document"
                                     data-class="form-control">
                                </div>

                                <!-- Email Message -->
                                <div class="mb-3"
                                     data-field="textarea"
                                     data-label="Email Message (Optional)"
                                     data-name="emailMessage"
                                     data-placeholder="Please review and sign the attached document at your earliest convenience."
                                     data-rows="4"
                                     data-class="form-control">
                                </div>

                                <!-- Action Buttons -->
                                <div class="button-group">
                                    <button type="button" class="btn btn-outline-secondary" id="backToUploadBtn">
                                        <i class="fa-solid fa-arrow-left"></i> Upload Another
                                    </button>
                                    <div data-field="submit"
                                         data-text="Send to DocuSign"
                                         data-class="btn btn-success btn-lg">
                                    </div>
                                </div>
                            </x-form>
                        </div>
                    </div>
                </x-tabpanel>

               
            </div>
        `;
    }
}