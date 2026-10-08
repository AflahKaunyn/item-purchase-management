from rest_framework import serializers

from .models import ItemType, Item, Purchase, PurchaseItem


class ItemTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemType
        fields = ["id", "type_name"]

    def validate_type_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Item type name is required."
            )

        return value


class ItemSerializer(serializers.ModelSerializer):
    item_type_name = serializers.CharField(
        source="item_type.type_name",
        read_only=True
    )

    availability = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            "id",
            "name",
            "item_type",
            "item_type_name",
            "purchase_date",
            "stock_available",
            "availability",
            "active",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Item name is required."
            )

        return value

    def validate_stock_available(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Stock cannot be negative."
            )

        return value

    def validate(self, attrs):
        if not attrs.get("purchase_date") and not self.instance:
            raise serializers.ValidationError({
                "purchase_date": "Purchase date is required."
            })

        return attrs

    def get_availability(self, obj):
        if obj.stock_available == 0:
            return "Out of Stock"

        if obj.stock_available <= 5:
            return "Low Stock"

        return "In Stock"


class PurchaseItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(
        source="item.name",
        read_only=True
    )

    item_type_name = serializers.CharField(
        source="item.item_type.type_name",
        read_only=True
    )

    stock_available = serializers.IntegerField(
        source="item.stock_available",
        read_only=True
    )

    class Meta:
        model = PurchaseItem
        fields = [
            "id",
            "item",
            "item_name",
            "item_type_name",
            "quantity",
            "stock_available",
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Quantity must be greater than zero."
            )

        return value


class PurchaseSerializer(serializers.ModelSerializer):
    purchase_items = PurchaseItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Purchase
        fields = [
            "id",
            "order_id",
            "purchase_date",
            "purchase_items",
            "created_at",
            "updated_at",
        ]