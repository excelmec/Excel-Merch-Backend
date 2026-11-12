# Excel-Merch-Backend

### Documentation

https://documenter.getpostman.com/view/29362600/2s9YkrZeL2


### Order Status Flow
![orderStatusFlow](assets/Order%20Status.png)

### Production deployment

The `main` branch trigger in `production-513109` runs `cloudbuild.yaml`. It builds the backend and updates the `excel-merch-backend` Cloud Run service in `asia-southeast1`. The service uses `excel-2026-merch-static-513109` for the email logo and new item media.

The bucket stays private. The `merch-runtime` service account has object access, and the backend serves only the logo and item media through `/media`. `MERCH_PUBLIC_BASE_URL` must be the public backend URL so image links stored with new items and the email logo link resolve correctly.

Startup runs `prisma migrate deploy`; the pickup phone migration adds a nullable field so existing orders remain valid. New self pickup checkouts require a 10-digit collector phone number.
