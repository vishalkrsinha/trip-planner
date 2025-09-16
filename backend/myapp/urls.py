from django.urls import path
from .views import TripCreateAPIView

app_name = 'myapp'

urlpatterns = [
    path('trips/create/', TripCreateAPIView.as_view(), name='trip-create'),
]