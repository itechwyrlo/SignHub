import { ControllerBase } from "../core/ControllerBase.js";
import { DocumentModel } from "../model/DocumentModel.js";

export class AllDocumentsViewController extends ControllerBase {
  constructor() {
    super();
    this.documentModel = DocumentModel.getInstance();

  }

  setupConfigs() {
    this.configs = [
      {
        componentId: 'all-documents-grid',
        model: this.documentModel,
        // ✅ Optional: Add handlers for specific events
        // handlers: {
        //   items: 'onItemsUpdate',
        //   loading: 'onLoadingUpdate'
        // }
      }
    ];
  }

  setupControls() {
    this.control({
      'all-documents-grid': {
        'beforerender': this.onTableBeforeRender,
        'delete-rows': this.handleDelete
     
      }
    });
  }

  onTableBeforeRender(component) {
    this.documentModel.load();
  }
  
  handleDelete(component, data, e){
    const key = e.detail.deletedKeys;
      this.documentModel.destroy(key);
  }
  

  // ✅ Optional: Handle events
  onItemsUpdate(items, state, previous) {
    console.log('📄 Items loaded:', items.length);
  }

  onLoadingUpdate(isLoading, state, previous) {
    console.log('⏳ Loading:', isLoading);
  }
}

// import { ControllerBase } from "../core/ControllerBase.js";
// import { DocumentModel } from "../model/DocumentModel.js";
// import { componentManager } from "../core/ComponentManager.js";

// export class AllDocumentsViewController extends ControllerBase{
//     constructor() {
//         super();    
//         this.documentModel = DocumentModel.getInstance();
        
        
       
//     }

//     setupConfigs(){
   
//         this.configs = [
//             {
//               componentId: 'all-documents-table',
//               model: this.documentModel,
//             //   handlers: {
//             //     items: 'onItemsChange'  // Optional: controller-level handler
//             //   }
//             }
//           ];


//     }

//     setupControls(){
//         this.control({
//             // Listen to table component events
//             'all-documents-table': {
//               'beforerender': this.onBeforeRender,
             
//             },
            
//           });
//     }



//     onBeforeRender(){
//         this.documentModel.load();
//     }

   
// }