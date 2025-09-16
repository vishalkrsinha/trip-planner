from django.contrib import admin
from .models import Trip


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    """
    Admin view for the Trip model.
    """
    list_display = ('id', 'pickup_location', 'dropoff_location', 'current_cycle_used_hours', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('pickup_location', 'dropoff_location')
    readonly_fields = ('trip_data', 'created_at')
    fieldsets = (
        (None, {'fields': ('current_location', 'pickup_location', 'dropoff_location', 'current_cycle_used_hours')}),
        ('Trip Data', {'fields': ('trip_data', 'created_at')}),
    )
