import { componentManager } from "../core/ComponentManager.js";
import { ControllerBase } from "../core/ControllerBase.js";
import { Router } from "../core/router.js";
import { UserModel } from "../model/UserModel.js";
import { loading } from "../utils/loadingOverlay.js";
import { toast } from "../utils/toast.js";
export class LoginViewController extends ControllerBase{
    /**
     *
     */
    constructor() {
        super();
        this.router = new Router();
        this.userModel = UserModel.getInstance();
    }
    setupConfigs(){
        this.configs = [
            {
              componentId: 'login-form',
              model: this.userModel,
            //   handlers: {
            //     items: 'onItemsChange'  // Optional: controller-level handler
            //   }
            }
          ];
    }

    setupControls(){
       this.control({
        'login-form': {
          beforerender: (e, instance) => console.log('Before render form'),
          afterrender: (e, instance) => console.log('After render form'),
          'form-submit': this.handleSubmit
        },
      
      });
      
    } 
    
    
   


    handleSubmit(component,data, e){
        const form = componentManager.getComponent('login-form');
        loading.show('Logged In...')
        this.userModel.login({
            UserName: data.email,
            Password: data.password
        }).then(response => {
            if(response.success){
                this.router.navigateTo('/dashboard');
                loading.hide();
            }
            // { success: true, token: 'jwt_token_here', user: {...} }
          }).catch(error => {
              toast.error(`${error}`)
              loading.hide();
          });
    }
}