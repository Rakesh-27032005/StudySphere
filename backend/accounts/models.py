import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('admin', 'Administrator'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    bio = models.TextField(blank=True, null=True)
    display_name = models.CharField(max_length=50, blank=True, null=True)
    
    # --- ADDED: The Friends Field! ---
    friends = models.ManyToManyField('self', blank=True)
    
    def __str__(self):
        return self.username

class FriendRequest(models.Model):
    sender = models.ForeignKey(User, related_name='sent_requests', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_requests', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('sender', 'receiver')

class StudyRoom(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=True)
    room_code = models.CharField(max_length=8, unique=True, blank=True)
    creator = models.ForeignKey(User, related_name='created_rooms', on_delete=models.CASCADE)
    members = models.ManyToManyField(User, related_name='joined_rooms', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.room_code:
            self.room_code = uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)

class PDFDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='pdfs/')
    uploaded_by = models.ForeignKey(User, related_name='uploaded_pdfs', on_delete=models.CASCADE)
    room = models.ForeignKey(StudyRoom, related_name='pdfs', on_delete=models.CASCADE, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

# --- Stage 4 (Messages) ---
class Message(models.Model):
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_messages', on_delete=models.CASCADE, null=True, blank=True)
    room = models.ForeignKey(StudyRoom, related_name='messages', on_delete=models.CASCADE, null=True, blank=True)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # FIXED: single line string
        return f"{self.sender.username} - {self.timestamp}"
    
class RoomJoinRequest(models.Model):
    # FIXED: using User instead of CustomUser
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_requests')
    room = models.ForeignKey(StudyRoom, on_delete=models.CASCADE, related_name='join_requests')
    status = models.CharField(max_length=20, default='pending') # pending, accepted, rejected
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} -> {self.room.name} ({self.status})"