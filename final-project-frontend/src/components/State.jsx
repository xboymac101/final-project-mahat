import React, { useState } from 'react';
function State() {
    // State for user
    const [user, setUser] = useState({ name: '', age: 0 });

    // Function for updating user name
    const updateName = (newName) => {
        setUser((prevUser) => ({
            ...prevUser, // Copy previous state
            name: newName, // Update only name
        }));
    };

    // State for product list
    const [items, setItems] = useState([]);

    // Function for adding new product to list
    const addItem = (newItem) => {
        setItems((prevItems) => [...prevItems, newItem]);
    };

    return (
        <div>
            <h1>User Info</h1>
            <div>
                <p>Name: {user.name}</p>
                <p>Age: {user.age}</p>
                <button onClick={() => updateName('Alice')}>Change Name to Alice</button>
            </div>

            <h1>Items List</h1>
            <div>
                <ul>
                    {items.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
                <button onClick={() => addItem('New Item')}>Add New Item</button>
            </div>
        </div>
    );
}

export default State