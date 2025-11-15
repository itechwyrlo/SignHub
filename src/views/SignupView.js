import { ViewBase } from "../core/ViewBase.js";
import { Form } from "../components/Form.js";

export class SignUpView extends ViewBase {
  template() {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L8 12L24 20L40 12L24 4Z" fill="currentColor"/>
                <path d="M8 20L24 28L40 20" stroke="currentColor" stroke-width="3"/>
                <path d="M8 28L24 36L40 28" stroke="currentColor" stroke-width="3"/>
              </svg>
            </div>
            <h1 class="auth-title">Create Account</h1>
            <p class="auth-subtitle">Sign up to get started with your dashboard</p>
          </div>

          <!-- Dynamic form -->
          <x-form data-id="signup-form" class="auth-form">
            
            <div class="form-row">
              <div 
                data-field="text"
                data-label="First Name"
                data-name="firstName"
                data-placeholder="John"
                data-required
              ></div>

              <div 
                data-field="text"
                data-label="Last Name"
                data-name="lastName"
                data-placeholder="Doe"
                data-required
              ></div>
            </div>

            <div 
              data-field="email"
              data-label="Email Address"
              data-name="email"
              data-placeholder="john.doe@example.com"
              data-required
            ></div>

            <div 
              data-field="password"
              data-label="Password"
              data-name="password"
              data-placeholder="Create a strong password"
              data-required
            ></div>

            <div 
              data-field="password"
              data-label="Confirm Password"
              data-name="confirmPassword"
              data-placeholder="Re-enter your password"
              data-required
            ></div>

            <div class="form-group">
              <label class="checkbox-wrapper">
                <input type="checkbox" name="terms" required />
                <span class="checkbox-label">
                  I agree to the 
                  <a href="#" class="link-text">Terms of Service</a> 
                  and 
                  <a href="#" class="link-text">Privacy Policy</a>
                </span>
              </label>
            </div>

            <div 
              data-field="submit" 
              data-text="Create Account" 
              data-class="btn btn-primary btn-block"
            ></div>

            <div class="divider"><span>or sign up with</span></div>

            <div class="social-buttons">
              <button type="button" class="btn btn-social">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M18.17 8.36H10V11.82H14.71C14.25 13.97 12.28 15.45 10 15.45C7.24 15.45 5 13.21 5 10.45C5 7.69 7.24 5.45 10 5.45C11.27 5.45 12.41 5.93 13.27 6.69L15.82 4.14C14.33 2.77 12.33 2 10 2C5.03 2 1 6.03 1 11C1 15.97 5.03 20 10 20C14.97 20 19 15.97 19 11C19 10.09 18.9 9.45 18.17 8.36Z" fill="currentColor"/>
                </svg>
                Google
              </button>
              <button type="button" class="btn btn-social">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M20 10C20 4.48 15.52 0 10 0C4.48 0 0 4.48 0 10C0 14.84 3.44 18.87 8 19.8V13H6V10H8V7.5C8 5.57 9.57 4 11.5 4H14V7H12C11.45 7 11 7.45 11 8V10H14V13H11V19.95C16.05 19.45 20 15.19 20 10Z" fill="currentColor"/>
                </svg>
                Facebook
              </button>
            </div>
          </x-form>

          <div class="auth-footer">
            <p class="footer-text">
              Already have an account? 
              <a href="login.html" class="link-text link-primary">Sign in</a>
            </p>
          </div>
        </div>

    `;
  }
}

customElements.define("x-signup-view", SignUpView);
