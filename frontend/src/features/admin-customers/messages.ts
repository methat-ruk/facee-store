export function getAdminCustomersPageText(locale: string) {
  return locale === 'th'
    ? {
        heading: 'Customers',
        description:
          'ค้นหาลูกค้า เปิดข้อมูลสรุปการสั่งซื้อ และดูข้อมูลซัพพอร์ตจากหน้าเดียว',
        searchPlaceholder: 'ค้นหาด้วยชื่อลูกค้า อีเมล หรือเบอร์โทร',
        loadFailed: 'ไม่สามารถโหลดรายชื่อลูกค้าได้ในขณะนี้',
        loadFailedDescription:
          'ลองอีกครั้งเพื่อดึงข้อมูลลูกค้าและสรุปคำสั่งซื้อล่าสุด',
        retry: 'ลองอีกครั้ง',
        emptyTitle: 'ไม่พบลูกค้าที่ตรงกับเงื่อนไขนี้',
        emptyDescription:
          'ลองค้นหาด้วยชื่อ อีเมล หรือเบอร์โทรอื่น แล้วตรวจสอบอีกครั้ง',
        rowsPerPage: 'แถวต่อหน้า',
        previous: 'ก่อนหน้า',
        next: 'ถัดไป',
        viewCustomer: 'ดูลูกค้า',
        createdAt: 'สร้างบัญชี',
        totalSpent: 'ยอดใช้จ่ายรวม',
        orders: 'ออเดอร์',
        pendingCancellations: 'คำขอยกเลิกรอพิจารณา',
        lastOrderAt: 'ออเดอร์ล่าสุด',
        noOrders: 'ยังไม่มีออเดอร์',
        profile: 'ข้อมูลติดต่อ',
        summary: '{count} customers',
        loading: 'กำลังโหลดข้อมูลลูกค้า...',
      }
    : {
        heading: 'Customers',
        description:
          'Search customers, review commerce history, and manage support data from one place.',
        searchPlaceholder: 'Search by customer name, email, or phone',
        loadFailed: 'Unable to load the customer workspace.',
        loadFailedDescription:
          'Try again to refresh customer records and their latest order summaries.',
        retry: 'Try again',
        emptyTitle: 'No customers matched this search.',
        emptyDescription:
          'Try another customer name, email address, or phone number.',
        rowsPerPage: 'Rows per page',
        previous: 'Previous',
        next: 'Next',
        viewCustomer: 'View customer',
        createdAt: 'Joined',
        totalSpent: 'Total spent',
        orders: 'Orders',
        pendingCancellations: 'Pending cancellations',
        lastOrderAt: 'Last order',
        noOrders: 'No orders yet',
        profile: 'Contact',
        summary: '{count} customers',
        loading: 'Loading customers...',
      };
}

export function getAdminCustomerDetailText(locale: string) {
  return locale === 'th'
    ? {
        back: 'กลับไปหน้าลูกค้า',
        loading: 'กำลังโหลดข้อมูลลูกค้า...',
        loadFailed: 'ไม่สามารถโหลดข้อมูลลูกค้าได้ในขณะนี้',
        loadFailedDescription:
          'ลองอีกครั้งเพื่อดึงข้อมูลโปรไฟล์ ที่อยู่ และออเดอร์ล่าสุดของลูกค้า',
        retry: 'ลองอีกครั้ง',
        overview:
          'ดูข้อมูลลูกค้า ที่อยู่จัดส่ง และออเดอร์ล่าสุดได้จากหน้าเดียว',
        profileTitle: 'ข้อมูลลูกค้า',
        profileDescription:
          'หน้านี้ใช้สำหรับดูข้อมูลลูกค้าเท่านั้น ผู้ดูแลระบบไม่สามารถแก้ไขข้อมูลจากหน้านี้ได้',
        phone: 'เบอร์โทร',
        summaryOrders: 'Orders',
        summarySpent: 'Total spent',
        summaryPendingCancellations: 'Pending cancellations',
        summaryLastOrder: 'Last order',
        noOrders: 'ยังไม่มีออเดอร์',
        notProvided: 'ไม่มีข้อมูล',
        memberSince: 'เริ่มใช้งาน',
        addressesTitle: 'ที่อยู่จัดส่ง',
        addressesDescription: 'ที่อยู่ที่ลูกค้าเคยบันทึกไว้ในบัญชี',
        defaultAddress: 'ค่าเริ่มต้น',
        noAddresses: 'ยังไม่มีที่อยู่ที่บันทึกไว้',
        addressUpdatedAt: 'อัปเดตล่าสุด',
        recentOrdersTitle: 'ออเดอร์ล่าสุด',
        recentOrdersDescription:
          'เปิดออเดอร์เพื่อดูการชำระเงิน สถานะ และคำขอยกเลิกที่เกี่ยวข้อง',
        viewOrder: 'ดูออเดอร์',
        fullName: 'ชื่อเต็ม',
        email: 'อีเมล',
        cancellationPending: 'Cancellation pending',
      }
    : {
        back: 'Back to customers',
        loading: 'Loading customer details...',
        loadFailed: 'Unable to load this customer right now.',
        loadFailedDescription:
          'Try again to refresh the profile, saved addresses, and recent orders for this customer.',
        retry: 'Try again',
        overview:
          'Review customer profile, saved addresses, and recent orders from one place.',
        profileTitle: 'Customer profile',
        profileDescription:
          'This page is read-only for admins and shows the account data exactly as the customer saved it.',
        phone: 'Phone',
        summaryOrders: 'Orders',
        summarySpent: 'Total spent',
        summaryPendingCancellations: 'Pending cancellations',
        summaryLastOrder: 'Last order',
        noOrders: 'No orders yet',
        notProvided: 'Not provided',
        memberSince: 'Member since',
        addressesTitle: 'Saved addresses',
        addressesDescription:
          'Shipping addresses currently stored on the customer account.',
        defaultAddress: 'Default',
        noAddresses: 'No saved addresses yet',
        addressUpdatedAt: 'Updated',
        recentOrdersTitle: 'Recent orders',
        recentOrdersDescription:
          'Open any order to review payments, fulfillment, and cancellation history.',
        viewOrder: 'View order',
        fullName: 'Full name',
        email: 'Email',
        cancellationPending: 'Cancellation pending',
      };
}
