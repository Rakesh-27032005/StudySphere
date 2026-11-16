from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import StudyRoom, RoomJoinRequest

class RequestJoinRoomView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, room_code):
        try:
            room = StudyRoom.objects.get(room_code=room_code)
        except StudyRoom.DoesNotExist:
            return Response({"error": "Room not found"}, status=404)
        
        # Check if user is already a member or creator
        if request.user == room.creator or request.user in room.members.all():
            return Response({"error": "You are already in this room"}, status=400)
            
        # Check if a pending request already exists
        if RoomJoinRequest.objects.filter(user=request.user, room=room, status='pending').exists():
            return Response({"error": "Request already pending"}, status=400)
            
        RoomJoinRequest.objects.create(user=request.user, room=room)
        return Response({"message": "Join request sent successfully!"})

class PendingRoomRequestsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        # Find requests where the room's creator is the current user, and status is pending
        pending_reqs = RoomJoinRequest.objects.filter(room__creator=request.user, status='pending')
        data = []
        for r in pending_reqs:
            data.append({
                "id": r.id,
                "user": {"username": r.user.username, "display_name": getattr(r.user, 'display_name', '')},
                "room": {"name": r.room.name, "room_code": r.room.room_code}
            })
        return Response(data)

class RespondRoomRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, req_id, action):
        try:
            req = RoomJoinRequest.objects.get(id=req_id, room__creator=request.user)
        except RoomJoinRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=404)
            
        if action == 'accept':
            req.status = 'accepted'
            req.room.members.add(req.user)
            req.save()
            return Response({"message": "Request accepted"})
        elif action == 'reject':
            req.status = 'rejected'
            req.save()
            return Response({"message": "Request rejected"})
        
        return Response({"error": "Invalid action"}, status=400)
    

from .models import FriendRequest, StudyRoom, PDFDocument, Message
from .serializers import (
    RegisterSerializer, 
    UserSerializer, 
    FriendRequestSerializer, 
    StudyRoomSerializer,
    PDFDocumentSerializer,
    MessageSerializer
)
from .permissions import IsPlatformAdmin

# --- Stage 1 Views (Existing) ---

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

class AdminOverviewView(APIView):
    permission_classes = [IsPlatformAdmin]
    def get(self, request):
        User = get_user_model()
        return Response({
            "total_users": User.objects.filter(role="student").count(),
            "message": "Administrator access verified. More analytics will be added in later stages."
        })

# --- Stage 2 Views (New) ---

