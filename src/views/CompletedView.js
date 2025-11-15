import { ViewBase } from "../core/ViewBase.js";
import { BreadCrumb } from "../components/BreadCrumb.js";
import { Table } from "../components/Table.js";
import { Paging } from "../components/Paging.js";

export class CompletedView extends ViewBase{
    /**
     *
     */
    constructor() {
        super();
        
    }

    template(){
        return this.innerHtml = `
        <x-bread-crumb data-id="completed-breadcrumb"></x-bread-crumb>
        <x-grid 
          data-id="completed-grid" 
          data-selection-model="checkbox"
          >
        
          
          <!-- Column Definitions -->
          
          <!-- Read-only ID column -->
          <div data-column 
               data-key="id" 
               data-label="ID"
               data-read-only="true"></div>
          
          <!-- Editable text column -->
          <div data-column 
               data-key="fileName" 
               data-label="Title"
               data-editor="text"
               data-required="true"
               data-min-length="3"
               data-max-length="100"
               data-read-only="true"></div>
          
          <!-- Editable email column -->
          <div data-column 
               data-key="recipientEmail" 
               data-label="Recipient"
               data-editor="text"
               data-required="true"
               data-read-only="true"
               data-pattern="^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"></div>
          
          <!-- ✅ Editable combo column with REMOTE loading -->
          <div data-column 
               data-key="statusName" 
               data-label="Status"
               data-editor="combo"
               data-required="true"
               data-combo-configs='{
                 "dataSource": "/api/status",
                 "queryMode": "remote",
                 "valueField": "statusId",
                  "displayField": "statusName"
               }'
               data-read-only="true"></div>
          
          <!-- Editable date column -->
          <div data-column 
               data-key="createdDate" 
               data-label="Created"
               data-editor="date"
               data-read-only="true"></div>
          
          <!-- Editable checkbox column -->
          <div data-column 
               data-key="active" 
               data-label="Active"
               data-editor="checkbox"
              
          
          <!-- Action buttons -->
          <div data-column 
               data-key="actions" 
               data-label="Actions" 
               data-action-component="buttons"
               data-read-only="true"></div>
        </x-grid>
        `


    }
}