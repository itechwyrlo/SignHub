import { ViewBase } from "../core/ViewBase.js";
import { BreadCrumb } from "../components/BreadCrumb.js";

export class DashboardView extends ViewBase{
    /**
     *
     */
    constructor() {
      super();
    }

    template(){
        return  this.innerHTML = `
      <x-bread-crumb data-id="dashboard-breadcrumb"></x-bread-crumb>
    
        <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">Total Page Views</span>
                <span class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </span>
            </div>
            <div class="stat-value">4,42,236</div>
            <div class="stat-change positive">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>59.3%</span>
            </div>
            <div class="stat-footer">
                You made an extra <strong>35,000</strong> this year
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">Total Users</span>
                <span class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2"/>
                        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </span>
            </div>
            <div class="stat-value">78,250</div>
            <div class="stat-change positive">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>70.5%</span>
            </div>
            <div class="stat-footer">
                You made an extra <strong>8,900</strong> this year
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">Total Order</span>
                <span class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 2L3 6V18L9 22L15 18L21 22V10L15 6L9 2Z" stroke="currentColor" stroke-width="2"/>
                        <path d="M9 2V10" stroke="currentColor" stroke-width="2"/>
                        <path d="M15 6V18" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </span>
            </div>
            <div class="stat-value">18,800</div>
            <div class="stat-change negative">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 4V12M8 12L4 8M8 12L12 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>27.4%</span>
            </div>
            <div class="stat-footer">
                You made an extra <strong>1,943</strong> this year
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">This Week Statistics</span>
                <span class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </span>
            </div>
            <div class="stat-value">$7,650</div>
            <div class="stat-change positive">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>12.8%</span>
            </div>
            <div class="stat-footer">
                Compared to <strong>$6,780</strong> last week
            </div>
        </div>
    </div>

    <div class="content-grid">
        <div class="content-card large">
            <div class="card-header">
                <h3 class="card-title">Unique Visitor</h3>
                <div class="card-actions">
                    <button class="btn-tab">Month</button>
                    <button class="btn-tab active">Week</button>
                </div>
            </div>
            <div class="card-body">
                <div class="chart-placeholder">
                    <svg viewBox="0 0 600 200" class="chart-svg">
                        <path d="M 0 180 L 50 150 L 100 160 L 150 130 L 200 140 L 250 110 L 300 100 L 350 80 L 400 90 L 450 60 L 500 70 L 550 40 L 600 50" stroke="#4F46E5" stroke-width="2" fill="none"/>
                        <path d="M 0 180 L 50 150 L 100 160 L 150 130 L 200 140 L 250 110 L 300 100 L 350 80 L 400 90 L 450 60 L 500 70 L 550 40 L 600 50 L 600 200 L 0 200 Z" fill="url(#gradient)" opacity="0.3"/>
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:0.5" />
                                <stop offset="100%" style="stop-color:#4F46E5;stop-opacity:0" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>
        </div>

        <div class="content-card">
            <div class="card-header">
                <h3 class="card-title">Recent Activity</h3>
            </div>
            <div class="card-body">
                <div class="activity-list">
                    ${this.renderActivity("New order received", "2 minutes ago")}
                    ${this.renderActivity("User registration completed", "15 minutes ago")}
                    ${this.renderActivity("Payment processed successfully", "1 hour ago")}
                    ${this.renderActivity("System backup completed", "3 hours ago")}
                </div>
            </div>
        </div>
    </div>
`;
    }

    renderActivity(text, time) {
        return `
        <div class="activity-item">
            <div class="activity-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" fill="currentColor"/>
                </svg>
            </div>
            <div class="activity-content">
                <p class="activity-text">${text}</p>
                <span class="activity-time">${time}</span>
            </div>
        </div>`;
    
    }
}