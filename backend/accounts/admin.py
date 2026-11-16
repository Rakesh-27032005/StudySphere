from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("StudySphere", {"fields": ("role", "bio", "display_name")}),)
    add_fieldsets = UserAdmin.add_fieldsets + (("StudySphere", {"fields": ("email", "role")}),)
    list_display = ("username", "email", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active")
