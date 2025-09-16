from rest_framework import generics, status
from rest_framework.response import Response
from .models import Trip
from .serializers import TripSerializer
from .services import generate_eld_log

class TripCreateAPIView(generics.CreateAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Extract validated data
        pickup_location = serializer.validated_data.get('pickup_location')
        dropoff_location = serializer.validated_data.get('dropoff_location')
        current_cycle_used_hours = serializer.validated_data['current_cycle_used_hours']

        # Call the service to generate trip data
        trip_result = generate_eld_log(pickup_location, dropoff_location, current_cycle_used_hours)

        # Check for errors from the service layer
        if 'error' in trip_result:
            return Response({"error": trip_result['error']}, status=status.HTTP_400_BAD_REQUEST)

        openrouteservice_response = trip_result.get('route_data')

        if openrouteservice_response and "routes" in openrouteservice_response:
            # Save the full trip data to the database
            serializer.save(trip_data=trip_result)

            # Return the necessary data to the frontend
            return Response({
                'routeInstructions': openrouteservice_response['routes'][0].get('segments')[0].get('steps'),
                'routeGeometry': openrouteservice_response['routes'][0].get('geometry'),
                'dailyLogs': trip_result.get('daily_logs', []),
            }, status=status.HTTP_201_CREATED)
        else:
            # This case handles unexpected responses from the routing service
            return Response({"error": "Failed to generate route or no routes found."}, status=status.HTTP_400_BAD_REQUEST)
