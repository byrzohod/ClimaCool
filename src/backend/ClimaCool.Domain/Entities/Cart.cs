using System;
using System.Collections.Generic;
using System.Linq;

namespace ClimaCool.Domain.Entities
{
    public class Cart : CatalogBaseEntity
    {
        public Guid? UserId { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public List<CartItem> Items { get; set; } = new();
        public DateTime ExpiresAt { get; set; }
        public DateTime LastAccessedAt { get; set; }
        
        // Calculated properties
        public decimal SubTotal => Items.Sum(i => i.Total);
        public int ItemCount => Items.Sum(i => i.Quantity);
        
        // Navigation properties
        public User? User { get; set; }
        
        public void AddItem(Product product, int quantity, decimal? variantPrice = null)
        {
            if (quantity <= 0)
                throw new ArgumentException("Quantity must be greater than 0");
                
            var existingItem = Items.FirstOrDefault(i => i.ProductId == product.Id);
            
            if (existingItem != null)
            {
                existingItem.Quantity += quantity;
                existingItem.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                Items.Add(new CartItem
                {
                    CartId = Id,
                    ProductId = product.Id,
                    Product = product,
                    Quantity = quantity,
                    Price = variantPrice ?? product.Price,
                    CreatedAt = DateTime.UtcNow
                });
            }
            
            LastAccessedAt = DateTime.UtcNow;
        }
        
        public void UpdateItemQuantity(int productId, int quantity)
        {
            var item = Items.FirstOrDefault(i => i.ProductId == productId);
            if (item == null)
                throw new ArgumentException($"Product {productId} not found in cart");
                
            if (quantity <= 0)
            {
                RemoveItem(productId);
            }
            else
            {
                item.Quantity = quantity;
                item.UpdatedAt = DateTime.UtcNow;
            }
            
            LastAccessedAt = DateTime.UtcNow;
        }
        
        public void RemoveItem(int productId)
        {
            var item = Items.FirstOrDefault(i => i.ProductId == productId);
            if (item != null)
            {
                Items.Remove(item);
                LastAccessedAt = DateTime.UtcNow;
            }
        }
        
        public void Clear()
        {
            Items.Clear();
            LastAccessedAt = DateTime.UtcNow;
        }
        
        public void MergeCart(Cart otherCart)
        {
            foreach (var item in otherCart.Items)
            {
                var existingItem = Items.FirstOrDefault(i => i.ProductId == item.ProductId);
                if (existingItem != null)
                {
                    existingItem.Quantity += item.Quantity;
                    existingItem.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    item.CartId = Id;
                    Items.Add(item);
                }
            }
            
            LastAccessedAt = DateTime.UtcNow;
        }
    }
}