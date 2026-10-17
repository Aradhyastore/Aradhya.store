ARADHYA ORDER SYSTEM - DEPLOYMENT NOTES

This package contains the updated Aradhya website + Cloudflare Worker backend.

ORDER FLOW
1. Customer adds products to cart.
2. Customer enters name, mobile and delivery address.
3. Website sends the order to /create-order.
4. Worker validates the products/prices and saves the order in D1.
5. Website shows the saved Order ID.
6. Website shows a CONFIRM ORDER ON WHATSAPP button with a pre-filled message.
7. The WhatsApp message includes the Order ID, customer details, products, product subtotal and an instruction to confirm delivery charges according to the delivery location.
8. Online payment is intentionally not enabled yet. Payment is COD/manual confirmation.
9. Admin can login and update order status from the Aradhya admin dashboard.

IMPORTANT
- The delivery charge amount is NOT invented or hard-coded in this version.
- The customer is told that the delivery charge will be confirmed according to location and included in the WhatsApp confirmation.
- If you later provide exact delivery rules/rates, the backend can be upgraded to calculate them automatically.

CLOUDFLARE WORKER
Worker URL:
https://aradhyabackend.www-aradhya-co.workers.dev

Keep the existing D1 binding named DB and the existing ADMIN_KEY secret.
After changing worker.js, deploy the Worker in Cloudflare. Uploading files to GitHub does NOT deploy worker.js automatically.

GITHUB WEBSITE
Upload the contents of the website folder to the repository root (index.html, script.js, style.css, admin.html and assets/).

ADMIN
Open the admin.html page from your GitHub Pages site and enter the same ADMIN_KEY configured in Cloudflare.
