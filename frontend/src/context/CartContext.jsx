import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('gobi_cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('gobi_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // FUNGSI TAMBAH KE KERANJANG
    const addToCart = (product, qty = 1, note = '', variants = []) => {
        const cleanNote = note ? note.trim() : '';
        // Buat ID Unik berbasis ID Produk + Varian + Catatan agar tidak tertukar
        const variantString = variants.length > 0 ? variants.sort().join('-') : '';
        const cartId = `${product.id}-${variantString}-${cleanNote.toLowerCase()}`;

        setCartItems((prevItems) => {
            const itemIndex = prevItems.findIndex((item) => item.cartId === cartId);

            if (itemIndex >= 0) {
                const newItems = [...prevItems];
                newItems[itemIndex] = {
                    ...newItems[itemIndex],
                    qty: newItems[itemIndex].qty + qty
                };
                return newItems;
            }

            return [
                ...prevItems,
                {
                    ...product,
                    cartId: cartId,
                    qty: qty,
                    note: cleanNote,
                    variants: variants // <-- Simpan array varian secara mandiri
                }
            ];
        });
    };

    // TAMBAH QTY
    const handleIncreaseQty = (identifier) => {
        setCartItems((prev) =>
            prev.map((item) =>
                (item.cartId === identifier || item.id === identifier)
                    ? { ...item, qty: item.qty + 1 }
                    : item
            )
        );
    };

    // KURANGI QTY
    const handleDecreaseQty = (identifier) => {
        setCartItems((prev) =>
            prev
                .map((item) =>
                    (item.cartId === identifier || item.id === identifier)
                        ? { ...item, qty: item.qty - 1 }
                        : item
                )
                .filter((item) => item.qty > 0)
        );
    };

    // HAPUS ITEM
    const handleRemoveItem = (identifier) => {
        setCartItems((prev) =>
            prev.filter((item) => item.cartId !== identifier && item.id !== identifier)
        );
    };

    // BERSIHKAN KERANJANG
    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('gobi_cart');
    };

    // HITUNG TOTAL
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            handleIncreaseQty,
            handleDecreaseQty,
            handleRemoveItem,
            clearCart,
            totalAmount,
            totalItems
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);