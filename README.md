# API Documentation

This document provides a detailed description of the APIs available in our system.

---

## List of APIs

1. [Get Airlines](#get-airlines)
2. [Get Airports](#get-airports)
3. [Search Flights](#post-search)
4. [Book Flights](#post-book)
5. [Get Booking Information](#get-book-info)
6. [Search Airport](#get-search-airport)

---

## `GET` Airlines

This endpoint returns a list of all airlines.

**Request:**

```http
GET /airlines
```

**Response:**

```json
{
    "rc": "00",
    "msg": "sukses",
    "data": [
        {
            "airlineCode": "XXX",
            "airlineName": "Airline 1"
        },
        ...
    ]
}
```

---

## `GET` Airports

This endpoint returns a list of all airports.

**Request:**

```http
GET /airports
```

**Response:**

```json
{
    "rc": "00",
    "msg": "sukses",
    "data": [
        {
            "code": "XXX",
            "name": "Airport 1",
            "bandara": "Bandara 1",
            "group": "Domestik"
        },
        ...
    ]
}
```

---

## `POST` Search Flights

This endpoint allows you to search for flights.

**Request:**

```http
POST /search
```

**Body**

```json
{
  "departure": "CGK", // IATA code of departure airport (e.g., CGK for Soekarno-Hatta)
  "arrival": "SIN", // IATA code of arrival airport (e.g., SIN for Changi)
  "departureDate": "2025-07-01", // Date of departure in YYYY-MM-DD format
  "returnDate": "2025-07-10", // Date of return (for round trip), optional for one-way
  "adult": 1, // Number of adult passengers (age 12+)
  "child": 0, // Number of children (age 2–11)
  "infant": 0 // Number of infants (under 2 years)
}
```

**Response:**

```json
{
  "rc": "00",
  "msg": "Sukses",
  "data": [
    {
      "classes": [
        ...
      ],
      "title": "...",
      "isTransit": false,
      "detailTitle": [
        ...
      ],
      "cityTransit": "",
      "departureDate": "...",
      "arrivalDate": "...",
      "duration": "...",
      "airlineIcon": "...",
      "airlineName": "...",
      "airlineCode": "...",
      "searchId": "..."
    },
    ...
  ]
}
```

---

## `POST` Book Flights

This endpoint allows you to book flights.

**Request:**

```http
POST /book
```

**Body**
```json
{
  "searchId": "e8a2956a62afa415d8d9c1f307287ef7ba69b0a6",
  "adult": "1",
  "child": "0",
  "infant": "0",
  "buyer": {
    "telp_number": "123123",
    "mobile_number": "123123",
    "email": "12323!@sds.com"
  },
  "passengers": {
    "adults": [
      {
        "title": "Mr",
        "first_name": "12",
        "last_name": "123",
        "date_of_birth": "06/18/2025"
      }
    ],
    "childrens": [],
    "infants": []
  }
}
```

**Response:**

```json
{
  "bookingCode": "RUEHS"
}
```

---

## `GET` Get Booking Information

This endpoint allows you to get booking information.

**Request:**

````http
GET /book-info/:code
````

**Body**

```json
{
  "bookingCode": "RUEHS"
}
```
**Response:**
```json
{
  "rc": "00",
  "msg": "Sukses",
  "data": {
    ...
  }
}
````

---

## `GET` Search Airport

This endpoint allows you to search for an airport by code or name.

**Request:**

```http
GET /search-airport/:query
```

**Response:**

```json
{
  "data": [
    {
      "code": "...",
      "name": "...",
      "bandara": "...",
      "group": "..."
    }
  ]
}
```
