const BASE_URL = "http://127.0.0.1:5000";

export const fetchOrders = async () => {
    try {
        const response = await fetch(`${BASE_URL}/orders`);
        if (!response.ok) throw new Error("Failed to fetch orders");
        return await response.json();
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
};
