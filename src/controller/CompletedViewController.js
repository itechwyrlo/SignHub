import { ControllerBase } from "../core/ControllerBase.js";
import { DocumentModel } from "../model/DocumentModel.js";

export class CompletedViewController extends ControllerBase{
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
                componentId: 'completed-grid',
                model: this.documentModel,
              //   handlers: {
              //     items: 'onItemsChange'  // Optional: controller-level handler
              //   }
              }
        ]
    }

    setupControls(){
        this.control({
            'completed-grid' : {
                'beforerender': this.onBeforeRender
            }
        })
    }

    onBeforeRender(){
        const filter = {
            column: "Status",
            condition: "eq",
            value: "2",
            conjunction: "and",
            filters: []
        };
        
        const params = {
            Filter: JSON.stringify(filter),
            pageNumber: 1,
            pageSize: 20
        };
        
        this.documentModel.load(params);
    }
}