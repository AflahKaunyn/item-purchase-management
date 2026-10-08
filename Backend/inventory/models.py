from django.db import models


class ItemType(models.Model):
    type_name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.type_name


class Item(models.Model):
    name = models.CharField(max_length=200)
    item_type = models.ForeignKey(
        ItemType,
        on_delete=models.PROTECT,
        related_name="items"
    )
    purchase_date = models.DateField()
    stock_available = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Purchase(models.Model):
    order_id = models.CharField(max_length=50, unique=True)
    purchase_date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_id


class PurchaseItem(models.Model):
    purchase = models.ForeignKey(
        Purchase,
        on_delete=models.PROTECT,
        related_name="purchase_items"
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        related_name="purchase_history"
    )
    quantity = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["purchase", "item"],
                name="unique_item_per_purchase"
            )
        ]

    def __str__(self):
        return f"{self.purchase.order_id} - {self.item.name}"