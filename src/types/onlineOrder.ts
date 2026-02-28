import type { CustomerSource } from "@/utils/sourceTracking";

export interface TrackingData {
  clickId?: string;    // _fbc cookie value (or constructed from fbclid)
  browserId?: string;  // _fbp cookie value
  fbclid?: string;     // Raw fbclid from URL params
  ipAddress?: string;  // Visitor's real IP address
  userAgent?: string;  // Browser user agent
  externalId?: string; // Generated visitor UUID
}

export interface OnlineOrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_area: string;
  customer_note?: string;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
  additional_discount_type?: string;
  additional_discount_amount?: string;
  due: string;
  payment_method: string;
  customer_source?: CustomerSource; // Add here
  tracking?: TrackingData;
}

export interface OnlineOrderResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    message: string;
    orderId: string;
    _id: string;
    selectedGatewayUrl?: string;
    allGatewayUrl?: string;
  };
}
