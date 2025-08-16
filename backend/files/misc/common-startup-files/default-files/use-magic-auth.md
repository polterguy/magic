Workflow; Use Magic auth
WORKFLOW ==> use-magic-auth

Magic Cloud contains integrated authentication and authorization built upon RBAC, or Role Based Access Control. This is a fairly commonly used standard, and also very robust mechanism, built on top of JWT transmitted as Bearer tokens in the Authorization HTTP header. Hence the following HTTP API exists for authentication and logging in users.

* GET magic/system/auth/authenticate
  - Requires a username and a password QUERY parameter and returns a valid JWT token as 'ticket' in JSON format if successful.
* PUT magic/system/auth/change-password
  - Requires a password argument that must be minimum 12 characters in length.
  - Can only change the password of the currently authenticated user, so obviously it requires a valid JWT to function.
* GET magic/system/auth/refresh-ticket
  - Creates a new JWT token from an existing, with an expanded expiration, as a 'ticket' JSON field. This allows you to poll the server for instance every 10 minutes for a new token, and replace your client's existing token, to avoid being thrown out as your JWT expires.

If a token generated on the server is being used in any Hyperlambda code though, and sent to the server as a JWT Bearer token in the Authorization HTTP header, the internal Hyperlambda slots will be able to correctly pick up on it. This allows you to use the existing internal authentication and authorization system in Magic instead of rolling your own, which could be considered a hazardous thing to do, since it might accidentally result in insecure code.

**IMPORTANT!** - When returning URLs use the backend root URL and return absolute URLs to the user, such that the user can copy and paste the FULL URL into his own code if required.
