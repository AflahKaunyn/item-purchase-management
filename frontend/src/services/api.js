const API_BASE_URL = "http://127.0.0.1:8000/api";

async function request(endpoint, options = {}) {
    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        }
    );

    // Handle 204 No Content
    if (response.status === 204) {
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ||
            JSON.stringify(data) ||
            "Something went wrong"
        );
    }

    return data;
}

export const api = {

    // Item Types
    getItemTypes: () =>
        request("/item-types/"),

    createItemType: (data) =>
        request("/item-types/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    updateItemType: (id, data) =>
        request(`/item-types/${id}/`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    deleteItemType: (id) =>
        request(`/item-types/${id}/`, {
            method: "DELETE",
        }),

    // Items
    getItems: () =>
        request("/items/"),

    getItem: (id) =>
        request(`/items/${id}/`),

    createItem: (data) =>
        request("/items/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    updateItem: (id, data) =>
        request(`/items/${id}/`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    deleteItem: (id) =>
        request(`/items/${id}/`, {
            method: "DELETE",
        }),

    updateItemStatus: (id, active) =>
        request(`/items/${id}/status/`, {
            method: "PATCH",
            body: JSON.stringify({ active }),
        }),

    // Purchases
    getPurchases: () =>
        request("/purchases/"),

    getPurchase: (id) =>
        request(`/purchases/${id}/`),

    createPurchase: (data) =>
        request("/purchases/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    updatePurchase: (id, data) =>
        request(`/purchases/${id}/`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
};