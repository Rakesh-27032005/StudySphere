from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import FriendRequest, StudyRoom, PDFDocument, Message

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "display_name")
        
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "bio", "display_name")

# --- Stage 2 Serializers ---

class UserListSerializer(serializers.ModelSerializer):
    """A simplified user serializer for displaying friends and room members"""
    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'bio']

class FriendRequestSerializer(serializers.ModelSerializer):
    sender = UserListSerializer(read_only=True)
    receiver = UserListSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'status', 'created_at']

class StudyRoomSerializer(serializers.ModelSerializer):
    creator = UserListSerializer(read_only=True)
    members = UserListSerializer(many=True, read_only=True)

    class Meta:
        model = StudyRoom
        fields = ['id', 'name', 'description', 'is_public', 'room_code', 'creator', 'members', 'created_at']
        read_only_fields = ['room_code']
        
# --- Stage 3 Serializers (PDFs) ---
class PDFDocumentSerializer(serializers.ModelSerializer):
    uploaded_by = UserListSerializer(read_only=True)

    class Meta:
        model = PDFDocument
        fields = ['id', 'title', 'file', 'uploaded_by', 'room', 'uploaded_at']
        
# --- Stage 4 Serializers (Messages) ---
class MessageSerializer(serializers.ModelSerializer):
    sender = UserListSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp']