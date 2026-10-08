import { useEffect, useState } from "react";
import { api } from "../services/api";

function ItemTypes() {
    const [itemTypes, setItemTypes] = useState([]);
    const [typeName, setTypeName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadItemTypes = async () => {
        try {
            const data = await api.getItemTypes();
            setItemTypes(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        loadItemTypes();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!typeName.trim()) {
            setError("Item type name is required.");
            return;
        }

        try {
            await api.createItemType({
                type_name: typeName.trim(),
            });

            setTypeName("");
            setMessage("Item type added successfully.");
            loadItemTypes();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdate = async (id) => {
        setError("");
        setMessage("");

        if (!editingName.trim()) {
            setError("Item type name is required.");
            return;
        }

        try {
            await api.updateItemType(id, {
                type_name: editingName.trim(),
            });

            setEditingId(null);
            setEditingName("");
            setMessage("Item type updated successfully.");
            loadItemTypes();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this item type?"
        );

        if (!confirmed) {
            return;
        }

        setError("");
        setMessage("");

        try {
            await api.deleteItemType(id);
            setMessage("Item type deleted successfully.");
            loadItemTypes();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h1>Item Types</h1>

            <form onSubmit={handleAdd}>
                <input
                    type="text"
                    placeholder="Enter item type"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                />

                <button type="submit">
                    Add Item Type
                </button>
            </form>

            {message && (
                <p>{message}</p>
            )}

            {error && (
                <p>{error}</p>
            )}

            <hr />

            <h2>Item Type List</h2>

            {itemTypes.length === 0 ? (
                <p>No item types found.</p>
            ) : (
                <table border="1" cellPadding="10">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Type Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {itemTypes.map((itemType) => (
                            <tr key={itemType.id}>
                                <td>{itemType.id}</td>

                                <td>
                                    {editingId === itemType.id ? (
                                        <input
                                            value={editingName}
                                            onChange={(e) =>
                                                setEditingName(e.target.value)
                                            }
                                        />
                                    ) : (
                                        itemType.type_name
                                    )}
                                </td>

                                <td>
                                    {editingId === itemType.id ? (
                                        <>
                                            <button
                                                onClick={() =>
                                                    handleUpdate(itemType.id)
                                                }
                                            >
                                                Save
                                            </button>

                                            <button
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
                                                onClick={() => {
                                                    setEditingId(itemType.id);
                                                    setEditingName(
                                                        itemType.type_name
                                                    );
                                                }}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDelete(itemType.id)
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
            )}
        </div>
    );
}

export default ItemTypes;