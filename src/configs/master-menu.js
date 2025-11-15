export const menuConfig = {
  header: {
    logo: "/logo.png",
    title: "SignHub",
    subtitle: "Contract Manager",
    collapsedLogo: "/icon.png",
  },
  main: {
    sections: [
        {
          id: "main-nav",
          label: "Dashboard",
          showLabel: true,
          items: [
            {
              id: "dashboard",
              label: "Dashboard",
              icon: '<i class="bx  bx-dashboard"></i>',
              path: "/dashboard",
              active: true,
            },
            {
              id: "upload",
              label: "Send for Signature",
              icon: '<i class="bx  bx-send"    ></i> ',
              path: "/dashboard/documents/upload",
            },
          ],
        },
        {
          id: "documents-section",
          label: "Documents",
          showLabel: true,
          items: [
            {
                id: "all-documents",
                label: "All Documents",
                icon: '<i class="bx bx-file"></i>',
                path: "/dashboard/documents/all"
              
              // items: [ // ✅ dropdown
              //   {
              //     id: 'pdf-files',
              //     label: 'PDF Files',
              //     icon: '<i class="fa-solid fa-file-pdf"></i>',
              //     path: '/pdf'
              //   },
              //   {
              //     id: 'word-files',
              //     label: 'Word Docs',
              //     icon: '<i class="fa-solid fa-file-word"></i>',
              //     path: '/word'
              //   }
              // ]
            },
            {
              id: "pending",
              label: "Pending",
              icon: '<i class="bx  bx-clock-3"   ></i> ',
              path: "/dashboard/documents/pending",
            },
            {
              id: "completed",
              label: "Completed",
              icon: '<i class="bx  bx-check-circle"   ></i> ',
              path: "/dashboard/documents/completed",
            },
          ],
        },
      ],
  },
  footer: {
    items: [
      {
        id: "profile",
        label: "Profile",
        icon: '<i class="bx  bx-user"    ></i> ',
        path: "/profile",
      },
      {
        id: "logout",
        label: "Logout",
        icon: '<i class="bx  bx-arrow-from-right-stroke"    ></i> ',
        action: "logout",
      },
    ],
  },
};
