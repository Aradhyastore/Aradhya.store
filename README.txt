ARADHYA ORDER RECEIVING FIX

What this fixes
1. Current Aradhya prices on the Worker: 299 for all single fragrances and 499 for both mixes.
2. The second mix name is corrected.
3. Customer checkout posts to /create-order.
4. Worker recalculates the order total from its own product catalogue.
5. Orders are saved to D1 with customer details and ordered items.
6. Admin dashboard points to the Aradhya Worker.
7. Admin authentication accepts X-Admin-Key and Authorization: Bearer.
8. Admin status updates support both the current PATCH route and the older POST /admin/update-status route.
9. Older D1 databases that use "processing" instead of "preparing" are handled when updating status.

IMPORTANT
The Worker file must be deployed to your Cloudflare Worker. Uploading the website files to GitHub Pages alone cannot change the Cloudflare backend.

Cloudflare Worker deployment
1. Open the Cloudflare dashboard for the account containing aradhyabackend.www-aradhya-co.workers.dev.
2. Open Workers & Pages -> aradhyabackend.
3. Open Edit Code.
4. Replace the Worker code with backend/worker.js.
5. Deploy / Save and Deploy.
6. Keep the existing D1 binding named DB and the existing ADMIN_KEY secret.
7. Do NOT put ADMIN_KEY into the website.

GitHub website deployment
1. Replace website/index.html, website/script.js and website/style.css in the Aradhya.store repository.
2. Upload website/admin.html as the admin dashboard file if you want the updated dashboard.
3. Keep the assets folder from this package.
4. Commit the changes.

Test order flow
1. Open the live Aradhya website.
2. Add one product to Cart.
3. Open Cart -> Checkout.
4. Enter a real test name, phone and address.
5. Click PLACE ORDER once.
6. The site should show an order reference.
7. Open admin.html and enter the same Admin Key used by the Worker.
8. The new order should appear under Orders.

Do not repeat the test if the browser says the request timed out until you first check the admin dashboard, because the server may already have saved the order.
