from django.urls import path

from .views import (
    ItemTypeListCreateView,
    ItemTypeDetailView,
    ItemListCreateView,
    ItemDetailView,
    ItemStatusView,
    PurchaseListCreateView,
    PurchaseDetailView,
)

urlpatterns = [
    path(
        "item-types/",
        ItemTypeListCreateView.as_view(),
        name="item-type-list"
    ),
    path(
        "item-types/<int:pk>/",
        ItemTypeDetailView.as_view(),
        name="item-type-detail"
    ),

    path(
        "items/",
        ItemListCreateView.as_view(),
        name="item-list"
    ),
    path(
        "items/<int:pk>/",
        ItemDetailView.as_view(),
        name="item-detail"
    ),
    path(
        "items/<int:pk>/status/",
        ItemStatusView.as_view(),
        name="item-status"
    ),

    path(
        "purchases/",
        PurchaseListCreateView.as_view(),
        name="purchase-list"
    ),
    path(
        "purchases/<int:pk>/",
        PurchaseDetailView.as_view(),
        name="purchase-detail"
    ),
]