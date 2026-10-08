import { useEffect, useState } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Link
} from "react-router-dom";

const API = "https://item-purchase-management-api.onrender.com/api";

async function request(url, options = {}) {
    const response = await fetch(`${API}${url}`, {
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        },
        ...options
    });

    if (response.status === 204) {
        return null;
    }

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.detail ||
            JSON.stringify(data) ||
            "Something went wrong"
        );
    }

    return data;
}

function Navbar() {
    return (
        <nav className="navbar">
            <div className="nav-brand">
                Item & Purchase Management
            </div>

            <div className="nav-links">
                <Link to="/">Dashboard</Link>
                <Link to="/item-types">Item Types</Link>
                <Link to="/items">Items</Link>
                <Link to="/purchases">Purchases</Link>
                <Link to="/stock">Stock</Link>
            </div>
        </nav>
    );
}

function Dashboard() {
    const [items, setItems] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [types, setTypes] = useState([]);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [itemsData, purchasesData, typesData] =
                    await Promise.all([
                        request("/items/"),
                        request("/purchases/"),
                        request("/item-types/")
                    ]);

                setItems(itemsData);
                setPurchases(purchasesData);
                setTypes(typesData);
            } catch (error) {
                console.error(error);
            }
        };

        loadDashboard();
    }, []);

    const activeItems = items.filter(
        (item) => item.active
    ).length;

    const lowStock = items.filter(
        (item) =>
            item.stock_available > 0 &&
            item.stock_available <= 5
    ).length;

    const outOfStock = items.filter(
        (item) => item.stock_available === 0
    ).length;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>
                        Manage items, purchases and stock availability.
                    </p>
                </div>
            </div>

            <div className="cards">
                <div className="card">
                    <div className="card-title">Item Types</div>
                    <div className="card-number">{types.length}</div>
                </div>

                <div className="card">
                    <div className="card-title">Total Items</div>
                    <div className="card-number">{items.length}</div>
                </div>

                <div className="card">
                    <div className="card-title">Active Items</div>
                    <div className="card-number">{activeItems}</div>
                </div>

                <div className="card">
                    <div className="card-title">Purchases</div>
                    <div className="card-number">
                        {purchases.length}
                    </div>
                </div>

                <div className="card warning">
                    <div className="card-title">Low Stock</div>
                    <div className="card-number">{lowStock}</div>
                </div>

                <div className="card danger">
                    <div className="card-title">Out of Stock</div>
                    <div className="card-number">{outOfStock}</div>
                </div>
            </div>

            <div className="quick-actions">
                <h2>Quick Actions</h2>

                <Link className="action-button" to="/items">
                    Manage Items
                </Link>

                <Link className="action-button" to="/purchases">
                    Create Purchase
                </Link>

                <Link className="action-button" to="/stock">
                    Check Stock
                </Link>
            </div>
        </div>
    );
}

