"use client";
import { Button } from "@/components/ui/atoms/button";
import { useBusiness } from "@/hooks/useBusiness";
import { useCreateOnlineOrderWithSSLMutation } from "@/lib/api/publicApi";
import type { TCartItem } from "@/lib/features/cart/cartSlice";
import { formatCurrency } from "@/utils/formatCurrency";
import {
    getTrackingData,
    storeCustomerData,
    trackAddPaymentInfo,
    trackAddShippingInfo,
    trackBeginCheckout,
    trackCODPlace,
    trackOrderPlace,
    trackPurchase
} from "@/utils/gtm";
import { normalizePhone } from "@/utils/normalizePhone";
import {
    getCustomerSource,
    getTikTokClickId
} from "@/utils/sourceTracking";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DeliveryInfoForm from "../../checkout/_components/DeliveryInfoForm";
import CustomCartSummary from "./CustomCartSummary";

interface FormData {
    name: string;
    phone: string;
    address: string;
    delivery_area: string;
    note: string;
    paymentMethod: string;
}

interface FormErrors {
    name: string;
    phone: string;
    address: string;
    delivery_area: string;
    note: string;
}

interface PaymentMethod {
    name: string;
    logo: string;
}

export interface CustomCheckoutFormRef {
    submitForm: () => void;
}

interface CustomCheckoutFormProps {
    items: TCartItem[];
    removeItem: (id: string, variantId?: string) => void;
    updateItemQuantity: (id: string, variantId: string | undefined, qty: number) => void;
    onBeforeSubmit?: () => Promise<boolean> | boolean;
    hideCartSummary?: boolean;
}

