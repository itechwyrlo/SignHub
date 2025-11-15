import { AuthManager } from "../core/AuthManager.js";
import { ControllerBase } from "../core/ControllerBase.js";
import { loading } from "../utils/loadingOverlay.js";
import { toast } from "../utils/toast.js";
export class DashboardViewController extends ControllerBase{
    /**
     *
     */
    constructor() {
        super();
       
    }
    setupConfigs(){
    }


    setupControls(){
        // this.control({
        //     'x-sidebar [data-id="logout"]': {  // Target sidebar component + internal selector
        //         click: this.handleLogout  // Note: Remove (e, instance) here, just pass the method
        //       }
        // })
    }

   

    
}