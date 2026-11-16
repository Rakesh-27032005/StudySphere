from django.urls import path
from .views import (
    RegisterView, 
    MeView, 
    AdminOverviewView,
    StudyRoomListCreateView,
    StudyRoomJoinView,
    FriendRequestListView,
    SendFriendRequestView,
    RespondFriendRequestView,
    PDFDocumentListCreateView,
    DirectMessageListView,
    RoomMessageListView,
    AdminOverviewView,
    FriendListView,
    RequestJoinRoomView,
    PendingRoomRequestsView,
    RespondRoomRequestView
)

urlpatterns = [
    # Stage 1 URLs (Existing)
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("admin-overview/", AdminOverviewView.as_view(), name="admin-overview"),
    
    # Stage 2 URLs (New)
    path("rooms/", StudyRoomListCreateView.as_view(), name="room-list-create"),
    path("rooms/join/<str:room_code>/", StudyRoomJoinView.as_view(), name="room-join"),
    
    path("friends/requests/", FriendRequestListView.as_view(), name="friend-request-list"),
    path("friends/request/send/<str:username>/", SendFriendRequestView.as_view(), name="send-friend-request"),
    path("friends/request/<int:pk>/<str:action>/", RespondFriendRequestView.as_view(), name="respond-friend-request"),
    
    # Stage 3 URLs (PDFs)
    path("pdfs/", PDFDocumentListCreateView.as_view(), name="pdf-list-create"), # <-- We added this route

    # Stage 4 URLs (Messages)
    path("messages/direct/<str:username>/", DirectMessageListView.as_view(), name="direct-messages"),
    path("messages/room/<str:room_code>/", RoomMessageListView.as_view(), name="room-messages"),
    
    path("admin/stats/", AdminOverviewView.as_view(), name="admin-stats"),
    path("friends/", FriendListView.as_view(), name="friends-list"),
    
    path('rooms/join/request/<str:room_code>/', RequestJoinRoomView.as_view(), name='room-join-request'),
    path('rooms/requests/pending/', PendingRoomRequestsView.as_view(), name='room-pending-requests'),
    path('rooms/requests/respond/<int:req_id>/<str:action>/', RespondRoomRequestView.as_view(), name='room-respond-request'),

]