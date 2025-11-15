
import { DashboardView } from "../views/DashboardView.js";
import { DashboardViewController } from "../controller/DashboardViewController.js";
import { AllDocumentsView } from "../views/AllDocumentsView.js";
import { AllDocumentsViewController } from "../controller/AllDocumentsViewController.js";
import { LoginView } from "../views/LoginView.js";
import { LoginViewController } from "../controller/LoginViewController.js";
import { SignUpView } from "../views/SignupView.js";
import { SignupViewController } from "../controller/SignupViewController.js";
import { Router } from "./router.js";
import { Layout } from "./layout.js";
import { AuthManager } from "./AuthManager.js";
import { UploadView } from "../views/UploadView.js";
import { UploadViewController } from "../controller/UploadViewController.js";
import { CompletedView } from "../views/CompletedView.js";
import { CompletedViewController } from "../controller/CompletedViewController.js";
import { PendingView } from "../views/PendingView.js";
import { PendingViewController } from "../controller/PendingViewController.js";
import { componentManager } from "./ComponentManager.js";

export class App {
    constructor() {
        this.router = new Router();
        App.instance = this;
    
        // Expose debugging tools
        if (typeof window !== 'undefined') {
            window.bug = {
                DebuggerFunction: {
                    clearAuth: () => AuthManager._clear(),
                    getToken: () => AuthManager._get(),
                    getCurrentComponents: () => componentManager.getAll()
                }
            };
        }

        // Register all routes
       
    

        this.router.register({
            path: '/SignHub/dashboard',
            view: DashboardView,
            controller: DashboardViewController,
            protected: true,
        });

        this.router.register({
            path: '/SignHub/dashboard/documents/all',
            view: AllDocumentsView,
            controller: AllDocumentsViewController,
            protected: true,
        });

        this.router.register({
            path: '/SignHub/login',
            view: LoginView,
            controller: LoginViewController,
            public: true,
        });

        this.router.register({
            path: '/SignHub/signup',
            view: SignUpView,
            controller: SignupViewController,
            public: true,
        });

        this.router.register({
            path: '/SignHub/dashboard/documents/upload',
            view: UploadView,
            controller: UploadViewController,
            protected: true,
        });

        this.router.register({
            path: '/SignHub/dashboard/documents/completed',
            view: CompletedView,
            controller: CompletedViewController,
            protected: true,
        });

        this.router.register({
            path: '/SignHub/dashboard/documents/pending',
            view: PendingView,
            controller: PendingViewController,
            protected: true,
        });
    }
    
    run() {
        const app = document.getElementById('app');
        
        // Initialize skeletal layout structure (layout-container + main)
        app.innerHTML = Layout.init();
        
        // Start router (will handle layout component creation based on route)
        this.router.init();
        
        // Start auth expiry watcher
        AuthManager.startExpiryWatcher();
        
        console.log('🚀 Application started');
    }
}