const CustomCheckoutForm = React.forwardRef<CustomCheckoutFormRef, CustomCheckoutFormProps>(({ items, removeItem, updateItemQuantity, onBeforeSubmit, hideCartSummary }, ref) => {
    const router = useRouter();
    const { businessData } = useBusiness();
    const [createOnlineOrder, { isLoading: isOrderLoading }] = useCreateOnlineOrderWithSSLMutation();

    const [formData, setFormData] = useState<FormData>({
        name: "",
        phone: "",
        address: "",
        delivery_area: "",
        note: "",
        paymentMethod: "cashOnDelivery",
    });

    const [formErrors, setFormErrors] = useState<FormErrors>({
        name: "",
        phone: "",
        address: "",
        delivery_area: "",
        note: "",
    });

    const [additional_discount_amount, setAdditionalDiscountAmount] = useState(0);

    const availablePaymentMethods = useMemo<PaymentMethod[]>(() => {
        if (
            businessData?.ssl_commerz?.account_id &&
            businessData?.ssl_commerz?.isActive_SSLCommerz
        ) {
            if (businessData.ssl_commerz.payment_methods.length > 0) {
                return businessData.ssl_commerz.payment_methods;
            }
            return [{ name: "Pay Now", logo: "/assets/payOnline.jpg" }];
        }
        return [];
    }, [businessData]);

    useEffect(() => {
        if (formData.paymentMethod === "bKash") {
            setAdditionalDiscountAmount(0);
        } else {
            setAdditionalDiscountAmount(0);
        }
    }, [formData.paymentMethod]);

    const currency = businessData?.currency?.[0] ?? "BDT";

    const deliveryCharge = useMemo(() => {
        if (!businessData) return 0;
        if (
            businessData?.defaultCourier === null ||
            businessData?.defaultCourier === "office-delivery"
        )
            return 0;
        switch (formData.delivery_area) {
            case "inside_dhaka":
                return businessData.insideDhaka;
            case "sub_dhaka":
                return businessData.subDhaka;
            case "outside_dhaka":
                return businessData.outsideDhaka;
            default:
                return 0;
        }
    }, [formData.delivery_area, businessData]);

    const currentSubtotal = items.reduce(
        (sum: number, item: TCartItem) => sum + item.price * item.quantity,
        0,
    );

    const total = useMemo(
        () => currentSubtotal + deliveryCharge - additional_discount_amount,
        [currentSubtotal, deliveryCharge, additional_discount_amount],
    );

    useEffect(() => {
        if (items.length > 0) {
            trackBeginCheckout(items, total);
        }
    }, [items, total, currentSubtotal]);

    const validateForm = () => {
        const errors: FormErrors = {
            name: "",
            phone: "",
            address: "",
            delivery_area: "",
            note: "",
        };
        let hasError = false;
        let firstErrorField: string | null = null;

        if (!formData.name.trim()) {
            errors.name = "সর্বনিম্ন ৩ অক্ষরের নাম দিন";
            hasError = true;
            if (!firstErrorField) firstErrorField = "name";
        } else if (formData.name.trim().length < 3) {
            errors.name = "সর্বনিম্ন ৩ অক্ষরের নাম দিন";
            hasError = true;
            if (!firstErrorField) firstErrorField = "name";
        }
        if (!formData.phone.trim()) {
            errors.phone = "আপনার ফোন নাম্বার দিন";
            hasError = true;
            if (!firstErrorField) firstErrorField = "phone";
        } else if (!/^01\d{9}$/.test(formData.phone)) {
            errors.phone = "সঠিক ফোন নাম্বার দিন (01xxxxxxxxx)";
            hasError = true;
            if (!firstErrorField) firstErrorField = "phone";
        }
        if (!formData.address) {
            errors.address = "আপনার ঠিকানা দিন";
            hasError = true;
            if (!firstErrorField) firstErrorField = "address";
        } else if (formData.address.trim().length < 10) {
            errors.address = "ডেলিভারি ঠিকানা কমপক্ষে ১০ অক্ষরের হতে হবে";
            hasError = true;
            if (!firstErrorField) firstErrorField = "address";
        }
        if (!formData.delivery_area) {
            errors.delivery_area = "ডেলিভারি এলাকা নির্বাচন করুন";
            hasError = true;
            if (!firstErrorField) firstErrorField = "delivery_area";
        }
        if (formData.note && formData.note.length < 5) {
            errors.note = "নোট কমপক্ষে ৫ অক্ষরের হতে হবে";
            hasError = true;
            if (!firstErrorField) firstErrorField = "note";
        }

        setFormErrors(errors);
        return { hasError, firstErrorField };
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value } = e.target;
        const updatedValue = name === "phone" ? normalizePhone(value) : value;

        setFormData((prev) => ({ ...prev, [name]: updatedValue }));
        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handlePaymentMethodChange = (method: string) => {
        setFormData((prev) => ({ ...prev, paymentMethod: method }));
    };

    const getBackendPaymentMethod = (frontendMethod: string) => {
        switch (frontendMethod) {
            case "cashOnDelivery":
                return "cod";
            case "Pay Now":
                return "ssl";
            default:
                return frontendMethod;
        }
    };

    const prepareOrderPayload = () => {
        const products = items.map((item: TCartItem) => ({
            productId: item._id,
            quantity: item.quantity,
            variantId: item.variantId,
        }));

        return {
            customer_name: formData.name,
            customer_phone: formData.phone,
            customer_address: formData.address,
            delivery_area: formData.delivery_area,
            customer_note: formData.note || undefined,
            products,
            additional_discount_type:
                additional_discount_amount > 0 ? "fixed" : undefined,
            additional_discount_amount:
                additional_discount_amount > 0
                    ? additional_discount_amount.toString()
                    : undefined,
            due: total.toString(),
            payment_method: getBackendPaymentMethod(formData.paymentMethod),
            customer_source: getCustomerSource(),
            ttclid: getTikTokClickId(),
            tracking: getTrackingData(),
        };
    };

    const scrollToFirstError = (fieldName: string) => {
        const fieldElement = document.getElementById(fieldName);
        if (fieldElement) {
            const isMobile = window.innerWidth < 768;
            const offsetTop = fieldElement.offsetTop;
            const scrollOffset = isMobile ? 120 : 100;

            window.scrollTo({
                top: offsetTop - scrollOffset,
                behavior: "smooth",
            });

            setTimeout(() => {
                fieldElement.focus();
            }, 500);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (onBeforeSubmit) {
            const canProceed = await onBeforeSubmit();
            if (!canProceed) return;
        }

        if (items.length === 0) {
            toast.error("আপনার কার্ট খালি");
            return;
        }

        const { hasError, firstErrorField } = validateForm();
        if (hasError) {
            if (firstErrorField) {
                scrollToFirstError(firstErrorField);
            }
            return;
        }

        const backendPaymentMethod = getBackendPaymentMethod(
            formData.paymentMethod,
        );

        if (!backendPaymentMethod) {
            toast.error("অবৈধ পেমেন্ট পদ্ধতি");
            return;
        }

        const orderPayload = prepareOrderPayload();
        console.log("=== PRODUCT CHECKOUT ORDER REQUEST PAYLOAD ===", orderPayload);

        try {
            const response = await createOnlineOrder(orderPayload).unwrap();
            console.log("=== PRODUCT CHECKOUT ORDER RESPONSE ===", response);

            if (response.success) {
                const orderId = response.data?.orderId;
                const backendOrderId = response.data?._id;

                sessionStorage.setItem(
                    `orderId-${orderId}`,
                    JSON.stringify(items) || "",
                );

                storeCustomerData({
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                    city: "Dhaka",
                });

                trackAddShippingInfo(
                    items,
                    total,
                    formData.delivery_area === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka",
                    undefined
                );

                trackAddPaymentInfo(
                    items,
                    total,
                    getBackendPaymentMethod(formData.paymentMethod) as "cod" | "online",
                    undefined
                );

                trackOrderPlace({
                    orderId: backendOrderId || orderId,
                    totalValue: total,
                    items: items,
                    paymentMethod: getBackendPaymentMethod(formData.paymentMethod) as "cod" | "online",
                });

                // Fire Purchase event directly (no backend confirmation needed)
                trackPurchase({
                    transactionId: backendOrderId || orderId,
                    items: items,
                    totalValue: total,
                    shipping: deliveryCharge,
                    paymentMethod: getBackendPaymentMethod(formData.paymentMethod),
                    customer: {
                        name: formData.name,
                        phone: formData.phone,
                        address: formData.address,
                        delivery_area: formData.delivery_area,
                    },
                });

                if (formData.paymentMethod === "cashOnDelivery") {
                    trackCODPlace(backendOrderId || orderId, total, items);
                    const successUrl = new URL("/orderstatus", window.location.origin);
                    successUrl.searchParams.set("status", "success");
                    successUrl.searchParams.set("orderId", orderId);
                    successUrl.searchParams.set("_id", backendOrderId);
                    successUrl.searchParams.set(
                        "customerName",
                        encodeURIComponent(formData.name),
                    );
                    successUrl.searchParams.set(
                        "customerPhone",
                        encodeURIComponent(formData.phone),
                    );
                    successUrl.searchParams.set(
                        "customerAddress",
                        encodeURIComponent(formData.address),
                    );
                    successUrl.searchParams.set("total", total.toString());
                    successUrl.searchParams.set(
                        "deliveryCharge",
                        deliveryCharge.toString(),
                    );
                    successUrl.searchParams.set(
                        "itemCount",
                        items.length.toString(),
                    );
                    successUrl.searchParams.set("paymentMethod", "cashOnDelivery");
                    successUrl.searchParams.set(
                        "additionalDiscount",
                        additional_discount_amount.toString(),
                    );

                    items.forEach((item: any, index: number) => {
                        successUrl.searchParams.set(
                            `itemName${index}`,
                            encodeURIComponent(item.name),
                        );
                        successUrl.searchParams.set(
                            `itemPrice${index}`,
                            item.price.toString(),
                        );
                        successUrl.searchParams.set(
                            `itemQty${index}`,
                            item.quantity.toString(),
                        );
                        if (item.image) {
                            successUrl.searchParams.set(
                                `itemImage${index}`,
                                encodeURIComponent(item.image)
                            );
                        }
                    });

                    window.location.href = successUrl.toString();
                    toast.success("অর্ডার সফলভাবে স্থাপন করা হয়েছে!");
                } else {
                    const gatewayUrl =
                        response?.data?.selectedGatewayUrl || response?.data?.allGatewayUrl;
                    if (gatewayUrl) {
                        window.location.href = gatewayUrl;
                    } else {
                        toast.error("পেমেন্ট গেটওয়ে অনুপলব্ধ");
                    }
                }
            } else {
                toast.error(response.message || "অর্ডার তৈরি ব্যর্থ হয়েছে");
            }
        } catch (error: any) {
            toast.error(error?.data?.message || "একটি ত্রুটি ঘটেছে");
        }
    };

    const overlayActive = isOrderLoading;

    React.useImperativeHandle(ref, () => ({
        submitForm: () => {
            handleSubmit();
        }
    }));

    return (
        <div className="relative">
            {overlayActive && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="animate-spin h-14 w-14 border-4 border-white border-t-transparent rounded-full" />
                </div>
            )}

            <div className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 ">
                    {!hideCartSummary && (
                        <section className="lg:col-span-6 flex flex-col order-2">

                            <div className="rounded-xl overflow-hidden shadow-sm border border-primary/15 dark:border-gray-700 bg-white dark:bg-gray-900 flex-1">
                                {/* Banner message for the user regarding variant/size selection over the phone */}
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 sm:p-6 shadow-sm hidden md:block md:mb-6">
                                    <p className="text-orange-800 text-center font-semibold text-[12px] sm:text-[14px]">
                                        অর্ডার প্লেস করার পর, shoppersbd সাপোর্ট টিমের একজন প্রতিনিধি আপনার সাথে যোগাযোগ করে প্রোডাক্টের সাইজ ও বিস্তারিত নিশ্চিত করবেন।
                                    </p>
                                </div>
                                <div className="bg-primary px-4 py-3">
                                    <h2 className="text-[15px] font-semibold text-white">
                                        Shopping Items
                                    </h2>
                                </div>
                                <div className="lg:p-4 p-1">
                                    <CustomCartSummary
                                        items={items}
                                        deliveryCharge={deliveryCharge}
                                        total={total}
                                        currency={currency}
                                        additional_discount_amount={additional_discount_amount}
                                        removeItem={removeItem}
                                        updateItemQuantity={updateItemQuantity}
                                        isLoading={isOrderLoading}
                                        handleSubmit={handleSubmit}
                                    />
                                </div>

                                {/* Banner message for the user regarding variant/size selection over the phone */}
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 sm:p-6 shadow-sm md:hidden lg:hidden block">
                                    <p className="text-orange-800 text-center font-semibold text-[12px] sm:text-[14px]">
                                        অর্ডার প্লেস করার পর, shoppersbd সাপোর্ট টিমের একজন প্রতিনিধি আপনার সাথে যোগাযোগ করে প্রোডাক্টের সাইজ ও বিস্তারিত নিশ্চিত করবেন।
                                    </p>
                                </div>
                            </div>

                        </section>
                    )}
                    <section className={`space-y-4 flex flex-col order-2 lg:order-2 ${hideCartSummary ? 'lg:col-span-8 lg:col-start-3' : 'lg:col-span-6'}`}>
                        <div className="rounded-xl overflow-hidden shadow-sm border bg-white dark:bg-gray-900 border-primary/15 dark:border-gray-800 flex-1">
                            <div className="p-1 lg:p-5">
                                <DeliveryInfoForm
                                    formData={formData}
                                    formErrors={formErrors}
                                    insideFee={
                                        businessData?.defaultCourier === null ||
                                            businessData?.defaultCourier === "office-delivery"
                                            ? 0
                                            : businessData?.insideDhaka || 0
                                    }
                                    subDhakaFee={
                                        businessData?.defaultCourier === null ||
                                            businessData?.defaultCourier === "office-delivery"
                                            ? 0
                                            : businessData?.subDhaka || 0
                                    }
                                    outsideFee={
                                        businessData?.defaultCourier === null ||
                                            businessData?.defaultCourier === "office-delivery"
                                            ? 0
                                            : businessData?.outsideDhaka || 0
                                    }
                                    isLoading={isOrderLoading}
                                    handleChange={handleChange}
                                    handlePaymentMethodChange={handlePaymentMethodChange}
                                    handleSubmit={handleSubmit}
                                    onBack={() => router.back()}
                                    availablePaymentMethods={availablePaymentMethods}
                                    hideBackButton={true}
                                />
                            </div>
                        </div>
                    </section>

                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {!hideCartSummary && (
                    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white dark:bg-gray-900 shadow-2xl border-t px-4 py-4 z-[60]">
                        <div className="pb-3">
                            <h2 className="text-lg font-semibold text-black dark:text-white">
                                Cart Total
                            </h2>
                            <div className="w-full">
                                <div className="flex flex-col gap-1 sm:gap-2 sm:mt-2 text-sm">
                                    <div className="flex justify-between text-black dark:text-white">
                                        <p>সাব-টোটাল</p>
                                        <p>{formatCurrency(currentSubtotal, currency)}</p>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between text-black dark:text-white">
                                        <p>ডেলিভারি চার্জ</p>
                                        <p>{formatCurrency(deliveryCharge, currency)}</p>
                                    </div>
                                    <hr />
                                    {additional_discount_amount > 0 && (
                                        <div className="flex justify-between text-black dark:text-white">
                                            <p>বিকাশ ডিসকাউন্ট</p>
                                            <p>
                                                [&minus;]{" "}
                                                {formatCurrency(additional_discount_amount, currency)}
                                            </p>
                                        </div>
                                    )}
                                    {additional_discount_amount > 0 && <hr />}
                                    <div className="flex justify-between text-black dark:text-white">
                                        <p>
                                            <strong>টোটাল বিল</strong>
                                        </p>
                                        <p className="font-bold">{formatCurrency(total, currency)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Button
                            title="order"
                            type="submit"
                            disabled={isOrderLoading}
                            variant="custom"
                            className="w-full"
                        >
                            {isOrderLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                                    প্রসেস হচ্ছে...
                                </div>
                            ) : formData.paymentMethod === "cashOnDelivery" ? (
                                <>
                                    <span className="mr-2">🛒</span> ক্যাশ অন ডেলিভারিতে অর্ডার করুন
                                </>
                            ) : (
                                <>
                                    <span className="mr-2">🛒</span> অর্ডারটি নিশ্চিত করুন
                                </>
                            )}
                        </Button>
                    </div>
                )}
                {hideCartSummary && (
                    <div className="px-2 md:px-0 mt-4 md:mt-2 xl:w-[66.666%] xl:mx-auto md:pb-0 pb-20">
                        <Button
                            title="order"
                            type="submit"
                            disabled={isOrderLoading}
                            variant="custom"
                            className="w-full h-12 text-lg"
                        >
                            {isOrderLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                                    প্রসেস হচ্ছে...
                                </div>
                            ) : formData.paymentMethod === "cashOnDelivery" ? (
                                <>
                                    <span className="mr-2">🛒</span> ক্যাশ অন ডেলিভারিতে অর্ডার করুন
                                </>
                            ) : (
                                <>
                                    <span className="mr-2">🛒</span> অর্ডারটি নিশ্চিত করুন
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
});

export default CustomCheckoutForm;