class StudyRoomListCreateView(generics.ListCreateAPIView):
    serializer_class = StudyRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        is_admin = getattr(user, 'role', '') == 'admin'
        
        if is_admin:
            return StudyRoom.objects.all().distinct()
            
        my_rooms = StudyRoom.objects.filter(Q(creator=user) | Q(members=user))
        
        try:
            friend_ids = user.friends.values_list('id', flat=True)
            friends_rooms = StudyRoom.objects.filter(creator_id__in=friend_ids)
            return (my_rooms | friends_rooms).distinct()
        except Exception:
            return my_rooms.distinct()

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            rooms_data = []
            for room in queryset:
                rooms_data.append({
                    "id": room.id,
                    "name": room.name,
                    "room_code": getattr(room, 'room_code', 'N/A'),
                    "creator": {
                        "username": room.creator.username if room.creator else "Unknown",
                        "display_name": getattr(room.creator, 'display_name', '') if room.creator else ""
                    },
                    "members": [{"username": m.username} for m in room.members.all()]
                })
            return Response(rooms_data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def perform_create(self, serializer):
        room = serializer.save(creator=self.request.user)
        room.members.add(self.request.user)
        
        # 1. Safely get rooms I created or joined
        my_rooms = StudyRoom.objects.filter(Q(creator=user) | Q(members=user))
        
        # 2. Safely get friends' rooms without crashing
        try:
            friend_ids = user.friends.values_list('id', flat=True)
            friends_rooms = StudyRoom.objects.filter(creator_id__in=friend_ids)
            return (my_rooms | friends_rooms).distinct()
        except Exception:
            return my_rooms.distinct()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        rooms_data = []
        for room in queryset:
            rooms_data.append({
                "id": room.id,
                "name": room.name,
                "room_code": room.room_code,
                "creator": {
                    "username": room.creator.username,
                    "display_name": getattr(room.creator, 'display_name', room.creator.username)
                },
                "members": [{"username": m.username} for m in room.members.all()]
            })
        return Response(rooms_data)

    def perform_create(self, serializer):
        room = serializer.save(creator=self.request.user)
        room.members.add(self.request.user)
        
    # --- NEW: Format the data so React can read the usernames! ---
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        rooms_data = []
        for room in queryset:
            rooms_data.append({
                "id": room.id,
                "name": room.name,
                "room_code": room.room_code,
                "creator": {
                    "username": room.creator.username,
                    "display_name": room.creator.display_name
                },
                "members": [{"username": m.username} for m in room.members.all()]
            })
        return Response(rooms_data)

    def perform_create(self, serializer):
        room = serializer.save(creator=self.request.user)
        room.members.add(self.request.user)
        
class StudyRoomJoinView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, room_code):
        try:
            room = StudyRoom.objects.get(room_code=room_code)
            user = request.user
            
            # SECURITY LOCK: Admins, existing members, or friends only
            is_admin = user.role == 'admin'
            is_member_or_creator = user == room.creator or user in room.members.all()
            is_friend = user in room.creator.friends.all()

            if not (is_admin or is_member_or_creator or is_friend):
                return Response(
                    {"error": "This room is strictly private. Only friends of the creator can join."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            room.members.add(user)
            return Response({"message": f"Successfully joined {room.name}"}, status=status.HTTP_200_OK)
        except StudyRoom.DoesNotExist:
            return Response({"error": "Invalid room code"}, status=status.HTTP_404_NOT_FOUND)# 2. Friend Requests
class FriendRequestListView(generics.ListAPIView):
    serializer_class = FriendRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Show pending requests sent TO the logged-in user
        return FriendRequest.objects.filter(receiver=self.request.user, status='pending')

class SendFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        User = get_user_model()
        receiver = get_object_or_404(User, username=username)
        
        if receiver == request.user:
            return Response({"error": "Cannot send a request to yourself"}, status=status.HTTP_400_BAD_REQUEST)
            
        request_obj, created = FriendRequest.objects.get_or_create(
            sender=request.user, 
            receiver=receiver,
            defaults={'status': 'pending'}
        )
        
        if not created:
            return Response({"error": "Request already exists"}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({"message": "Friend request sent"}, status=status.HTTP_201_CREATED)
class FriendListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        friends = request.user.friends.all()
        data = [{"id": f.id, "username": f.username, "display_name": f.display_name} for f in friends]
        return Response(data)
    
    def post(self, request, pk, action):
        try:
            # Find the pending request where the current user is the receiver
            friend_request = FriendRequest.objects.get(id=pk, receiver=request.user, status='pending')
            
            if action == 'accept':
                friend_request.status = 'accepted'
                friend_request.save()
                return Response({"message": "Friend request accepted"})
            elif action == 'reject':
                friend_request.status = 'rejected'
                friend_request.save()
                return Response({"message": "Friend request rejected"})
            else:
                return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
                
        except FriendRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

class RespondFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk, action):
        try:
            # Find the pending request where the current user is the receiver
            friend_request = FriendRequest.objects.get(id=pk, receiver=request.user, status='pending')
            
            if action == 'accept':
                friend_request.status = 'accepted'
                # Add to friends list on both sides
                request.user.friends.add(friend_request.sender)
                friend_request.sender.friends.add(request.user)
                friend_request.save()
                return Response({"message": "Friend request accepted"})
            elif action == 'reject':
                friend_request.status = 'rejected'
                friend_request.save()
                return Response({"message": "Friend request rejected"})
            else:
                return Response({"error": "Invalid action"}, status=400)
                
        except FriendRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=404)
        
# --- Stage 3 Views (PDFs) ---


class PDFDocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = PDFDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) # Crucial for accepting files

    def get_queryset(self):
        # Show PDFs uploaded by the user
        return PDFDocument.objects.filter(uploaded_by=self.request.user).order_by('-uploaded_at')

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
        
# --- Stage 4 Views (Messages) ---
class DirectMessageListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        other_username = self.kwargs['username']
        return Message.objects.filter(
            (Q(sender=self.request.user) & Q(receiver__username=other_username)) |
            (Q(sender__username=other_username) & Q(receiver=self.request.user))
        ).order_by('timestamp')

    def perform_create(self, serializer):
        other_username = self.kwargs['username']
        receiver = get_object_or_404(get_user_model(), username=other_username)
        serializer.save(sender=self.request.user, receiver=receiver)

class RoomMessageListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_code = self.kwargs['room_code']
        return Message.objects.filter(room__room_code=room_code).order_by('timestamp')

    def perform_create(self, serializer):
        room_code = self.kwargs['room_code']
        room = get_object_or_404(StudyRoom, room_code=room_code)
        serializer.save(sender=self.request.user, room=room)
        
# --- Stage 6: Admin Dashboard ---
from rest_framework.views import APIView
from rest_framework.response import Response

class AdminOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Ensure only users with the admin role can access this data
        if request.user.role != 'admin':
            return Response({"error": "Not authorized"}, status=403)
        
        user_count = get_user_model().objects.count()
        room_count = StudyRoom.objects.count()
        pdf_count = PDFDocument.objects.count()
        
        # Grab the 10 newest users to display in the dashboard
        recent_users = get_user_model().objects.values(
            'id', 'username', 'email', 'role'
        ).order_by('-date_joined')[:10]
        
        return Response({
            "stats": {
                "users": user_count,
                "rooms": room_count,
                "pdfs": pdf_count
            },
            "recent_users": list(recent_users)
        })