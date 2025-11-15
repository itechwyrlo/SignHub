import { Router } from "./router.js";
import { loading } from "../utils/loadingOverlay.js";

export class AuthManager {
    constructor() {
        this.router = new Router();
      }
    

    static _get() {
        return sessionStorage.getItem('auth_key');
    }

    static _set(token) {
        sessionStorage.setItem('auth_key', token);
        this.startExpiryWatcher();
        // Notify app about auth change (login)
        window.dispatchEvent(new CustomEvent('auth:changed', { detail: { authenticated: true } }));
    }

    static _clear() {
        sessionStorage.removeItem('auth_key');
        // Notify app about auth change (logout)
        window.dispatchEvent(new CustomEvent('auth:changed', { detail: { authenticated: false } }));
    }

    static decodeJwt(token) {
        try {
            const payload = token.split('.')[1];
            const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            return JSON.parse(decoded);
        } catch (err) {
            return null;
        }
    }

    static isAuth() {
        const token = this._get();
        if (!token) return false;

        const jwt = this.decodeJwt(token);
        if (!jwt?.exp) return false;

        return Date.now() < jwt.exp * 1000;
    }

    static startExpiryWatcher() {
        const token = this._get();
        if (!token) return;

        const jwt = this.decodeJwt(token);
        if (!jwt?.exp) return;

        const expMs = jwt.exp * 1000;
        const now = Date.now();
        const timeout = expMs - now;

        if (timeout <= 0) {
            this.handleExpired();
            return;
        }

        console.log(`⏱ Auto-logout in ${timeout}ms`);

        clearTimeout(this._expiryTimer);
        this._expiryTimer = setTimeout(() => this.handleExpired(), timeout);
    }

    static logout(){
        AuthManager._clear();
        loading.hide();
    }

    static handleExpired() {
        this._clear();
        console.warn("🔐 Token expired");
        window.dispatchEvent(new CustomEvent("auth:expired"));
    }
}
