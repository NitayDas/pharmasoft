from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import Staff

User = get_user_model()


class UserInlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active']


class StaffListSerializer(serializers.ModelSerializer):
    user = UserInlineSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Staff
        fields = [
            'id', 'employee_id', 'role', 'role_display', 'full_name',
            'phone', 'address', 'joining_date', 'is_active',
            'created_at', 'updated_at', 'user',
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class StaffCreateSerializer(serializers.Serializer):
    # User fields
    username = serializers.CharField(max_length=150)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    # Staff fields
    role = serializers.ChoiceField(choices=Staff.ROLE_CHOICES)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    joining_date = serializers.DateField(required=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        validate_password(attrs['password'])
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        role = validated_data.pop('role')
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')
        joining_date = validated_data.pop('joining_date', None)
        created_by = self.context['request'].user

        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=role,
            phone=phone,
        )
        user.set_password(password)
        user.save()

        kwargs = {'user': user, 'role': role, 'phone': phone, 'address': address, 'created_by': created_by}
        if joining_date:
            kwargs['joining_date'] = joining_date

        staff = Staff.objects.create(**kwargs)
        return staff


class StaffUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email', required=False)

    class Meta:
        model = Staff
        fields = ['role', 'phone', 'address', 'joining_date', 'is_active', 'first_name', 'last_name', 'email']

    def validate_email(self, value):
        user = self.instance.user
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('This email is already in use.')
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        for attr, val in user_data.items():
            setattr(instance.user, attr, val)
        # Keep user.role in sync with staff.role
        if 'role' in validated_data:
            instance.user.role = validated_data['role']
        instance.user.save()

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance


class SelfProfileUpdateSerializer(serializers.ModelSerializer):
    """Staff updating their own profile — restricted to safe fields only."""
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email', required=False)

    class Meta:
        model = Staff
        fields = ['phone', 'address', 'first_name', 'last_name', 'email']

    def validate_email(self, value):
        user = self.instance.user
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('This email is already in use.')
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        for attr, val in user_data.items():
            setattr(instance.user, attr, val)
        instance.user.save()
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=False, allow_blank=True)
    new_password = serializers.CharField(min_length=8)
    confirm_new_password = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({'confirm_new_password': 'Passwords do not match.'})
        validate_password(attrs['new_password'])
        return attrs
