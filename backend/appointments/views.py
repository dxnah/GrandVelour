from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, BasePermission, AllowAny
from django.contrib.auth import authenticate
from django.conf import settings
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
from datetime import date
import os

from .models import Hotel, Room, Client, Booking, User
from .serializers import (
    HotelSerializer, RoomSerializer, ClientSerializer,
    BookingSerializer, UserRegistrationSerializer,
    UserProfileSerializer, AdminUserSerializer,
)
from .email_utils import send_activation_email
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ─── Custom Permissions ──────────────────────────────────────────────────────
class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsStaffOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'staff']

class IsBookingOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _jwt(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# ─── Chatbot ─────────────────────────────────────────────────────────────────
CHATBOT_SYSTEM = """You are Velour, the elegant AI concierge of Grand Velour Hotels & Resorts — a luxury hotel brand in the Philippines. You assist guests with:

- Room information (Single 1,500/night, Double 2,500/night, Suite 5,000/night, Deluxe 8,000/night)
- Booking inquiries, check-in/check-out questions
- Hotel amenities, facilities, and services
- Floor map and navigation within the hotel
- General hospitality assistance

Personality: Warm, refined, elegant — like a world-class hotel concierge. Use graceful language. Keep responses concise (2-4 sentences max). Occasionally use light luxury vocabulary. Never break character. If asked something outside hotel topics, gently redirect to hotel services."""

class ChatbotView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        messages = request.data.get('messages', [])
        if not messages:
            return Response({'error': 'No messages provided.'}, status=status.HTTP_400_BAD_REQUEST)

# ─── Hotel ───────────────────────────────────────────────────────────────────
class HotelListCreate(generics.ListCreateAPIView):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [AllowAny()]

class HotelDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminRole()]
        return [AllowAny()]


# ─── Room ─────────────────────────────────────────────────────────────────────
class RoomListCreate(generics.ListCreateAPIView):
    serializer_class = RoomSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsStaffOrAdmin()]
        return [AllowAny()]

    def get_queryset(self):
        today = date.today()
        for booking in Booking.objects.filter(status__in=['confirmed', 'rescheduled'], check_out__lt=today):
            booking.room.is_available = True
            booking.room.save()
        return Room.objects.all()

class RoomDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsStaffOrAdmin()]
        return [AllowAny()]


# ─── Client ───────────────────────────────────────────────────────────────────
class ClientListCreate(generics.ListCreateAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [AllowAny]

# After
class ClientDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsStaffOrAdmin()]


# ─── Booking ──────────────────────────────────────────────────────────────────
class BookingListCreate(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'staff']:
            return Booking.objects.all()
        return Booking.objects.filter(user=user)

    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        if booking.status == 'confirmed':
            booking.room.is_available = False
            booking.room.save()

class BookingDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'staff']:
            return Booking.objects.all()
        return Booking.objects.filter(user=user)

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if self.request.user.role in ['admin', 'staff']:
                return [IsStaffOrAdmin()]
            return [IsAuthenticated(), IsBookingOwner()]
        return [IsAuthenticated()]

    def perform_update(self, serializer):
        booking = serializer.save()
        booking.room.is_available = booking.status not in ['confirmed', 'rescheduled']
        booking.room.save()

class MyBookings(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role in ['admin', 'staff']:
            bookings = Booking.objects.all()
        else:
            bookings = Booking.objects.filter(user=user)
        return Response(BookingSerializer(bookings, many=True).data)

class CancelBooking(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk, user):
        try:
            b = Booking.objects.get(pk=pk)
            if user.role not in ['admin', 'staff'] and b.user != user:
                return None
            return b
        except Booking.DoesNotExist:
            return None

    def patch(self, request, pk):
        booking = self._get(pk, request.user)
        if not booking:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)
        if booking.status == 'cancelled':
            return Response({'error': 'Already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = 'cancelled'
        booking.room.is_available = True
        booking.room.save()
        booking.save()
        return Response({'message': 'Booking cancelled.'})


class RescheduleBooking(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk, user):
        try:
            b = Booking.objects.get(pk=pk)
            if user.role not in ['admin', 'staff'] and b.user != user:
                return None
            return b
        except Booking.DoesNotExist:
            return None

    def patch(self, request, pk):
        booking = self._get(pk, request.user)
        if not booking:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)
        if booking.status == 'cancelled':
            return Response({'error': 'Cannot reschedule a cancelled booking.'}, status=status.HTTP_400_BAD_REQUEST)

        new_check_in = request.data.get('check_in')
        new_check_out = request.data.get('check_out')
        if not new_check_in or not new_check_out:
            return Response({'error': 'check_in and check_out are required.'}, status=status.HTTP_400_BAD_REQUEST)

        from datetime import date
        try:
            booking.check_in = date.fromisoformat(new_check_in)
            booking.check_out = date.fromisoformat(new_check_out)
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        if booking.check_out <= booking.check_in:
            return Response({'error': 'Check-out must be after check-in.'}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = 'rescheduled'
        booking.save()  # triggers total_price recalculation in model's save()
        return Response(BookingSerializer(booking).data)


# ─── Admin: Manage All Users ─────────────────────────────────────────────────
class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer   # ← changed
    permission_classes = [IsAdminRole]

class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer   # ← changed
    permission_classes = [IsAdminRole]


# ─── User: Register ──────────────────────────────────────────────────────────
class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print(f"[REGISTER REQUEST] {request.data}")  # ← debug: show what mobile sends
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            try:
                send_activation_email(user)
            except Exception as e:
                print(f"[EMAIL ERROR] {e}")
            return Response(
                {'message': 'Registration successful. Please check your email to activate your account.'},
                status=status.HTTP_201_CREATED
            )
        print(f"[REGISTER ERROR] {serializer.errors}")  # ← debug: show validation errors
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Email Activation ─────────────────────────────────────────────────────────
class ActivateAccountView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid activation link.'}, status=status.HTTP_400_BAD_REQUEST)

        if user.is_active:
            return Response({'message': 'Account is already activated.'}, status=status.HTTP_200_OK)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Activation link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = True
        user.save()

        tokens = _jwt(user)
        return Response({
            'message': 'Account activated successfully!',
            'tokens': tokens,
            'user': UserProfileSerializer(user).data,
        })


# ─── Resend Activation Email ──────────────────────────────────────────────────
class ResendActivationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'If that email is registered, a new link has been sent.'})

        if user.is_active:
            return Response({'error': 'This account is already activated.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            send_activation_email(user)
        except Exception as e:
            print(f'[Email Error] Could not resend activation email to {user.email}: {e}')
            return Response({'error': 'Failed to send email. Please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Activation email resent. Please check your inbox.'}, status=status.HTTP_200_OK)


# ─── User Login ───────────────────────────────────────────────────────────────
class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        password = request.data.get('password', '')

        try:
            User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(request, username=email, password=password)

        if user is None:
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response(
                {
                    'error': 'Account not activated. Please check your email for the activation link.',
                    'not_activated': True,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': user.role,
            'user': UserProfileSerializer(user).data,
        })


# ─── User Profile ─────────────────────────────────────────────────────────────
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)