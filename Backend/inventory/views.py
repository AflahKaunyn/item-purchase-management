from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ItemType, Item, Purchase, PurchaseItem
from .serializers import (
    ItemTypeSerializer,
    ItemSerializer,
    PurchaseSerializer,
    PurchaseItemSerializer,
)

class ItemTypeListCreateView(APIView):

    def get(self, request):
        item_types = ItemType.objects.all().order_by("type_name")
        serializer = ItemTypeSerializer(item_types, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = ItemTypeSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class ItemTypeDetailView(APIView):

    def get_object(self, pk):
        try:
            return ItemType.objects.get(pk=pk)
        except ItemType.DoesNotExist:
            return None

    def get(self, request, pk):
        item_type = self.get_object(pk)

        if item_type is None:
            return Response(
                {"error": "Item type not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ItemTypeSerializer(item_type)

        return Response(serializer.data)

    def put(self, request, pk):
        item_type = self.get_object(pk)

        if item_type is None:
            return Response(
                {"error": "Item type not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ItemTypeSerializer(
            item_type,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        item_type = self.get_object(pk)

        if item_type is None:
            return Response(
                {"error": "Item type not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            item_type.delete()

        except IntegrityError:
            return Response(
                {
                    "error": (
                        "Item type cannot be deleted because "
                        "it is being used by an item."
                    )
                },
                 status=status.HTTP_409_CONFLICT
    )

        return Response(
            {"message": "Item type deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
    
class ItemListCreateView(APIView):

    def get(self, request):
        items = Item.objects.select_related(
            "item_type"
        ).all().order_by("id")

        serializer = ItemSerializer(items, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = ItemSerializer(data=request.data)

        if serializer.is_valid():
            item = serializer.save()

            return Response(
                ItemSerializer(item).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
        
class ItemDetailView(APIView):

    def get_object(self, pk):
        try:
            return Item.objects.select_related(
                "item_type"
            ).get(pk=pk)

        except Item.DoesNotExist:
            return None

    def get(self, request, pk):
        item = self.get_object(pk)

        if item is None:
            return Response(
                {"error": "Item not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ItemSerializer(item)

        return Response(serializer.data)

    def put(self, request, pk):
        item = self.get_object(pk)

        if item is None:
            return Response(
                {"error": "Item not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ItemSerializer(
            item,
            data=request.data
        )

        if serializer.is_valid():
            item = serializer.save()

            return Response(
                ItemSerializer(item).data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        item = self.get_object(pk)

        if item is None:
            return Response(
                {"error": "Item not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # An item with purchase history must not be deleted.
        if item.purchase_history.exists():
            return Response(
                {
                    "error": (
                        "This item cannot be deleted because "
                        "it has purchase history. "
                        "Deactivate the item instead."
                    )
                },
                status=status.HTTP_409_CONFLICT
            )

        item.delete()

        return Response(
            {"message": "Item deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )

class ItemStatusView(APIView):

    def patch(self, request, pk):
        try:
            item = Item.objects.get(pk=pk)

        except Item.DoesNotExist:
            return Response(
                {"error": "Item not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        active = request.data.get("active")

        if not isinstance(active, bool):
            return Response(
                {
                    "error": (
                        "Active must be true or false."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        item.active = active
        item.save(update_fields=["active", "updated_at"])

        return Response(
            {
                "message": (
                    "Item activated successfully."
                    if active
                    else "Item deactivated successfully."
                ),
                "item": ItemSerializer(item).data
            }
        )
        
class PurchaseListCreateView(APIView):

    def get(self, request):
        purchases = Purchase.objects.all().order_by("-id")

        serializer = PurchaseSerializer(
            purchases,
            many=True
        )

        return Response(serializer.data)

    @transaction.atomic
    def post(self, request):

        order_id = request.data.get("order_id")
        purchase_date = request.data.get("purchase_date")
        items_data = request.data.get("items")

        # Basic validation
        if not order_id:
            return Response(
                {"error": "Order ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not purchase_date:
            return Response(
                {"error": "Purchase date is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not items_data:
            return Response(
                {"error": "Purchase must contain at least one item."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(items_data, list):
            return Response(
                {"error": "Items must be provided as a list."},
                status=status.HTTP_400_BAD_REQUEST
            )

        
        item_ids = []

        for item_data in items_data:

            if "item" not in item_data:
                return Response(
                    {"error": "Each purchase item must contain an item ID."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            item_ids.append(item_data["item"])

        if len(item_ids) != len(set(item_ids)):
            return Response(
                {"error": "Duplicate items are not allowed in one purchase."},
                status=status.HTTP_400_BAD_REQUEST
            )

       
        if Purchase.objects.filter(order_id=order_id).exists():
            return Response(
                {"error": "Order ID already exists."},
                status=status.HTTP_409_CONFLICT
            )

        # Validate all items BEFORE changing anything
        validated_items = []

        for item_data in items_data:

            item_id = item_data.get("item")
            quantity = item_data.get("quantity")

            if quantity is None:
                return Response(
                    {"error": "Quantity is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                quantity = int(quantity)
            except (TypeError, ValueError):
                return Response(
                    {"error": "Quantity must be a valid number."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if quantity <= 0:
                return Response(
                    {"error": "Quantity must be greater than zero."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                item = Item.objects.select_for_update().get(
                    id=item_id
                )
            except Item.DoesNotExist:
                return Response(
                    {"error": f"Item {item_id} not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            if not item.active:
                return Response(
                    {
                        "error": (
                            f"Item '{item.name}' is inactive "
                            "and cannot be purchased."
                        )
                    },
                    status=status.HTTP_409_CONFLICT
                )

            if quantity > item.stock_available:
                return Response(
                    {
                        "error": (
                            f"Insufficient stock for '{item.name}'. "
                            f"Available: {item.stock_available}, "
                            f"Requested: {quantity}."
                        )
                    },
                    status=status.HTTP_409_CONFLICT
                )

            validated_items.append(
                (item, quantity)
            )

        
        purchase = Purchase.objects.create(
            order_id=order_id,
            purchase_date=purchase_date
        )

        for item, quantity in validated_items:

            PurchaseItem.objects.create(
                purchase=purchase,
                item=item,
                quantity=quantity
            )

            item.stock_available -= quantity
            item.save(
                update_fields=[
                    "stock_available",
                    "updated_at"
                ]
            )

        serializer = PurchaseSerializer(purchase)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
  
class PurchaseDetailView(APIView):

    def get(self, request, pk):
        try:
            purchase = Purchase.objects.get(pk=pk)
        except Purchase.DoesNotExist:
            return Response(
                {"error": "Purchase not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        purchase_items = PurchaseItem.objects.select_related(
            "item",
            "item__item_type"
        ).filter(
            purchase=purchase
        )

        data = {
            "id": purchase.id,
            "order_id": purchase.order_id,
            "purchase_date": purchase.purchase_date,
            "purchase_items": PurchaseItemSerializer(
                purchase_items,
                many=True
            ).data,
            "created_at": purchase.created_at,
            "updated_at": purchase.updated_at,
        }

        return Response(data)

    @transaction.atomic
    def put(self, request, pk):

        purchase = self.get_object(pk)

        if purchase is None:
            return Response(
                {"error": "Purchase not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        purchase_date = request.data.get("purchase_date")
        items_data = request.data.get("items")

        if not purchase_date:
            return Response(
                {"error": "Purchase date is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not items_data:
            return Response(
                {"error": "Purchase must contain at least one item."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(items_data, list):
            return Response(
                {"error": "Items must be provided as a list."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check duplicate items
        item_ids = [
            item_data.get("item")
            for item_data in items_data
        ]

        if None in item_ids:
            return Response(
                {"error": "Every purchase item must contain an item ID."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(item_ids) != len(set(item_ids)):
            return Response(
                {"error": "Duplicate items are not allowed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Lock purchase items while updating
        old_purchase_items = list(
            PurchaseItem.objects.select_related(
                "item"
            ).select_for_update().filter(
                purchase=purchase
            )
        )

        old_quantities = {
            purchase_item.item_id: purchase_item.quantity
            for purchase_item in old_purchase_items
        }

        new_quantities = {}

        for item_data in items_data:

            item_id = item_data.get("item")
            quantity = item_data.get("quantity")

            if quantity is None:
                return Response(
                    {"error": "Quantity is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                quantity = int(quantity)
            except (TypeError, ValueError):
                return Response(
                    {"error": "Quantity must be a valid number."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if quantity <= 0:
                return Response(
                    {"error": "Quantity must be greater than zero."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            new_quantities[item_id] = quantity

        # Get all affected item IDs
        affected_item_ids = set(old_quantities.keys()) | set(
            new_quantities.keys()
        )

        # Lock affected items
        items = {
            item.id: item
            for item in Item.objects.select_for_update().filter(
                id__in=affected_item_ids
            )
        }

        # Validate that all items exist
        for item_id in affected_item_ids:

            if item_id not in items:
                return Response(
                    {
                        "error": f"Item {item_id} not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

        # Calculate stock changes
        stock_changes = {}

        for item_id in affected_item_ids:

            old_quantity = old_quantities.get(
                item_id,
                0
            )

            new_quantity = new_quantities.get(
                item_id,
                0
            )

            difference = new_quantity - old_quantity

            stock_changes[item_id] = difference

        # Validate stock and active status
        for item_id, difference in stock_changes.items():

            item = items[item_id]

            # If this is a newly added item
            if item_id not in old_quantities:

                if not item.active:
                    return Response(
                        {
                            "error": (
                                f"Item '{item.name}' is inactive "
                                "and cannot be added."
                            )
                        },
                        status=status.HTTP_409_CONFLICT
                    )

            # If quantity is increasing
            if difference > 0:

                if difference > item.stock_available:
                    return Response(
                        {
                            "error": (
                                f"Insufficient stock for '{item.name}'. "
                                f"Available: {item.stock_available}, "
                                f"Additional required: {difference}."
                            )
                        },
                        status=status.HTTP_409_CONFLICT
                    )

        # Update purchase date
        purchase.purchase_date = purchase_date
        purchase.save(update_fields=[
            "purchase_date",
            "updated_at"
        ])

        # Remove existing purchase items
        PurchaseItem.objects.filter(
            purchase=purchase
        ).delete()

        # Create updated purchase items
        for item_id, new_quantity in new_quantities.items():

            item = items[item_id]

            PurchaseItem.objects.create(
                purchase=purchase,
                item=item,
                quantity=new_quantity
            )

        # Update stock
        for item_id, difference in stock_changes.items():

            item = items[item_id]

            item.stock_available -= difference

            item.save(update_fields=[
                "stock_available",
                "updated_at"
            ])

        return Response(
            PurchaseSerializer(purchase).data
        )