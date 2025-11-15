import { ControllerBase } from "../core/ControllerBase.js";
import { DocumentModel } from "../model/DocumentModel.js";

export class PendingViewController extends ControllerBase{
    /**
     *
     */
    constructor() {
        super();
        this.documentModel = DocumentModel.getInstance();
        
    }
    setupConfigs(){
        this.configs = [
            {
                componentId: 'pending-grid',
                model: this.documentModel,
              //   handlers: {
              //     items: 'onItemsChange'  // Optional: controller-level handler
              //   }
              }
        ]
    }

    setupControls(){
        this.control({
            'pending-grid' : {
                'beforerender': this.onBeforeRender,
                'beforeload': this.onBeforeLoad
            }
        })
    }

    onBeforeLoad(filter, url,e, handler){
        filter = {
            column: "Status",
            condition: "eq",
            value: "0",
            conjunction: "and",
            filters: []
        };
        e.detail.model.clearFilter();
        // In your controller
        e.detail.model.setFilter({
            Filter: JSON.stringify(filter),  // ← You're passing "Filter" (uppercase)
            pageNumber: 1,
            pageSize: 20
        });
  }

    onBeforeRender(){
        const filter = {
            column: "Status",
            condition: "eq",
            value: "0",
            conjunction: "and",
            filters: []
        };
        
        const params = {
            Filter: JSON.stringify(filter)
        };

        this.documentModel.setFilter(params);
        this.documentModel.load();
    }

}