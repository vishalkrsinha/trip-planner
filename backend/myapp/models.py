from django.db import models

class Trip(models.Model):
    """
    Represents a single trip with start and end details.
    """
    current_location = models.CharField(
        max_length=255,
        help_text="The starting point of the driver before the trip."
    )
    pickup_location = models.CharField(
        max_length=255,
        help_text="The pickup location for the trip."
    )
    dropoff_location = models.CharField(
        max_length=255,
        help_text="The drop-off location for the trip."
    )

    current_cycle_used_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="The number of hours already used in the current 70-hour/8-day cycle."
    )
    
    trip_data = models.JSONField(
        default=dict, blank=True, null=True,
        help_text="Stores the calculated route and ELD log data from the API call."
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trip from {self.pickup_location} to {self.dropoff_location}"