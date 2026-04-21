# 🔌 Integrations

The Bosbiller project integrates with several third-party services to provide its core functionality.

## 💳 Midtrans (Payment Gateway)

We use [Midtrans Snap](https://docs.midtrans.com/en/snap/overview) for payment processing.

### Token Generation
The service `services/createMidtransToken.js` initializes the Midtrans Snap client using `MIDTRANS_SERVER_KEY` and `MIDTRANS_CLIENT_KEY` from the environment.

**Flow:**
1.  User creates a booking.
2.  Backend requests a `snapToken` from Midtrans.
3.  Token is returned to the frontend for the Snap popup.

### Webhooks
Webhook notifications from Midtrans should be handled to update transaction statuses. (Currently defined in `routes/webhooks/`, ensure this is configured in the Midtrans Dashboard).

---

## ⛴️ Sindo Ferry

The ferry service is the core integration for regional travel between Singapore and Indonesia.

### Master Data
- **Sectors**: Available travel routes.
- **Terminals**: Physical ferry terminals (mapped in the `Terminal` model).

### Search & Booking
Handled via routes in `routes/api/ferry/`. The system maintains a cache for Ferry tokens to optimize requests (see `utils/node-cache.js`).

---

## ✈️ Flight API

Flight searches and bookings are handled by a generic `ApiService` which communicates with a centralized flight aggregation service.

### `ApiService` (`services/apiService.js`)
This class standardizes requests to the external flight service. It handles:
- **Search**: Fetching real-time flight availability.
- **Booking Info**: Retrieving details for a specific `bookingCode`.

### Search Service (`services/searchService.js`)
A higher-level service that coordinates flight searches, potentially including caching or additional formatting.

---

## 🛠️ Integration Debugging

When debugging integrations, check the `server.log` or the console for specific error sources:
- `MidtransAPI`: Issues with payment keys or connectivity.
- `FlightAPI`: Issues with the flight provider credentials or service availability.
- `FerryAPI`: Issues with Sindo Ferry API responses.

> [!CAUTION]
> Never hardcode API keys. Always use `.env` variables and ensure they are not committed to version control.
