from rest_framework import serializers
from .models import Trip

class TripSerializer(serializers.ModelSerializer):
    """
    Serializer for the Trip model.
    It will handle the data coming from the frontend and format it for the database.
    """
    class Meta:
        model = Trip
        fields = [
            "id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_used_hours",
            "trip_data",
        ]
        read_only_fields = ['id', 'trip_data']
        extra_kwargs = {
            'current_cycle_used_hours': {
                'max_digits': 5, 'decimal_places': 2,
                'min_value': 0.0, 'max_value': 70.0
            }
        }