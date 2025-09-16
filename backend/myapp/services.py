import requests
import os
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv()

HOURS_IN_DAY = 24
SECS_IN_HOUR = 3600
SECS_IN_30MIN_BREAK = 1800
SECS_IN_10HR_BREAK = 36000
SECS_IN_34HR_RESTART = 122400
MAX_DRIVING_HRS_PER_DAY = 11
MAX_ON_DUTY_HRS_PER_DAY = 14
MAX_DRIVING_BEFORE_BREAK_SECS = 8 * SECS_IN_HOUR
MAX_70_HR_CYCLE_SECS = 70 * SECS_IN_HOUR

AVG_SPEED_MPH = 60
FUELING_STOP_INTERVAL_MILES = 1000
FUELING_STOP_DURATION_SECS = SECS_IN_HOUR
PICKUP_DROP_OFF_DURATION_SECS = 2 * SECS_IN_HOUR

def get_coordinates(location_name):
    if "Washington, D.C." in location_name:
        return [-77.0369, 38.9072]
    elif "Baltimore, MD" in location_name:
        return [-76.6122, 39.2904]
    else:
        return [-77.0369, 38.9072]

def generate_eld_logs(trip_duration_seconds, current_cycle_used_hours=0):
    logs = []
    current_day = 1
    time_elapsed_on_trip = 0
    current_day_driving_secs = Decimal(0)
    current_day_on_duty_secs = Decimal(0)
    total_70hr_cycle_secs = Decimal(current_cycle_used_hours) * Decimal(SECS_IN_HOUR)
    distance_driven_miles = 0
    last_rest_break_time_secs = 0

    def add_segment(day, status, duration_secs, notes=''):
        logs.append({
            'day': day,
            'status': status,
            'hours': float(round(duration_secs / SECS_IN_HOUR, 2)),
            'notes': notes
        })

    def get_remaining_cycle_time():
        return MAX_70_HR_CYCLE_SECS - total_70hr_cycle_secs

    pickup_dropoff_secs = min(PICKUP_DROP_OFF_DURATION_SECS, get_remaining_cycle_time())
    if pickup_dropoff_secs <= 0:
        add_segment(current_day, 'Off-Duty', SECS_IN_34HR_RESTART, "34-Hour Restart")
        return logs

    add_segment(current_day, 'On-Duty', pickup_dropoff_secs, "Pickup and Drop-off Time")
    current_day_on_duty_secs += Decimal(pickup_dropoff_secs)
    total_70hr_cycle_secs += Decimal(pickup_dropoff_secs)

    while time_elapsed_on_trip < trip_duration_seconds:
        rem = get_remaining_cycle_time()
        if rem <= 0:
            add_segment(current_day, 'Off-Duty', SECS_IN_34HR_RESTART, "34-Hour Restart (Cycle limit reached)")
            current_day += 1
            current_day_driving_secs = Decimal(0)
            current_day_on_duty_secs = Decimal(0)
            total_70hr_cycle_secs = Decimal(0)
            last_rest_break_time_secs = 0
            continue

        rem_daily_driving = (MAX_DRIVING_HRS_PER_DAY * SECS_IN_HOUR) - current_day_driving_secs
        rem_daily_on_duty = (MAX_ON_DUTY_HRS_PER_DAY * SECS_IN_HOUR) - current_day_on_duty_secs

        driving_block_secs = min(SECS_IN_HOUR, rem, trip_duration_seconds - time_elapsed_on_trip,
                                rem_daily_driving, rem_daily_on_duty)

        if driving_block_secs <= 0:
            break

        add_segment(current_day, 'Driving', driving_block_secs)
        current_day_driving_secs += Decimal(driving_block_secs)
        current_day_on_duty_secs += Decimal(driving_block_secs)
        total_70hr_cycle_secs += Decimal(driving_block_secs)
        time_elapsed_on_trip += driving_block_secs
        distance_driven_miles += (driving_block_secs / SECS_IN_HOUR) * AVG_SPEED_MPH

        if distance_driven_miles >= FUELING_STOP_INTERVAL_MILES:
            fueling_secs = min(FUELING_STOP_DURATION_SECS, get_remaining_cycle_time())
            if fueling_secs > 0:
                add_segment(current_day, 'On-Duty', fueling_secs, "Fueling Stop")
                current_day_on_duty_secs += Decimal(fueling_secs)
                total_70hr_cycle_secs += Decimal(fueling_secs)
                distance_driven_miles = 0

        if current_day_driving_secs >= MAX_DRIVING_BEFORE_BREAK_SECS and last_rest_break_time_secs < current_day_driving_secs:
            rest_secs = min(SECS_IN_30MIN_BREAK, get_remaining_cycle_time())
            if rest_secs > 0:
                add_segment(current_day, 'Off-Duty', rest_secs, "30-Min Rest Break")
                time_elapsed_on_trip += rest_secs
                last_rest_break_time_secs = current_day_driving_secs

        if current_day_on_duty_secs >= (MAX_ON_DUTY_HRS_PER_DAY * SECS_IN_HOUR) or time_elapsed_on_trip >= trip_duration_seconds:
            add_segment(current_day, 'Off-Duty', SECS_IN_10HR_BREAK, "10-Hour Off-Duty Break")
            total_70hr_cycle_secs += Decimal(SECS_IN_10HR_BREAK)
            current_day_driving_secs = Decimal(0)
            current_day_on_duty_secs = Decimal(0)
            last_rest_break_time_secs = 0
            current_day += 1

    days = set(log['day'] for log in logs)
    for d in days:
        day_segments = [log for log in logs if log['day'] == d]
        total_sec = sum(log['hours'] * SECS_IN_HOUR for log in day_segments)
        remainder = HOURS_IN_DAY * SECS_IN_HOUR - total_sec
        if remainder > 0:
            add_segment(d, 'Off-Duty', remainder, "Off-Duty filler")

    clean_logs = []
    prev = None
    for seg in logs:
        if seg != prev:
            clean_logs.append(seg)
        prev = seg

    return clean_logs

def generate_eld_log(pickup_location, dropoff_location, current_cycle_used_hours):
    api_key = os.environ.get('ORS_API_KEY')
    if not api_key:
        return {'error': "Openrouteservice API key not found in environment variables. Please set ORS_API_KEY."}

    pickup_coords = get_coordinates(pickup_location)
    dropoff_coords = get_coordinates(dropoff_location)
    url = "https://api.openrouteservice.org/v2/directions/driving-car/json"
    headers = {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, application/ors-response-data',
        'Authorization': api_key
    }
    body = {"coordinates": [pickup_coords, dropoff_coords]}

    response = requests.post(url, headers=headers, json=body)
    if response.status_code != 200:
        return {'error': f"Openrouteservice API Error: {response.text}"}
    route_data = response.json()

    if "routes" not in route_data:
        return {'error': "No routes found by Openrouteservice for the given locations."}

    trip_duration_seconds = route_data['routes'][0]['summary']['duration']
    daily_logs = generate_eld_logs(trip_duration_seconds, current_cycle_used_hours)

    return {
        'route_data': route_data,
        'daily_logs': daily_logs,
    }
