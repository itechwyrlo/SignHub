export const dropdownConfig = {
    trigger: `
      <img src="/api/placeholder/32/32" alt="User" style="width: 32px; height: 32px; border-radius: 50%;">
      <span>Stebin Ben</span>
    `,
    header: `
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="/api/placeholder/48/48" alt="User" style="width: 48px; height: 48px; border-radius: 50%;">
        <div>
          <p style="margin: 0; font-weight: 600; font-size: 14px;">Stebin Ben</p>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">UI/UX Designer</p>
        </div>
      </div>
    `,
    main: [
      {
        id: 'edit-profile',
        label: 'Edit Profile',
        icon: '<i class="bx bx-edit"></i>',
        path: '/profile/edit'
      },
      {
        id: 'view-profile',
        label: 'View Profile',
        icon: '<i class="bx bx-user"></i>',
        path: '/profile'
      },
      {
        id: 'billing',
        label: 'Billing',
        icon: '<i class="bx bx-wallet"></i>',
        path: '/billing'
      }
    ],
    footer: [
      {
        id: 'logout',
        label: 'Logout',
        icon: '<i class="bx bx-log-out"></i>',
        action: 'logout'
      }
    ],
  
  };