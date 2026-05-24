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
from .models import Hotel, Room, Client, Booking, User
from .serializers import (
    HotelSerializer, RoomSerializer, ClientSerializer,
    BookingSerializer, UserRegistrationSerializer,
    UserProfileSerializer,
)
from .email_utils import send_activation_email
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ─── helpers ──────────────────────────────────────────────────────────────────
class IsBookingOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

def _jwt(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


# ─── Hotel ────────────────────────────────────────────────────────────────────
class HotelListCreate(generics.ListCreateAPIView):
    queryset         = Hotel.objects.all()
    serializer_class = HotelSerializer

class HotelDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Hotel.objects.all()
    serializer_class = HotelSerializer


# ─── Room ─────────────────────────────────────────────────────────────────────
class RoomListCreate(generics.ListCreateAPIView):
    serializer_class = RoomSerializer

    def get_queryset(self):
        today = date.today()
        for booking in Booking.objects.filter(status__in=['confirmed', 'rescheduled'], check_out__lt=today):
            booking.room.is_available = True
            booking.room.save()
        return Room.objects.all()

class RoomDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Room.objects.all()
    serializer_class = RoomSerializer


# ─── Client ───────────────────────────────────────────────────────────────────
class ClientListCreate(generics.ListCreateAPIView):
    queryset         = Client.objects.all()
    serializer_class = ClientSerializer

class ClientDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Client.objects.all()
    serializer_class = ClientSerializer


# ─── Booking ──────────────────────────────────────────────────────────────────
class BookingListCreate(generics.ListCreateAPIView):
    serializer_class   = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        if booking.status == 'confirmed':
            booking.room.is_available = False
            booking.room.save()

class BookingDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = BookingSerializer
    permission_classes = [IsAuthenticated, IsBookingOwner]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        booking = serializer.save()
        booking.room.is_available = booking.status not in ['confirmed', 'rescheduled']
        booking.room.save()

class MyBookings(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(BookingSerializer(Booking.objects.filter(user=request.user), many=True).data)

class CancelBooking(APIView):
    permission_classes = [IsAuthenticated, IsBookingOwner]

    def _get(self, pk):
        try:
            b = Booking.objects.get(pk=pk)
            self.check_object_permissions(self.request, b)
            return b
        except Booking.DoesNotExist:
            return None

    def patch(self, request, pk):
        booking = self._get(pk)
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
    permission_classes = [IsAuthenticated, IsBookingOwner]

    def _get(self, pk):
        try:
            b = Booking.objects.get(pk=pk)
            self.check_object_permissions(self.request, b)
            return b
        except Booking.DoesNotExist:
            return None

    def patch(self, request, pk):
        booking = self._get(pk)
        if not booking:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)
        if booking.status == 'cancelled':
            return Response({'error': 'Cannot reschedule a cancelled booking.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = BookingSerializer(booking, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(status='rescheduled')
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── User Registration ────────────────────────────────────────────────────────
class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            try:
                send_activation_email(user)
            except Exception as e:
                print(f'[Email Error] Could not send activation email to {user.email}: {e}')

            return Response(
                {'message': 'Registration successful. Please check your email to activate your account.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Email Activation ─────────────────────────────────────────────────────────
class ActivateAccountView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid  = force_str(urlsafe_base64_decode(uidb64))
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
            'message': 'Account activated successfully! You can now log in.',
            'tokens':  tokens,
            'user':    UserProfileSerializer(user).data,
        }, status=status.HTTP_200_OK)


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
            return Response({'message': 'If that email is registered, an activation link has been sent.'}, status=status.HTTP_200_OK)

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
        email    = request.data.get('email', '')
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
                    'error': 'Account is not activated. Please check your email for the activation link.',
                    'not_activated': True,
                },
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access':  str(refresh.access_token),
            'user':    UserProfileSerializer(user).data
        }, status=status.HTTP_200_OK)


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