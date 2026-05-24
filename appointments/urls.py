from django.urls import path
from . import views

urlpatterns = [
    # ── Hotels ────────────────────────────────────────────────────────────────
    path('hotels/',              views.HotelListCreate.as_view()),
    path('hotels/<int:pk>/',     views.HotelDetail.as_view()),

    # ── Rooms ─────────────────────────────────────────────────────────────────
    path('rooms/',               views.RoomListCreate.as_view()),
    path('rooms/<int:pk>/',      views.RoomDetail.as_view()),

    # ── Clients ───────────────────────────────────────────────────────────────
    path('clients/',             views.ClientListCreate.as_view()),
    path('clients/<int:pk>/',    views.ClientDetail.as_view()),

    # ── Bookings ──────────────────────────────────────────────────────────────
    path('bookings/',                              views.BookingListCreate.as_view()),
    path('bookings/<int:pk>/',                     views.BookingDetail.as_view()),
    path('bookings/<int:pk>/cancel/',              views.CancelBooking.as_view()),
    path('bookings/<int:pk>/reschedule/',          views.RescheduleBooking.as_view()),

    # ── User Auth ─────────────────────────────────────────────────────────────
    path('user/register/',       views.UserRegisterView.as_view()),
    path('user/login/',          views.UserLoginView.as_view()),
    path('user/profile/',        views.UserProfileView.as_view()),

    # ── Email Activation ──────────────────────────────────────────────────────
    path('user/activate/<str:uidb64>/<str:token>/', views.ActivateAccountView.as_view(),  name='activate'),
    path('user/resend-activation/',                 views.ResendActivationView.as_view(), name='resend-activation'),

    # ── Admin: Manage Users ───────────────────────────────────────────────────
    path('admin/users/',         views.AdminUserListView.as_view()),
    path('admin/users/<int:pk>/', views.AdminUserDetailView.as_view()),
]