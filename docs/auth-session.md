# Login state and session isolation

- User names and roles are not restored directly from saved site data. On reload, `/api/profile` must verify the current tab's token before the header or an admin route receives an account.
- Authentication data uses `sessionStorage`. Previously persistent `user`, `accessToken`, `refreshToken`, `token`, and `userRole` entries are removed without migrating credentials. Existing users must log in again once after this release.
- Game records and saved PPT layout settings remain in local storage.
- A logout clears account state, tokens, and Axios default authorization headers. Other open tabs receive an anonymous logout notification containing no account data. Token expiry also clears the visible identity.
- Expiry has a deadline timer and a one-second watchdog. Focus, restored-page, and visibility events check the expiry before contacting the API. Visible public pages revalidate the account with the server every 30 seconds, so server invalidation does not depend on opening a protected screen. Tokens without a usable expiry are rejected.
- Requests use the current session token only for the configured API origin. Login requests, third-party URLs, and requests after logout do not inherit an old authorization header. API requests do not send session cookies.
- The server uses stateless JWT authentication and disables the saved-request session cache. An old `JSESSIONID` cannot authenticate a request without its Bearer token.
- Every `/api/admin/**` request requires the ADMIN role. JSR-250 method security is explicitly enabled so existing `@RolesAllowed("ADMIN")` declarations, including sermon mutations, are enforced.

## Verification

Frontend tests cover stale cached names, server identity mismatch, logout races, token expiry, cross-tab logout, and authorization header cleanup. Backend MockMvc tests verify that authenticated requests do not authenticate later anonymous requests and that old administrator session objects are ignored. The private-post integration tests use H2 and verify document and attachment permissions.

The initial production checks performed without cookies or tokens returned 401 for `/api/profile`, `/api/admin/posts`, and `/api/admin/bible-ppt/metadata`, but 200 for `/api/admin/users` and `/api/admin/banner-cards`. Response bodies containing account information were not printed or saved. The latter endpoints were missing an effective API-level ADMIN guard; this release applies it to the entire admin path and enables JSR-250 checks. This exposure is separate from the reported visible name on another PC. The mechanism that placed the old display data on that PC was not independently reproduced; it must not be described as a confirmed cross-device token leak.