function ItemTypes() {
    const [types, setTypes] = useState([]);
    const [name, setName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadTypes = async () => {
        try {
            const data = await request("/item-types/");
            setTypes(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        loadTypes();
    }, []);

    const addType = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!name.trim()) {
            setError("Item type name is required.");
            return;
        }

        try {
            await request("/item-types/", {
                method: "POST",
                body: JSON.stringify({
                    type_name: name.trim()
                })
            });

            setName("");
            setMessage("Item type added successfully.");
            await loadTypes();
        } catch (err) {
            setError(err.message);
        }
    };

    const updateType = async (id) => {
        setError("");
        setMessage("");

        if (!editingName.trim()) {
            setError("Item type name is required.");
            return;
        }

        try {
            await request(`/item-types/${id}/`, {
                method: "PUT",
                body: JSON.stringify({
                    type_name: editingName.trim()
                })
            });

            setEditingId(null);
            setEditingName("");
            setMessage("Item type updated successfully.");

            await loadTypes();
        } catch (err) {
            setError(err.message);
        }
    };

    const deleteType = async (id) => {
        if (!window.confirm("Delete this item type?")) {
            return;
        }

        setError("");
        setMessage("");

        try {
            await request(`/item-types/${id}/`, {
                method: "DELETE"
            });

            setMessage("Item type deleted successfully.");
            await loadTypes();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Item Types</h1>
                    <p>Create and manage item categories.</p>
                </div>
            </div>

            <div className="form-card">
                <form onSubmit={addType} className="inline-form">
                    <input
                        type="text"
                        placeholder="Enter item type"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <button className="primary">
                        Add Item Type
                    </button>
                </form>
            </div>

            <Messages
                message={message}
                error={error}
            />

            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Type Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {types.map((type) => (
                            <tr key={type.id}>
                                <td>{type.id}</td>

                                <td>
                                    {editingId === type.id ? (
                                        <input
                                            value={editingName}
                                            onChange={(e) =>
                                                setEditingName(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    ) : (
                                        type.type_name
                                    )}
                                </td>

                                <td>
                                    {editingId === type.id ? (
                                        <>
                                            <button
                                                className="success"
                                                onClick={() =>
                                                    updateType(type.id)
                                                }
                                            >
                                                Save
                                            </button>

                                            <button
                                                className="secondary"
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setEditingName("");
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="secondary"
                                                onClick={() => {
                                                    setEditingId(type.id);
                                                    setEditingName(
                                                        type.type_name
                                                    );
                                                }}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="danger-button"
                                                onClick={() =>
                                                    deleteType(type.id)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {types.length === 0 && (
                    <div className="empty">
                        No item types found.
                    </div>
                )}
            </div>
        </div>
    );
}

function Items() {
    const [items, setItems] = useState([]);
    const [types, setTypes] = useState([]);

    const [name, setName] = useState("");
    const [itemType, setItemType] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");
    const [stock, setStock] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadData = async () => {
        try {
            const [itemsData, typesData] = await Promise.all([
                request("/items/"),
                request("/item-types/")
            ]);

            setItems(itemsData);
            setTypes(typesData);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setName("");
        setItemType("");
        setPurchaseDate("");
        setStock("");
        setEditingId(null);
    };

    const submitItem = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!name.trim()) {
            setError("Item name is required.");
            return;
        }

        if (!itemType) {
            setError("Select an item type.");
            return;
        }

        if (!purchaseDate) {
            setError("Purchase date is required.");
            return;
        }

        if (stock === "" || Number(stock) < 0) {
            setError("Stock cannot be negative.");
            return;
        }

        const data = {
            name: name.trim(),
            item_type: Number(itemType),
            purchase_date: purchaseDate,
            stock_available: Number(stock)
        };

        try {
            if (editingId) {
                await request(`/items/${editingId}/`, {
                    method: "PUT",
                    body: JSON.stringify(data)
                });

                setMessage("Item updated successfully.");
            } else {
                await request("/items/", {
                    method: "POST",
                    body: JSON.stringify(data)
                });

                setMessage("Item created successfully.");
            }

            resetForm();
            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const editItem = (item) => {
        setEditingId(item.id);
        setName(item.name);
        setItemType(String(item.item_type));
        setPurchaseDate(item.purchase_date);
        setStock(String(item.stock_available));

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const deleteItem = async (id) => {
        if (!window.confirm("Delete this item?")) {
            return;
        }

        setError("");
        setMessage("");

        try {
            await request(`/items/${id}/`, {
                method: "DELETE"
            });

            setMessage("Item deleted successfully.");
            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const changeStatus = async (item) => {
        try {
            await request(`/items/${item.id}/status/`, {
                method: "PATCH",
                body: JSON.stringify({
                    active: !item.active
                })
            });

            setMessage(
                item.active
                    ? "Item deactivated."
                    : "Item activated."
            );

            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Items</h1>
                    <p>Manage items, stock and availability.</p>
                </div>
            </div>

            <div className="form-card">
                <h2>
                    {editingId ? "Edit Item" : "Add New Item"}
                </h2>

                <form onSubmit={submitItem}>
                    <div className="form-grid">
                        <div>
                            <label>Item Name</label>

                            <input
                                type="text"
                                placeholder="Laptop"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label>Item Type</label>

                            <select
                                value={itemType}
                                onChange={(e) =>
                                    setItemType(e.target.value)
                                }
                            >
                                <option value="">
                                    Select Item Type
                                </option>

                                {types.map((type) => (
                                    <option
                                        key={type.id}
                                        value={type.id}
                                    >
                                        {type.type_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>Purchase Date</label>

                            <input
                                type="date"
                                value={purchaseDate}
                                onChange={(e) =>
                                    setPurchaseDate(e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label>Stock Available</label>

                            <input
                                type="number"
                                min="0"
                                value={stock}
                                onChange={(e) =>
                                    setStock(e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button className="primary">
                            {editingId
                                ? "Update Item"
                                : "Add Item"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="secondary"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <Messages
                message={message}
                error={error}
            />

            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Stock</th>
                            <th>Availability</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td>{item.id}</td>

                                <td>
                                    <strong>{item.name}</strong>
                                </td>

                                <td>{item.item_type_name}</td>

                                <td>{item.purchase_date}</td>

                                <td>{item.stock_available}</td>

                                <td>
                                    <span
                                        className={
                                            item.stock_available === 0
                                                ? "badge out"
                                                : item.stock_available <= 5
                                                    ? "badge low"
                                                    : "badge in"
                                        }
                                    >
                                        {item.availability}
                                    </span>
                                </td>

                                <td>
                                    <span
                                        className={
                                            item.active
                                                ? "badge active"
                                                : "badge inactive"
                                        }
                                    >
                                        {item.active
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </td>

                                <td>
                                    <button
                                        className="secondary"
                                        onClick={() =>
                                            editItem(item)
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="secondary"
                                        onClick={() =>
                                            changeStatus(item)
                                        }
                                    >
                                        {item.active
                                            ? "Deactivate"
                                            : "Activate"}
                                    </button>

                                    <button
                                        className="danger-button"
                                        onClick={() =>
                                            deleteItem(item.id)
                                        }
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {items.length === 0 && (
                    <div className="empty">
                        No items found.
                    </div>
                )}
            </div>
        </div>
    );
}

function Purchases() {
    const [items, setItems] = useState([]);
    const [purchases, setPurchases] = useState([]);

    const [orderId, setOrderId] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");

    const [selectedItem, setSelectedItem] = useState("");
    const [quantity, setQuantity] = useState("");

    const [cart, setCart] = useState([]);

    const [viewPurchase, setViewPurchase] = useState(null);
    const [editPurchase, setEditPurchase] = useState(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadData = async () => {
        try {
            const [itemsData, purchasesData] =
                await Promise.all([
                    request("/items/"),
                    request("/purchases/")
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

    const addToCart = () => {
        setError("");

        if (!selectedItem) {
            setError("Select an item.");
            return;
        }

        if (!quantity || Number(quantity) <= 0) {
            setError("Quantity must be greater than zero.");
            return;
        }

        const item = items.find(
            (x) => x.id === Number(selectedItem)
        );

        if (!item) {
            setError("Item not found.");
            return;
        }

        if (!item.active) {
            setError("Inactive items cannot be purchased.");
            return;
        }

        if (item.stock_available <= 0) {
            setError("Item is out of stock.");
            return;
        }

        if (Number(quantity) > item.stock_available) {
            setError(
                `Only ${item.stock_available} units available.`
            );
            return;
        }

        if (cart.some((x) => x.item === item.id)) {
            setError("This item is already added.");
            return;
        }

        setCart([
            ...cart,
            {
                item: item.id,
                item_name: item.name,
                item_type_name: item.item_type_name,
                quantity: Number(quantity),
                stock_available: item.stock_available
            }
        ]);

        setSelectedItem("");
        setQuantity("");
    };

    const removeFromCart = (id) => {
        setCart(
            cart.filter((item) => item.item !== id)
        );
    };

    const createPurchase = async (e) => {
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

        if (cart.length === 0) {
            setError("Add at least one item.");
            return;
        }

        try {
            await request("/purchases/", {
                method: "POST",
                body: JSON.stringify({
                    order_id: orderId.trim(),
                    purchase_date: purchaseDate,
                    items: cart.map((item) => ({
                        item: item.item,
                        quantity: item.quantity
                    }))
                })
            });

            setMessage(
                "Purchase created successfully."
            );

            setOrderId("");
            setPurchaseDate("");
            setCart([]);

            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    
  const view = async (id) => {
    setError("");
    setMessage("");

    try {
        const data = await request(`/purchases/${id}/`);
        setViewPurchase(data);
    } catch (err) {
        setError(err.message);
    }
};

  const edit = async (id) => {
    setError("");
    setMessage("");

    try {
        const data = await request(`/purchases/${id}/`);

        setEditPurchase({
            id: data.id,
            order_id: data.order_id,
            purchase_date: data.purchase_date,
            items: data.purchase_items.map((item) => ({
                item: item.item,
                item_name: item.item_name,
                item_type_name: item.item_type_name,
                quantity: item.quantity,
                stock_available: item.stock_available
            }))
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    } catch (err) {
        setError(err.message);
    }
};


    const updateQuantity = (itemId, value) => {
        setEditPurchase((previous) => ({
            ...previous,
            items: previous.items.map((item) =>
                item.item === itemId
                    ? {
                        ...item,
                        quantity: Number(value)
                    }
                    : item
            )
        }));
    };

    const removeEditItem = (id) => {
        setEditPurchase((previous) => ({
            ...previous,
            items: previous.items.filter(
                (item) => item.item !== id
            )
        }));
    };

    const updatePurchase = async () => {
        setError("");
        setMessage("");

        if (!editPurchase.purchase_date) {
            setError("Purchase date is required.");
            return;
        }

        if (editPurchase.items.length === 0) {
            setError(
                "Purchase must contain at least one item."
            );
            return;
        }

        for (const item of editPurchase.items) {
            if (!item.quantity || item.quantity <= 0) {
                setError(
                    `Invalid quantity for ${item.item_name}.`
                );
                return;
            }
        }

        try {
            await request(
                `/purchases/${editPurchase.id}/`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        order_id: editPurchase.order_id,
                        purchase_date:
                            editPurchase.purchase_date,
                        items: editPurchase.items.map(
                            (item) => ({
                                item: item.item,
                                quantity: item.quantity
                            })
                        )
                    })
                }
            );

            setMessage(
                "Purchase updated successfully."
            );

            setEditPurchase(null);

            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Purchases</h1>
                    <p>
                        Create and manage purchase orders.
                    </p>
                </div>
            </div>

            <Messages
                message={message}
                error={error}
            />

            <div className="form-card">
                <h2>Create Purchase</h2>

                <form onSubmit={createPurchase}>
                    <div className="form-grid">
                        <div>
                            <label>Order ID</label>

                            <input
                                type="text"
                                placeholder="PO-1001"
                                value={orderId}
                                onChange={(e) =>
                                    setOrderId(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div>
                            <label>Purchase Date</label>

                            <input
                                type="date"
                                value={purchaseDate}
                                onChange={(e) =>
                                    setPurchaseDate(
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    <h3>Add Items</h3>

                    <div className="item-add-row">
                        <select
                            value={selectedItem}
                            onChange={(e) =>
                                setSelectedItem(
                                    e.target.value
                                )
                            }
                        >
                            <option value="">
                                Select Item
                            </option>

                            {items
                                .filter(
                                    (item) =>
                                        item.active &&
                                        item.stock_available > 0
                                )
                                .map((item) => (
                                    <option
                                        key={item.id}
                                        value={item.id}
                                    >
                                        {item.name} — Stock:{" "}
                                        {item.stock_available}
                                    </option>
                                ))}
                        </select>

                        <input
                            type="number"
                            min="1"
                            placeholder="Quantity"
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(
                                    e.target.value
                                )
                            }
                        />

                        <button
                            type="button"
                            className="secondary"
                            onClick={addToCart}
                        >
                            Add Item
                        </button>
                    </div>

                    {cart.length > 0 && (
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Type</th>
                                    <th>Quantity</th>
                                    <th>Stock</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {cart.map((item) => (
                                    <tr key={item.item}>
                                        <td>
                                            {item.item_name}
                                        </td>

                                        <td>
                                            {
                                                item.item_type_name
                                            }
                                        </td>

                                        <td>
                                            {item.quantity}
                                        </td>

                                        <td>
                                            {
                                                item.stock_available
                                            }
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="danger-button"
                                                onClick={() =>
                                                    removeFromCart(
                                                        item.item
                                                    )
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

                    <button className="primary">
                        Create Purchase
                    </button>
                </form>
            </div>

            <div className="table-card">
                <h2>Purchase History</h2>

                <table>
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
                                <td>{purchase.id}</td>

                                <td>
                                    <strong>
                                        {purchase.order_id}
                                    </strong>
                                </td>

                                <td>
                                    {purchase.purchase_date}
                                </td>

                                <td>
                                    {purchase.purchase_items?.length || 0}
                                </td>

                                <td>
                                    <button
                                        className="secondary"
                                        onClick={() =>
                                            view(purchase.id)
                                        }
                                    >
                                        View
                                    </button>

                                    <button
                                        className="secondary"
                                        onClick={() =>
                                            edit(purchase.id)
                                        }
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {purchases.length === 0 && (
                    <div className="empty">
                        No purchases found.
                    </div>
                )}
            </div>

           {viewPurchase && (
    <div className="modal-overlay">
        <div className="modal-box">
            <div className="modal-header">
                <div>
                    <h2>Purchase Details</h2>
                    <p>Order information and purchased items</p>
                </div>

                <button
                    type="button"
                    className="close-button"
                    onClick={() => setViewPurchase(null)}
                >
                    ×
                </button>
            </div>

            <div className="purchase-info">
                <div>
                    <span>Order ID</span>
                    <strong>{viewPurchase.order_id}</strong>
                </div>

                <div>
                    <span>Purchase Date</span>
                    <strong>
                        {viewPurchase.purchase_date}
                    </strong>
                </div>
            </div>

            <h3>Purchased Items</h3>

            <table>
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
                                    <strong>
                                        {item.item_name}
                                    </strong>
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

           
        </div>
    </div>
)}
            {editPurchase && (
                <div className="form-card">
                    <h2>Edit Purchase</h2>

                    <p>
                        <strong>Order ID:</strong>{" "}
                        {editPurchase.order_id}
                    </p>

                    <label>Purchase Date</label>

                    <input
                        type="date"
                        value={editPurchase.purchase_date}
                        onChange={(e) =>
                            setEditPurchase({
                                ...editPurchase,
                                purchase_date:
                                    e.target.value
                            })
                        }
                    />

                    <br />
                    <br />

                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Type</th>
                                <th>Quantity</th>
                                <th>Current Stock</th>
                                <th></th>
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
                                            {
                                                item.item_type_name
                                            }
                                        </td>

                                        <td>
                                            <input
                                                type="number"
                                                min="1"
                                                value={
                                                    item.quantity
                                                }
                                                onChange={(e) =>
                                                    updateQuantity(
                                                        item.item,
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </td>

                                        <td>
                                            {
                                                item.stock_available
                                            }
                                        </td>

                                        <td>
                                            <button
                                                className="danger-button"
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

                    <button
                        className="primary"
                        onClick={updatePurchase}
                    >
                        Update Purchase
                    </button>

                    <button
                        className="secondary"
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

function Stock() {
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        request("/items/")
            .then(setItems)
            .catch((err) => setError(err.message));
    }, []);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Stock Availability</h1>
                    <p>
                        Current stock status of all items.
                    </p>
                </div>
            </div>

            {error && (
                <div className="message error">
                    {error}
                </div>
            )}

            <div className="stock-grid">
                {items.map((item) => (
                    <div
                        className="stock-card"
                        key={item.id}
                    >
                        <h3>{item.name}</h3>

                        <p>
                            {item.item_type_name}
                        </p>

                        <div className="stock-number">
                            {item.stock_available}
                        </div>

                        <span
                            className={
                                item.stock_available === 0
                                    ? "badge out"
                                    : item.stock_available <= 5
                                        ? "badge low"
                                        : "badge in"
                            }
                        >
                            {item.availability}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Messages({ message, error }) {
    return (
        <>
            {message && (
                <div className="message success-message">
                    {message}
                </div>
            )}

            {error && (
                <div className="message error">
                    {error}
                </div>
            )}
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Navbar />

            <main className="container">
                <Routes>
                    <Route
                        path="/"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/item-types"
                        element={<ItemTypes />}
                    />

                    <Route
                        path="/items"
                        element={<Items />}
                    />

                    <Route
                        path="/purchases"
                        element={<Purchases />}
                    />

                    <Route
                        path="/stock"
                        element={<Stock />}
                    />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App;