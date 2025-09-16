# Trip Planner & ELD Log Generator

This project is a web-based tool designed for truck drivers and dispatchers to plan trips and automatically generate compliant Electronic Logging Device (ELD) logs based on FMCSA (Federal Motor Carrier Safety Administration) Hours of Service (HOS) rules.

The application consists of a React frontend that provides the user interface and a Python/Django backend that handles the business logic for route calculation and ELD log generation.

## Features

- **Trip Planning**: Enter a start, pickup, and drop-off location to calculate a trip route.
- **HOS-Aware Log Generation**: Automatically generates daily driving logs considering:
  - 11-hour driving limit
  - 14-hour on-duty limit
  - 30-minute rest breaks
  - 10-hour off-duty breaks
  - 70-hour/8-day cycle limit
- **Interactive Route Map**: Visualizes the calculated trip route on a map using OpenStreetMap and Leaflet.
- **Detailed ELD Graphs**: Displays daily logs in a standard, easy-to-read FMCSA-compliant grid format, showing time spent in Off Duty, Sleeper Berth, Driving, and On Duty statuses.
- **Multi-Day Logs**: For longer trips, logs are automatically split into multiple days, which can be viewed via tabs.
- **Remarks and Breaks**: Automatically adds remarks for key events (Pickup, Drop-off) and shows required breaks on the log graph.

## Tech Stack

### Frontend

- **React**: For building the user interface.
- **Leaflet & React-Leaflet**: For displaying the interactive map.
- **Axios**: For making API requests to the backend.
- **CSS**: For styling components.

### Backend

- **Python**: Core language for the backend logic.
- **Django**: Web framework for serving the API.
- **OpenRouteService**: Used for route and duration calculations.

## Project Structure

```
trip-planner/
├── backend/         # Django backend application
│   ├── myapp/
│   └── ...
├── frontend/        # React frontend application
│   ├── public/
│   └── src/
└── README.md
```

## Setup and Installation

### Prerequisites

- Node.js and npm
- Python and pip
- An API key from [OpenRouteService](https://openrouteservice.org/)

### Backend Setup

1.  Navigate to the `backend` directory:
    `cd backend`
2.  Create a virtual environment and activate it.
3.  Install the required Python packages:
    `pip install -r requirements.txt`
4.  Create a `.env` file in the `backend` directory and add your OpenRouteService API key:
    `ORS_API_KEY='your_openrouteservice_api_key'`
5.  Run the Django development server:
    `python manage.py runserver`

The backend will be running on `http://127.0.0.1:8000`.

### Frontend Setup

1.  Navigate to the `frontend` directory:
    `cd frontend`
2.  Install the required npm packages:
    `npm install`
3.  Start the React development server:
    `npm start`

The frontend will open in your browser at `http://localhost:3000`.

## How to Use

1.  Ensure both the backend and frontend servers are running.
2.  Open your browser to `http://localhost:3000`.
3.  Fill in the form with the trip details (Current Location, Pickup, Drop-off, and current cycle hours used).
4.  Click "Generate Trip".
5.  The application will display the route on the map and the generated ELD logs below.