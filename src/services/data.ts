import { handleAuthError } from "@/utils/authUtils";
import axios from "axios";

export const BASE_URL =
    import.meta.env.VITE_BASE_URL || "https://faceid.afandicloud.uz/";

axios.interceptors.request.use(
    (config) => {
        if (config.url?.includes("avtozapchast.netlify.app")) {
            console.warn(
                "Blocked request to avtozapchast.netlify.app:",
                config.url
            );
            return Promise.reject(
                new Error("Request blocked: avtozapchast.netlify.app")
            );
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (handleAuthError(error)) {
            return Promise.resolve({ data: { handled: true } });
        }
        return Promise.reject(error);
    }
);

export const GetDataSimpleBlob = async (url: string, config: any = {}) => {
    const token = localStorage.getItem("token"); // yoki sessionStorage

    const response = await axios.get(BASE_URL + url, {
        responseType: "blob", // rasm uchun blob kerak
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...config.headers,
        },
        ...config,
    });

    return response.data;
};

const getToken = () => localStorage.getItem("token");
export const Role = localStorage.getItem("role");

const withAuthHeaders = (headers: Record<string, string> = {}) => {
    const token = getToken();
    if (!token) return headers;
    return {
        Authorization: `Bearer ${token}`,
        ...headers,
    };
};

export const PostData = async (url: string, data: any) => {
    const response = await axios.post(BASE_URL + url, data);
    return response;
};

export const PostDataToken = async (url: string, data: any) => {
    const response = await axios.post(BASE_URL + url, data, {
        headers: {
            "Content-Type": "multipart/formData",
            ...withAuthHeaders(),
        },
    });
    return response;
};

export const PostDocxContract = async (
    url: string,
    contractData: any,
    docxBlob: Blob
) => {
    const formData = new FormData();
    formData.append("contract_file", docxBlob, "shartnoma.docx");
    formData.append("contract_data", JSON.stringify(contractData));

    const response = await axios.post(BASE_URL + url, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
            ...withAuthHeaders(),
        },
    });
    return response;
};

export const PostDataTokenJson = async (url: string, data: any) => {
    const response = await axios.post(BASE_URL + url, data, {
        headers: {
            ...withAuthHeaders(),
        },
    });
    return response;
};

export const PostSimple = async (url: string, data: any = {}) => {
    const response = await axios.post(BASE_URL + url, data, {
        headers: {
            ...withAuthHeaders(),
        },
    });
    return response;
};

export const GetDataSimple = async (url: string) => {
    const headers = withAuthHeaders();
    const response = await axios.get(BASE_URL + url, { headers });
    return response.data;
};
export const GetDataSimpleUrl = async (url: string) => {
    const headers = withAuthHeaders();
    const targetUrl = url.startsWith("http") ? url : BASE_URL + url;
    const response = await axios.get(targetUrl, { headers });
    return response.data;
};

export const DeleteData = async (url: string) => {
    const response = await axios.delete(BASE_URL + url, {
        headers: {
            ...withAuthHeaders(),
        },
    });
    return response;
};

// Payments API functions
export const GetPaymentsList = async (page: number = 1, limit: number = 10) => {
    const response = await GetDataSimple(
        `api/payments/list?page=${page}&limit=${limit}`
    );
    return response;
};

export const CreatePayment = async (paymentData: {
    arrival_id: number;
    payment_amount: number;
    payment_method: number; // 1-Наличка, 2-Терминал, 3-Клик, 4-Перечисление
    cash_type: number; // 0 - Доллар, 1 - сум
    comments?: string;
}) => {
    const response = await PostDataTokenJson(
        "api/payments/create",
        paymentData
    );
    return response;
};

export const SearchPayments = async (keyword: string) => {
    const response = await GetDataSimple(
        `api/payments/search?keyword=${keyword}`
    );
    return response;
};

export const DeletePayment = async (paymentId: number) => {
    const response = await DeleteData(`api/payments/delete/${paymentId}`);
    return response;
};

// Arrivals search function
export const SearchArrivals = async (keyword: string) => {
    const response = await PostSimple(
        `api/arrival/search?keyword=${encodeURIComponent(keyword)}`
    );
    return response;
};

// Products API functions
export const GetProductsList = async (page: number = 1, limit: number = 10) => {
    const response = await GetDataSimple(
        `api/products/list?page=${page}&limit=${limit}`
    );
    return response;
};

export const CreateProduct = async (productData: {
    product_name: string;
    product_code?: string;
    image_id?: number;
    description?: string;
}) => {
    const response = await PostDataTokenJson(
        "api/products/create",
        productData
    );
    return response;
};

export const UpdateProduct = async (
    productId: number,
    productData: {
        product_name: string;
        product_code?: string;
        image_id?: number;
        description?: string;
    }
) => {
    const response = await PostDataTokenJson(
        `api/products/update/${productId}`,
        productData
    );
    return response;
};

export const SearchProducts = async (keyword: string) => {
    const response = await PostSimple(
        `api/products/search?keyword=${encodeURIComponent(keyword)}`
    );
    return response;
};

export const DeleteProduct = async (productId: number) => {
    const response = await DeleteData(`api/products/delete/${productId}`);
    return response;
};

export const UploadProductImage = async (imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await PostDataToken("api/products/image", formData);
    return response;
};

export const GetProductImage = async (imageId: number) => {
    const response = await GetDataSimpleBlob(`api/products/image/${imageId}`);
    return response;
};

export const UpdateProductPrice = async (
    productId: number,
    sellingPrice: number
) => {
    const response = await PostDataTokenJson("api/products/updateprice", {
        product_id: productId,
        selling_price: sellingPrice,
    });
    return response;
};

// Attendance API functions
export const GetDailyAttendance = async (date: string, page: number = 1) => {
    const response = await GetDataSimple(
        `api/attendance/daily?date=${date}&page=${page}`
    );
    return response;
};

// FaceID User API functions
export const DeleteFaceIdUser = async (userId: number) => {
    const response = await PostSimple(`api/faceid/delete/user/${userId}`, {});
    return response;
};

export const DownloadAttendanceExcel = async (month: string) => {
    const token = getToken();
    const response = await axios.get(
        BASE_URL + `api/excel/attendance?month=${month}`,
        {
            responseType: "blob",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        }
    );
    return response.data;
};
