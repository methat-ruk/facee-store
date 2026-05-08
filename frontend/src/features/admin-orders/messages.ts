export function getAdminOrdersPageText(locale: string) {
  return locale === 'th'
    ? {
        all: 'ทั้งหมด',
        followUp: 'ต้องติดตาม',
        shown: 'รายการที่แสดง',
        resultLabel: 'รายการออเดอร์ที่กรองแล้ว',
        allOrders: 'Orders',
        searchPlaceholder: 'ค้นหาด้วยเลขออเดอร์หรือสถานะ',
        rowsPerPage: 'แถวต่อหน้า',
        previous: 'ก่อนหน้า',
        next: 'ถัดไป',
        cleanDescription:
          'เปิดหน้าในเพื่อดูข้อมูลลูกค้า รายการสินค้า การชำระเงิน และราคารวมโดยละเอียด',
      }
    : {
        all: 'All',
        followUp: 'Needs follow-up',
        shown: 'orders shown',
        resultLabel: 'Filtered order list',
        allOrders: 'Orders',
        searchPlaceholder: 'Search by order number or status',
        rowsPerPage: 'Rows per page',
        previous: 'Previous',
        next: 'Next',
        cleanDescription:
          'Open the detail view to review customer, payment, item, and pricing information.',
      };
}

export function getAdminOrdersTableColumns(locale: string) {
  return locale === 'th'
    ? {
        order: 'ออเดอร์',
        customer: 'ลูกค้า',
        createdAt: 'วันที่สร้าง',
        items: 'สินค้า',
        total: 'ยอดรวม',
        status: 'สถานะ',
        followUp: 'ติดตาม',
      }
    : {
        order: 'Order',
        customer: 'Customer',
        createdAt: 'Created',
        items: 'Items',
        total: 'Total',
        status: 'Status',
        followUp: 'Follow-up',
      };
}

export function getAdminOrderDetailText(locale: string) {
  return locale === 'th'
    ? {
        intro:
          'ตรวจสอบสินค้า การชำระเงิน สถานะการยกเลิก และการคืนเงินได้จากหน้าเดียว',
        each: 'ต่อชิ้น',
        totalsDescription: 'สรุปยอดสินค้า ค่าจัดส่ง และสถานะออเดอร์ในมุมเดียว',
        orderStatusLabel: 'สถานะออเดอร์',
        customerLabel: 'ชื่อลูกค้า',
        phoneLabel: 'เบอร์โทร',
        cityPostalLabel: 'เมือง / รหัสไปรษณีย์',
        deliveryAddressLabel: 'ที่อยู่จัดส่ง',
      }
    : {
        intro:
          'Review order items, payment snapshot, cancellation state, and refund handling from one place.',
        each: 'each',
        totalsDescription:
          'See subtotal, shipping, and the current order state in one compact summary.',
        orderStatusLabel: 'Order status',
        customerLabel: 'Customer',
        phoneLabel: 'Phone',
        cityPostalLabel: 'City / postal',
        deliveryAddressLabel: 'Delivery address',
      };
}
