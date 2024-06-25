# API Documentation

**List of APIs**
- [`GET` airlines](#get-airlines)
- [`GET` airports](#get-airports)
- [`POST` search](#post-search)
- [`POST` book](#post-book)
- [`GET` book-info/:code](#get-book-info)
- [`GET` search-airport/:query](#get-search-airport)


---

### `GET` airlines

Get a list of all airlines.

> `/airlines`

**Response:**
```json
{
    "rc": "00",
    "msg": "sukses",
    "data": [
        {
            "airlineCode": "LIO",
            "airlineName": "Lion Air"
        },
        {
            "airlineCode": "GAR",
            "airlineName": "Garuda Indonesia"
        },
        {
            "airlineCode": "CIT",
            "airlineName": "Citilink"
        },
        {
            "airlineCode": "SRI",
            "airlineName": "Sriwijaya"
        },
        {
            "airlineCode": "TRI",
            "airlineName": "Trigana Air"
        },
        {
            "airlineCode": "TRA",
            "airlineName": "Transnusa"
        },
        {
            "airlineCode": "PLA",
            "airlineName": "Pelita Air"
        }
    ]
}
```

----
### `GET` airports

Get a list of all airports.

> `/airports`

**Response:**
```json
{
    "rc": "00",
    "msg": "sukses",
    "data": [
        {
            "code": "TRZ",
            "name": "Tiruchirappalli (TRZ), India",
            "bandara": "Tiruchirappalli",
            "group": "Internasional"
        },
        {
          "code": "KXB",
          "name": "Pomala Kolaka Airport (KXB)",
          "bandara": "Sangia Nibanderia",
          "group": "Domestik"
        },
    ]
```
---

### `POST` search

Search flights.

> `/search`


**Request:**
```json
{
    "airline" : "LIO",
    "departure" : "KNO",
    "arrival" : "UPG",
    "departureDate" : "2023-07-17",
    "returnDate" : "",
    "adult" : 1,
    "child" : 0,
    "infant" : 0
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
        [
          {
            "availability": 2,
            "class": "L",
            "price": 689500,
            "departureTime": "06:50",
            "depatureTime": "06:50",
            "arrivalTime": "08:00",
            "flightCode": "JT565",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 10 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "title": "JT565 YIA CGK 06:50-08:00",
      "isTransit": false,
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
          "flightName": "Lion Air",
          "transitTime": "0j0m",
          "flightCode": "JT565",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "06:50",
          "arrival": "08:00",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 10 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "1 jam 10 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
      "airlineName": "Lion Air",
      "airlineCode": "LIO",
      "searchId": "078c7a6906da3ee4751e2f90f3c8890293ba9f78"
    },
    {
      "classes": [
        [
          {
            "availability": 9,
            "class": "S",
            "price": 977900,
            "departureTime": "07:50",
            "depatureTime": "07:50",
            "arrivalTime": "09:00",
            "flightCode": "ID6369",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 10 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "title": "ID6369 YIA CGK 07:50-09:00",
      "isTransit": false,
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
          "flightName": "Batik Air",
          "transitTime": "0j0m",
          "flightCode": "ID6369",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "07:50",
          "arrival": "09:00",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 10 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "1 jam 10 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
      "airlineName": "Batik Air",
      "airlineCode": "LIO",
      "searchId": "558959699f2988e0b09b4ef08be25f3ab921eb28"
    },
    {
      "classes": [
        [
          {
            "availability": 7,
            "class": "S",
            "price": 849300,
            "departureTime": "08:50",
            "depatureTime": "08:50",
            "arrivalTime": "10:00",
            "flightCode": "IU313",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 10 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "title": "IU313 YIA CGK 08:50-10:00",
      "isTransit": false,
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPIU.png",
          "flightName": "Super Air Jet",
          "transitTime": "0j0m",
          "flightCode": "IU313",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "08:50",
          "arrival": "10:00",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 10 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "1 jam 10 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPIU.png",
      "airlineName": "Super Air Jet",
      "airlineCode": "LIO",
      "searchId": "7270fc9005e8d198b8a1a9784f6828cfdf8ff8c5"
    },
    {
      "classes": [
        [
          {
            "availability": 9,
            "class": "S",
            "price": 849300,
            "departureTime": "10:35",
            "depatureTime": "10:35",
            "arrivalTime": "11:45",
            "flightCode": "JT735",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 10 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "title": "JT735 YIA CGK 10:35-11:45",
      "isTransit": false,
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
          "flightName": "Lion Air",
          "transitTime": "0j0m",
          "flightCode": "JT735",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "10:35",
          "arrival": "11:45",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 10 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "1 jam 10 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
      "airlineName": "Lion Air",
      "airlineCode": "LIO",
      "searchId": "0cd17eac6d9c0e0baf461f8ad94acef228cae0c3"
    },
    {
      "classes": [
        [
          {
            "availability": 9,
            "class": "B",
            "price": 930100,
            "departureTime": "11:30",
            "depatureTime": "11:30",
            "arrivalTime": "12:40",
            "flightCode": "ID6379",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 10 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "title": "ID6379 YIA CGK 11:30-12:40",
      "isTransit": false,
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
          "flightName": "Batik Air",
          "transitTime": "0j0m",
          "flightCode": "ID6379",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "11:30",
          "arrival": "12:40",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 10 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "1 jam 10 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
      "airlineName": "Batik Air",
      "airlineCode": "LIO",
      "searchId": "b1b0068040f976efc3f9031ce326529bd4f2eef9"
    },
    {
      "classes": [
        [
          {
            "availability": 2,
            "class": "H",
            "price": 883500,
            "departureTime": "12:50",
            "depatureTime": "12:50",
            "arrivalTime": "14:00",
            "flightCode": "ID6345",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 10 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "title": "ID6345 YIA CGK 12:50-14:00",
      "isTransit": false,
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
          "flightName": "Batik Air",
          "transitTime": "0j0m",
          "flightCode": "ID6345",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "12:50",
          "arrival": "14:00",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 10 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "1 jam 10 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
      "airlineName": "Batik Air",
      "airlineCode": "LIO",
      "searchId": "cc73088e1c7651e970afe3d6393a8fc332deaad6"
    },
    {
      "classes": [
        [
          {
            "availability": 9,
            "class": "K",
            "price": 836900,
            "departureTime": "13:40",
            "depatureTime": "13:40",
            "arrivalTime": "14:50",
            "flightCode": "ID6371",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 10 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "title": "ID6371 YIA CGK 13:40-14:50",
      "isTransit": false,
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
          "flightName": "Batik Air",
          "transitTime": "0j0m",
          "flightCode": "ID6371",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "13:40",
          "arrival": "14:50",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 10 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "1 jam 10 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
      "airlineName": "Batik Air",
      "airlineCode": "LIO",
      "searchId": "d1ec0b684ebbf05b2f694de6bfeee9f8cd63be1a"
    },
    {
      "classes": [
        [
          {
            "availability": 9,
            "class": "H",
            "price": 883500,
            "departureTime": "15:10",
            "depatureTime": "15:10",
            "arrivalTime": "16:20",
            "flightCode": "ID6367",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 10 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "title": "ID6367 YIA CGK 15:10-16:20",
      "isTransit": false,
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
          "flightName": "Batik Air",
          "transitTime": "0j0m",
          "flightCode": "ID6367",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "15:10",
          "arrival": "16:20",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 10 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "1 jam 10 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
      "airlineName": "Batik Air",
      "airlineCode": "LIO",
      "searchId": "a83f76d6b67640d9cdfdfe2ba0ebac6dd8e734b7"
    },
    {
      "classes": [
        [
          {
            "availability": 9,
            "class": "N",
            "price": 609600,
            "departureTime": "16:20",
            "depatureTime": "16:20",
            "arrivalTime": "17:30",
            "flightCode": "JT545",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 10 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "title": "JT545 YIA CGK 16:20-17:30",
      "isTransit": false,
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
          "flightName": "Lion Air",
          "transitTime": "0j0m",
          "flightCode": "JT545",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "16:20",
          "arrival": "17:30",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 10 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "1 jam 10 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
      "airlineName": "Lion Air",
      "airlineCode": "LIO",
      "searchId": "238f870e6e903d56d56930691b58935f1f901d9c"
    },
    {
      "classes": [
        [
          {
            "availability": 4,
            "class": "H",
            "price": 883500,
            "departureTime": "17:30",
            "depatureTime": "17:30",
            "arrivalTime": "18:40",
            "flightCode": "ID6377",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 10 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "title": "ID6377 YIA CGK 17:30-18:40",
      "isTransit": false,
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
          "flightName": "Batik Air",
          "transitTime": "0j0m",
          "flightCode": "ID6377",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "17:30",
          "arrival": "18:40",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 10 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "1 jam 10 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
      "airlineName": "Batik Air",
      "airlineCode": "LIO",
      "searchId": "d2fab81c1bcb9c366718cc309a18fb936c4a0a7d"
    },
    {
      "classes": [
        [
          {
            "availability": 9,
            "class": "Y",
            "price": 0,
            "departureTime": "08:05",
            "depatureTime": "08:05",
            "arrivalTime": "10:30",
            "flightCode": "JT520",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "BDJ",
            "arrivalName": "Syamsudin Noor",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WITA",
            "duration": "1 jam 25 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ],
        [
          {
            "availability": 9,
            "class": "L",
            "price": 0,
            "departureTime": "13:30",
            "depatureTime": "13:30",
            "arrivalTime": "14:10",
            "flightCode": "JT325",
            "departure": "BDJ",
            "departureName": "Syamsudin Noor",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "8.00",
            "arrivalTimeZone": "8.00",
            "departureTimeZoneText": "WITA",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 40 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "isTransit": true,
      "title": "JT520 YIA BDJ 08:05-10:30 > JT325 BDJ CGK 13:30-14:10",
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
          "flightName": "Lion Air",
          "transitTime": "0j0m",
          "flightCode": "JT520",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "BDJ",
          "destinationName": "Syamsudin Noor",
          "depart": "08:05",
          "arrival": "10:30",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 25 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WITA"
        },
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
          "flightName": "Lion Air",
          "transitTime": "4j0m",
          "flightCode": "JT325",
          "origin": "BDJ",
          "originName": "Syamsudin Noor",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "13:30",
          "arrival": "14:10",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 40 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WITA",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "BDJ",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "6 jam 5 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
      "airlineName": "Lion Air",
      "airlineCode": "LIO",
      "searchId": "6bbfa14faa90b3edfe67528a66469f108b82283d"
    },
    {
      "classes": [
        [
          {
            "availability": 9,
            "class": "Y",
            "price": 2174000,
            "departureTime": "06:30",
            "depatureTime": "06:30",
            "arrivalTime": "08:55",
            "flightCode": "JT522",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "BDJ",
            "arrivalName": "Syamsudin Noor",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WITA",
            "duration": "1 jam 25 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ],
        [
          {
            "availability": 9,
            "class": "L",
            "price": 0,
            "departureTime": "13:30",
            "depatureTime": "13:30",
            "arrivalTime": "14:10",
            "flightCode": "JT325",
            "departure": "BDJ",
            "departureName": "Syamsudin Noor",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "8.00",
            "arrivalTimeZone": "8.00",
            "departureTimeZoneText": "WITA",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 40 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "isTransit": true,
      "title": "JT522 YIA BDJ 06:30-08:55 > JT325 BDJ CGK 13:30-14:10",
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
          "flightName": "Lion Air",
          "transitTime": "0j0m",
          "flightCode": "JT522",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "BDJ",
          "destinationName": "Syamsudin Noor",
          "depart": "06:30",
          "arrival": "08:55",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 25 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WITA"
        },
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
          "flightName": "Lion Air",
          "transitTime": "5j35m",
          "flightCode": "JT325",
          "origin": "BDJ",
          "originName": "Syamsudin Noor",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "13:30",
          "arrival": "14:10",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 40 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WITA",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "BDJ",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "7 jam 40 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
      "airlineName": "Lion Air",
      "airlineCode": "LIO",
      "searchId": "51854b3fc2dfcaa60aa0459eae71cbd88efdb327"
    },
    {
      "classes": [
        [
          {
            "availability": 9,
            "class": "W",
            "price": 1810100,
            "departureTime": "09:50",
            "depatureTime": "09:50",
            "arrivalTime": "12:10",
            "flightCode": "JT560",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "DPS",
            "arrivalName": "Ngurah Rai",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WITA",
            "duration": "1 jam 20 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ],
        [
          {
            "availability": 7,
            "class": "N",
            "price": 0,
            "departureTime": "13:30",
            "depatureTime": "13:30",
            "arrivalTime": "14:20",
            "flightCode": "JT15",
            "departure": "DPS",
            "departureName": "Ngurah Rai",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "8.00",
            "arrivalTimeZone": "8.00",
            "departureTimeZoneText": "WITA",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 50 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "isTransit": true,
      "title": "JT560 YIA DPS 09:50-12:10 > JT15 DPS CGK 13:30-14:20",
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
          "flightName": "Lion Air",
          "transitTime": "0j0m",
          "flightCode": "JT560",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "DPS",
          "destinationName": "Ngurah Rai",
          "depart": "09:50",
          "arrival": "12:10",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 20 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WITA"
        },
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
          "flightName": "Lion Air",
          "transitTime": "2j20m",
          "flightCode": "JT15",
          "origin": "DPS",
          "originName": "Ngurah Rai",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "13:30",
          "arrival": "14:20",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 50 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WITA",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "DPS",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "4 jam 30 menit",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
      "airlineName": "Lion Air",
      "airlineCode": "LIO",
      "searchId": "9b9df46bd73320be9291844ee108b987a92eead1"
    },
    {
      "classes": [
        [
          {
            "availability": 9,
            "class": "W",
            "price": 1825500,
            "departureTime": "09:50",
            "depatureTime": "09:50",
            "arrivalTime": "12:10",
            "flightCode": "JT560",
            "departure": "YIA",
            "departureName": "Kulon Progo",
            "arrival": "DPS",
            "arrivalName": "Ngurah Rai",
            "isInternational": 0,
            "departureTimeZone": "7.00",
            "arrivalTimeZone": "7.00",
            "departureTimeZoneText": "WIB",
            "arrivalTimeZoneText": "WITA",
            "duration": "1 jam 20 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ],
        [
          {
            "availability": 7,
            "class": "N",
            "price": 0,
            "departureTime": "13:00",
            "depatureTime": "13:00",
            "arrivalTime": "13:50",
            "flightCode": "ID6517",
            "departure": "DPS",
            "departureName": "Ngurah Rai",
            "arrival": "CGK",
            "arrivalName": "Soekarno – Hatta",
            "isInternational": 0,
            "departureTimeZone": "8.00",
            "arrivalTimeZone": "8.00",
            "departureTimeZoneText": "WITA",
            "arrivalTimeZoneText": "WIB",
            "duration": "1 jam 50 menit",
            "departureDate": "2023-07-17",
            "arrivalDate": "2023-07-17"
          }
        ]
      ],
      "isTransit": true,
      "title": "JT560 YIA DPS 09:50-12:10 > ID6517 DPS CGK 13:00-13:50",
      "detailTitle": [
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
          "flightName": "Lion Air",
          "transitTime": "0j0m",
          "flightCode": "JT560",
          "origin": "YIA",
          "originName": "Kulon Progo",
          "destination": "DPS",
          "destinationName": "Ngurah Rai",
          "depart": "09:50",
          "arrival": "12:10",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 20 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WIB",
          "arrivalTimeZoneText": "WITA"
        },
        {
          "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPID.png",
          "flightName": "Batik Air",
          "transitTime": "1j50m",
          "flightCode": "ID6517",
          "origin": "DPS",
          "originName": "Ngurah Rai",
          "destination": "CGK",
          "destinationName": "Soekarno – Hatta",
          "depart": "13:00",
          "arrival": "13:50",
          "departureDate": "2023-07-17",
          "durationDetail": "1 jam 50 menit",
          "arrivalDate": "2023-07-17",
          "departureTimeZoneText": "WITA",
          "arrivalTimeZoneText": "WIB"
        }
      ],
      "cityTransit": "DPS",
      "departureDate": "2023-07-17",
      "arrivalDate": "2023-07-17",
      "duration": "4 jam",
      "airlineIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
      "airlineName": "Lion Air",
      "airlineCode": "LIO",
      "searchId": "1c9e802d2c8b946c2ee97d6a683683d2468f92e0"
    }
  ]
}
```
---
### `POST` book

Book searched flights.

> `/book`


**Request:**
```json
{
    "searchId": "078c7a6906da3ee4751e2f90f3c8890293ba9f78",
    "adult": "2",
    "child": "1",
    "infant": "1",
    "passengers": {
        "adults": [
            {
                "title": "Mr",
                "first_name": "Ari",
                "last_name": "Setiawan",
                "date_of_birth": "", //MM/DD/YYYY
                "nationality": "",
                "passport_number": "",
                "passport_issue_date": "", //MM/DD/YYYY
                "passport_expiry_date": "", //MM/DD/YYYY
                "passport_issuing_country": ""
            },
            {
                "title": "Mr",
                "first_name": "Sispan",
                "last_name": "Tototi",
                "date_of_birth": "", //MM/DD/YYYY
                "nationality": "",
                "passport_number": "",
                "passport_issue_date": "", //MM/DD/YYYY
                "passport_expiry_date": "", //MM/DD/YYYY
                "passport_issuing_country": ""
            }
        ],
        "children": [
            {
                "title": "Mr",
                "first_name": "Musbikhin",
                "last_name": "Musbikhin",
                "date_of_birth": "12/25/2018", //MM/DD/YYYY
                "nationality": "",
                "passport_number": "",
                "passport_issue_date": "", //MM/DD/YYYY
                "passport_expiry_date": "", //MM/DD/YYYY
                "passport_issuing_country": ""
            }
        ],
        "infants": [
            {
                "title": "Ms",
                "first_name": "Riska",
                "last_name": "WIdya",
                "date_of_birth": "12/25/2022", //MM/DD/YYYY
                "nationality": "",
                "passport_number": "",
                "passport_issue_date": "", //MM/DD/YYYY
                "passport_expiry_date": "", //MM/DD/YYYY
                "passport_issuing_country": ""
            }
        ]
    },
    "buyer": {
        "telp_number": "085156151500",
        "mobile_number": "085156151500",
        "email": "email@example.com"
    }
}
```


**Response:**
```json
{
  "rc": "00",
  "msg": "Sukses",
  "data": {
    "flightdetail": [
      {
        "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
        "flightName": "Lion Air",
        "transitTime": "0j0m",
        "flightCode": "JT565",
        "origin": "YIA",
        "originName": "Kulon Progo",
        "destination": "CGK",
        "destinationName": "Soekarno – Hatta",
        "depart": "06:50",
        "arrival": "08:00",
        "departureDate": "2023-07-17",
        "durationDetail": "1 jam 10 menit",
        "arrivalDate": "2023-07-17",
        "departureTimeZoneText": "WIB",
        "arrivalTimeZoneText": "WIB"
      }
    ],
    "passengers": {
      "adults": [
        {
          "title": "Mr",
          "first_name": "Ari",
          "last_name": "Setiawan"
        }
      ],
      "children": [
        {
          "title": "Mr",
          "first_name": "Musbikhin",
          "last_name": "Musbikhin",
          "date_of_birth": "12/25/2018"
        }
      ],
      "infants": [
        {
          "title": "Ms",
          "first_name": "Riska",
          "last_name": "WIdya",
          "date_of_birth": "12/25/2022"
        }
      ]
    },
    "buyer": {
      "telp_number": "085156151500",
      "mobile_number": "085156151500",
      "email": "email@example.com",
      "name": "Ari Setiawan"
    },
    "bookingCode": "FAKEBJSGP",
    "reservationDate": "2023-07-10 11:29",
    "timeLimit": "2023-07-11 11:29",
    "nominal": "529600",
    "comission": "2944",
    "airlineCode": "LIO",
    "status": "BOOK"
  }
}
```
---

### `GET` book-info/:code

Search flights.

> `/book-info/:book-code`

**Response:**
```json
{
  "rc": "00",
  "msg": "Sukses",
  "data": {
    "flightdetail": [
      {
        "flightIcon": "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
        "flightName": "Lion Air",
        "transitTime": "0j0m",
        "flightCode": "JT565",
        "origin": "YIA",
        "originName": "Kulon Progo",
        "destination": "CGK",
        "destinationName": "Soekarno – Hatta",
        "depart": "06:50",
        "arrival": "08:00",
        "departureDate": "2023-07-17",
        "durationDetail": "1 jam 10 menit",
        "arrivalDate": "2023-07-17",
        "departureTimeZoneText": "WIB",
        "arrivalTimeZoneText": "WIB"
      }
    ],
    "passengers": {
      "adults": [
        {
          "title": "Mr",
          "first_name": "Ari",
          "last_name": "Setiawan"
        }
      ],
      "children": [
        {
          "title": "Mr",
          "first_name": "Musbikhin",
          "last_name": "Musbikhin",
          "date_of_birth": "12/25/2018"
        }
      ],
      "infants": [
        {
          "title": "Ms",
          "first_name": "Riska",
          "last_name": "WIdya",
          "date_of_birth": "12/25/2022"
        }
      ]
    },
    "buyer": {
      "telp_number": "085156151500",
      "mobile_number": "085156151500",
      "email": "email@example.com",
      "name": "Ari Setiawan"
    },
    "bookingCode": "FAKEBJSGP",
    "reservationDate": "2023-07-10 11:29:00",
    "timeLimit": "2023-07-11 11:29:00",
    "nominal": "529600",
    "comission": "2945",
    "airlineCode": "LIO",
    "status": "ISSUED",
    "tiket_pdf": "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"
  }
}
```
---
### `GET` search-airport/:query

To search airport by code, name, or group

> `/search-airport/:query`

**Response:**
```json
{
  "data": [
    {
      "code": "TNJ",
      "name": "Tanjungpinang (TNJ)",
      "bandara": "Raja Haji Fisabilillah",
      "group": "Domestik"
    }
  ]
}
```