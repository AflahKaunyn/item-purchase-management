import { useEffect, useState } from "react";
import { api } from "../services/api";

function Items() {
    const [items, setItems] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);

    const [name, setName] = useState("");
    const [itemType, setItemType] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");
    const [stock, setStock] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadData = async () => {
        try {
            const [itemsData, typesData] = await Promise.all([
                api.getItems(),
                api.getItemTypes(),
            ]);

            setItems(itemsData);
            setItemTypes(typesData);
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!name.trim()) {
            setError("Item name is required.");
            return;
        }

        if (!itemType) {
            setError("Please select an item type.");
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
            stock_available: Number(stock),
        };

        try {
            if (editingId) {
                await api.updateItem(editingId, data);
                setMessage("Item updated successfully.");
            } else {
                await api.createItem(data);
                setMessage("Item created successfully.");
            }

            resetForm();
            await loadData();

        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setName(item.name);
        setItemType(String(item.item_type));
        setPurchaseDate(item.purchase_date);
        setStock(String(item.stock_available));

        setError("");
        setMessage("");
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this item?"
        );

        if (!confirmed) {
            return;
        }

        setError("");
        setMessage("");

        try {
            await api.deleteItem(id);

            setMessage("Item deleted successfully.");

            await loadData();

        } catch (err) {
            setError(err.message);
        }
    };

    const handleStatusChange = async (item) => {
        try {
            await api.updateItemStatus(
                item.id,
                !item.active
            );

            setMessage(
                item.active
                    ? "Item deactivated successfully."
                    : "Item activated successfully."
            );

            await loadData();

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h1>Items</h1>

            {/* FORM */}

            <form onSubmit={handleSubmit}>

                <div>
                    <label>Item Name</label>
                    <br />

                    <input
                        type="text"
                        value={name}
                        placeholder="Enter item name"
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <br />

                <div>
                    <label>Item Type</label>
                    <br />

                    <select
                        value={itemType}
                        onChange={(e) => setItemType(e.target.value)}
                    >
                        <option value="">
                            Select Item Type
                        </option>

                        {itemTypes.map((type) => (
                            <option
                                key={type.id}
                                value={type.id}
                            >
                                {type.type_name}
                            </option>
                        ))}
                    </select>
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

                <br />

                <div>
                    <label>Stock Available</label>
                    <br />

                    <input
                        type="number"
                        min="0"
                        value={stock}
                        placeholder="Enter stock"
                        onChange={(e) =>
                            setStock(e.target.value)
                        }
                    />
                </div>

                <br />

                <button type="submit">
                    {editingId ? "Update Item" : "Add Item"}
                </button>

                {editingId && (
                    <button
                        type="button"
                        onClick={resetForm}
                    >
                        Cancel
                    </button>
                )}

            </form>

            {/* MESSAGES */}

            {message && (
                <p>{message}</p>
            )}

            {error && (
                <p>{error}</p>
            )}

            <hr />

            {/* ITEMS TABLE */}

            <h2>Item List</h2>

            {items.length === 0 ? (
                <p>No items found.</p>
            ) : (
                <table border="1" cellPadding="10">

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Purchase Date</th>
                            <th>Stock</th>
                            <th>Availability</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        {items.map((item) => (
                            <tr key={item.id}>

                                <td>
                                    {item.id}
                                </td>

                                <td>
                                    {item.name}
                                </td>

                                <td>
                                    {item.item_type_name}
                                </td>

                                <td>
                                    {item.purchase_date}
                                </td>

                                <td>
                                    {item.stock_available}
                                </td>

                                <td>
                                    {item.availability}
                                </td>

                                <td>
                                    {item.active
                                        ? "Active"
                                        : "Inactive"}
                                </td>

                                <td>

                                    <button
                                        onClick={() =>
                                            handleEdit(item)
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleStatusChange(item)
                                        }
                                    >
                                        {item.active
                                            ? "Deactivate"
                                            : "Activate"}
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleDelete(item.id)
                                        }
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>
                        ))}

                    </tbody>

                </table>
            )}
        </div>
    );
}

export default Items;