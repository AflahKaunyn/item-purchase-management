import { useEffect, useState } from "react";
import { api } from "../services/api";

function Purchases() {
    const [items, setItems] = useState([]);
    const [purchases, setPurchases] = useState([]);

    const [orderId, setOrderId] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);

    const [selectedItem, setSelectedItem] = useState("");
    const [quantity, setQuantity] = useState("");

    const [viewPurchase, setViewPurchase] = useState(null);
    const [editPurchase, setEditPurchase] = useState(null);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadData = async () => {
        try {
            const [itemsData, purchasesData] = await Promise.all([
                api.getItems(),
                api.getPurchases(),
            ]);

            setItems(itemsData);
            setPurchases(purchasesData);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // =========================
    // CREATE PURCHASE
    // =========================

    const addItemToPurchase = () => {
        setError("");

        if (!selectedItem) {
            setError("Please select an item.");
            return;
        }

        if (!quantity || Number(quantity) <= 0) {
            setError("Quantity must be greater than zero.");
            return;
        }

        const item = items.find(
            (item) => item.id === Number(selectedItem)
        );

        if (!item) {
            setError("Selected item not found.");
            return;
        }

        if (!item.active) {
            setError("Inactive items cannot be purchased.");
            return;
        }

        if (Number(quantity) > item.stock_available) {
            setError(
                `Only ${item.stock_available} units of ${item.name} are available.`
            );
            return;
        }

        const alreadyAdded = selectedItems.some(
            (purchaseItem) =>
                purchaseItem.item === item.id
        );

        if (alreadyAdded) {
            setError("This item has already been added.");
            return;
        }

        setSelectedItems([
            ...selectedItems,
            {
                item: item.id,
                item_name: item.name,
                item_type_name: item.item_type_name,
                quantity: Number(quantity),
                stock_available: item.stock_available,
            },
        ]);

        setSelectedItem("");
        setQuantity("");
    };

    const removeItem = (itemId) => {
        setSelectedItems(
            selectedItems.filter(
                (item) => item.item !== itemId
            )
        );
    };

    const handleCreatePurchase = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!orderId.trim()) {
            setError("Order ID is required.");
            return;
        }

        if (!purchaseDate) {
            setError("Purchase date is required.");
            return;
        }

        if (selectedItems.length === 0) {
            setError("Add at least one item to the purchase.");
            return;
        }

        const data = {
            order_id: orderId.trim(),
            purchase_date: purchaseDate,
            items: selectedItems.map((item) => ({
                item: item.item,
                quantity: item.quantity,
            })),
        };

        try {
            await api.createPurchase(data);

            setMessage("Purchase created successfully.");

            setOrderId("");
            setPurchaseDate("");
            setSelectedItems([]);

            await loadData();

        } catch (err) {
            setError(err.message);
        }
    };

    // =========================
    // VIEW PURCHASE
    // =========================

    const handleViewPurchase = async (id) => {
        setError("");
        setMessage("");

        try {
            const data = await api.getPurchase(id);
            setViewPurchase(data);
        } catch (err) {
            setError(err.message);
        }
    };

    // =========================
    // EDIT PURCHASE
    // =========================

    const handleEditPurchase = async (id) => {
        setError("");
        setMessage("");

        try {
            const data = await api.getPurchase(id);

            setEditPurchase({
                id: data.id,
                order_id: data.order_id,
                purchase_date: data.purchase_date,
                items: data.purchase_items.map((item) => ({
                    item: item.item,
                    item_name: item.item_name,
                    item_type_name: item.item_type_name,
                    quantity: item.quantity,
                    stock_available: item.stock_available,
                })),
            });

        } catch (err) {
            setError(err.message);
        }
    };

    const updateEditQuantity = (itemId, quantity) => {
        setEditPurchase((previous) => ({
            ...previous,
            items: previous.items.map((item) =>
                item.item === itemId
                    ? {
                        ...item,
                        quantity: Number(quantity),
                    }
                    : item
            ),
        }));
    };

    const removeEditItem = (itemId) => {
        setEditPurchase((previous) => ({
            ...previous,
            items: previous.items.filter(
                (item) => item.item !== itemId
            ),
        }));
    };

    const addEditItem = () => {
        setError("");

        if (!selectedItem) {
            setError("Please select an item.");
            return;
        }

        if (!quantity || Number(quantity) <= 0) {
            setError("Quantity must be greater than zero.");
            return;
        }

        const item = items.find(
            (item) => item.id === Number(selectedItem)
        );

        if (!item) {
            setError("Item not found.");
            return;
        }

        if (!item.active) {
            setError("Inactive items cannot be added.");
            return;
        }

        const alreadyExists = editPurchase.items.some(
            (purchaseItem) =>
                purchaseItem.item === item.id
        );

        if (alreadyExists) {
            setError("This item is already in the purchase.");
            return;
        }

        setEditPurchase((previous) => ({
            ...previous,
            items: [
                ...previous.items,
                {
                    item: item.id,
                    item_name: item.name,
                    item_type_name: item.item_type_name,
                    quantity: Number(quantity),
                    stock_available: item.stock_available,
                },
            ],
        }));

        setSelectedItem("");
        setQuantity("");
    };

    const handleUpdatePurchase = async () => {
        setError("");
        setMessage("");

        if (!editPurchase.purchase_date) {
            setError("Purchase date is required.");
            return;
        }

        if (editPurchase.items.length === 0) {
            setError("Purchase must contain at least one item.");
            return;
        }

        for (const item of editPurchase.items) {
            if (!item.quantity || item.quantity <= 0) {
                setError(
                    `Quantity for ${item.item_name} must be greater than zero.`
                );
                return;
            }
        }

        const data = {
            order_id: editPurchase.order_id,
            purchase_date: editPurchase.purchase_date,
            items: editPurchase.items.map((item) => ({
                item: item.item,
                quantity: item.quantity,
            })),
        };

        try {
            await api.updatePurchase(
                editPurchase.id,
                data
            );

            setMessage("Purchase updated successfully.");
            setEditPurchase(null);

            await loadData();

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>

            <h1>Purchases</h1>

            {/* =========================
                CREATE PURCHASE
            ========================= */}

            <h2>Create Purchase</h2>

            <form onSubmit={handleCreatePurchase}>

                <div>
                    <label>Order ID</label>
                    <br />

                    <input
                        type="text"
                        placeholder="Example: PO-1001"
                        value={orderId}
                        onChange={(e) =>
                            setOrderId(e.target.value)
                        }
                    />
                </div>

                <br />

                <div>
                    <label>Purchase Date</label>
                    <br />

                    <input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) =>
                            setPurchaseDate(e.target.value)
                        }
                    />
                </div>

                <hr />

                <h3>Add Items</h3>

                <select
                    value={selectedItem}
                    onChange={(e) =>
                        setSelectedItem(e.target.value)
                    }
                >
                    <option value="">
                        Select Item
                    </option>

                    {items
                        .filter((item) => item.active)
                        .map((item) => (
                            <option
                                key={item.id}
                                value={item.id}
                            >
                                {item.name} - Stock:{" "}
                                {item.stock_available}
                            </option>
                        ))}
                </select>

                {" "}

                <input
                    type="number"
                    min="1"
                    placeholder="Quantity"
                    value={quantity}
                    onChange={(e) =>
                        setQuantity(e.target.value)
                    }
                />

                {" "}

                <button
                    type="button"
                    onClick={addItemToPurchase}
                >
                    Add Item
                </button>

                <br />
                <br />

                {selectedItems.length > 0 && (
                    <table border="1" cellPadding="10">

                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Type</th>
                                <th>Quantity</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {selectedItems.map((item) => (
                                <tr key={item.item}>

                                    <td>
                                        {item.item_name}
                                    </td>

                                    <td>
                                        {item.item_type_name}
                                    </td>

                                    <td>
                                        {item.quantity}
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeItem(item.item)
                                            }
                                        >
                                            Remove
                                        </button>
                                    </td>

                                </tr>
                            ))}
                        </tbody>

                    </table>
                )}

                <br />

                <button type="submit">
                    Create Purchase
                </button>

            </form>

            <hr />

            {/* MESSAGES */}

            {message && (
                <p>{message}</p>
            )}

            {error && (
                <p>{error}</p>
            )}

            {/* =========================
                PURCHASE HISTORY
            ========================= */}

            <h2>Purchase History</h2>

            {purchases.length === 0 ? (
                <p>No purchases found.</p>
            ) : (
                <table border="1" cellPadding="10">

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        {purchases.map((purchase) => (
                            <tr key={purchase.id}>

                                <td>
                                    {purchase.id}
                                </td>

                                <td>
                                    {purchase.order_id}
                                </td>

                                <td>
                                    {purchase.purchase_date}
                                </td>

                                <td>
                                    {purchase.purchase_items?.length || 0}
                                </td>

                                <td>

                                    <button
                                        onClick={() =>
                                            handleViewPurchase(
                                                purchase.id
                                            )
                                        }
                                    >
                                        View
                                    </button>

                                    {" "}

                                    <button
                                        onClick={() =>
                                            handleEditPurchase(
                                                purchase.id
                                            )
                                        }
                                    >
                                        Edit
                                    </button>

                                </td>

                            </tr>
                        ))}

                    </tbody>

                </table>
            )}

            {/* =========================
                VIEW PURCHASE
            ========================= */}

            {viewPurchase && (
                <div>

                    <hr />

                    <h2>
                        Purchase Details
                    </h2>

                    <p>
                        <strong>Order ID:</strong>{" "}
                        {viewPurchase.order_id}
                    </p>

                    <p>
                        <strong>Date:</strong>{" "}
                        {viewPurchase.purchase_date}
                    </p>

                    <table border="1" cellPadding="10">

                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Item Type</th>
                                <th>Quantity</th>
                                <th>Current Stock</th>
                            </tr>
                        </thead>

                        <tbody>

                            {viewPurchase.purchase_items.map(
                                (item) => (
                                    <tr key={item.id}>

                                        <td>
                                            {item.item_name}
                                        </td>

                                        <td>
                                            {item.item_type_name}
                                        </td>

                                        <td>
                                            {item.quantity}
                                        </td>

                                        <td>
                                            {item.stock_available}
                                        </td>

                                    </tr>
                                )
                            )}

                        </tbody>

                    </table>

                    <br />

                    <button
                        onClick={() =>
                            setViewPurchase(null)
                        }
                    >
                        Close
                    </button>

                </div>
            )}

            {/* =========================
                EDIT PURCHASE
            ========================= */}

            {editPurchase && (
                <div>

                    <hr />

                    <h2>
                        Edit Purchase
                    </h2>

                    <p>
                        <strong>Order ID:</strong>{" "}
                        {editPurchase.order_id}
                    </p>

                    <label>
                        Purchase Date
                    </label>

                    <br />

                    <input
                        type="date"
                        value={editPurchase.purchase_date}
                        onChange={(e) =>
                            setEditPurchase({
                                ...editPurchase,
                                purchase_date:
                                    e.target.value,
                            })
                        }
                    />

                    <br />
                    <br />

                    <table border="1" cellPadding="10">

                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Type</th>
                                <th>Quantity</th>
                                <th>Current Stock</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            {editPurchase.items.map(
                                (item) => (
                                    <tr key={item.item}>

                                        <td>
                                            {item.item_name}
                                        </td>

                                        <td>
                                            {item.item_type_name}
                                        </td>

                                        <td>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateEditQuantity(
                                                        item.item,
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </td>

                                        <td>
                                            {item.stock_available}
                                        </td>

                                        <td>
                                            <button
                                                onClick={() =>
                                                    removeEditItem(
                                                        item.item
                                                    )
                                                }
                                            >
                                                Remove
                                            </button>
                                        </td>

                                    </tr>
                                )
                            )}

                        </tbody>

                    </table>

                    <br />

                    <h3>Add Another Item</h3>

                    <select
                        value={selectedItem}
                        onChange={(e) =>
                            setSelectedItem(e.target.value)
                        }
                    >
                        <option value="">
                            Select Item
                        </option>

                        {items
                            .filter((item) => item.active)
                            .map((item) => (
                                <option
                                    key={item.id}
                                    value={item.id}
                                >
                                    {item.name} - Stock:{" "}
                                    {item.stock_available}
                                </option>
                            ))}
                    </select>

                    {" "}

                    <input
                        type="number"
                        min="1"
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) =>
                            setQuantity(e.target.value)
                        }
                    />

                    {" "}

                    <button
                        onClick={addEditItem}
                    >
                        Add Item
                    </button>

                    <br />
                    <br />

                    <button
                        onClick={handleUpdatePurchase}
                    >
                        Update Purchase
                    </button>

                    {" "}

                    <button
                        onClick={() =>
                            setEditPurchase(null)
                        }
                    >
                        Cancel
                    </button>

                </div>
            )}

        </div>
    );
}

export default Purchases;