Workflow; Create auth endpoints
WORKFLOW ==> create-auth-endpoints

Creating authentication flow and endpoints in your API implies allowing users to register, verify their email address, and authenticate resulting in a JWT token returned to client.

When registering a new user, the system needs to verify the user's email address. This is done by sending a verify email containing a cryptographically secure token, which is a QUERY parameter that's included into a hyperlink the user has to click in order to confirm his or her email address. The first thing we'll need is a database, unless we already have one. This database needs to have a table called "users" or something similar with the following fields.

1. username
2. password
3. name
4. email
5. verified

The password must be stored as a cryptographically secure hash, and the database should have the same name as the module for the API unless the user explicitly says something else.

We will need two endpoints as follows.

1. Registration HTTP endpoint that stores a new user into the database, with hashed passwords for additional security
   - This endpoint should send an email to the registered user for verification purposes. Use the 'magic:auth:secret' and concatenate with the user's email address to create a 'secret token' that's used to avoid frauds from creating URLs without going through the backend's registration endpoint's logic. Also make sure you add the user's email address in your verification email, such that we can re-generate the token and make sure it matches in the verify email address endpoint. You don't need to store this token, since it can be re-generated from the email of the user, which is given to the verify endpoint.
   - The URL of the 'verify-email' endpoint should be 'https://[BACKEND_URL]/magic/modules/[MODULE_NAME]/verify-email?token=TOKEN_HERE&email=EMAIL_HERE'. Remember to correctly hash the 'magic:auth:secret' with the email during verification.
   - Make sure you generate a prompt that's referencing the correct column names. If you don't know the database schema for the table you can use the "database-schema" function to retrieve it.
   - When the user is created then make sure you set the 'verified' column to 0 using 'INTEGER' for this column as you create the database table.
2. Verify email endpoint accepting token and email arguments, which again uses the 'magic:auth:secret' to generate a hash of secret + email, and only if the hash matches the token argument it updates the user's 'verified' status in the database.
3. Authentication endpoint that returns a value JWT token the user can use to grant access to the secured endpoints
   - This endpoint should *only* all users having verified their email address to actually authenticate.

## Registration endpoint

Below is a template prompt you can use to generate the register endpoint.

```plaintext
HTTP endpoint accepting username, password, name, and email - All fields are mandatory. The endpoint insert a new record into [DATABASE] database and its [TABLE] table. The password must be cryptographically hashed, and the endpoint should set the 'verified' column to 0.

When having inserted the user, the endpoint should send an email to the user with the following hyperlink;

https://[BACKEND_URL]/magic/modules/[MODULE_NAME]/verify-email?token=TOKEN_HERE&email=EMAIL_HERE

The 'TOKEN' above is the cryptographically secure token created by hashing config secret with email, and the 'EMAIL_HERE' is the user's email.
```

The '[DATABASE]' above is your database name, the [TABLE] is your table name, the [BACKEND_URL] is the backend URL, and the [MODULE_NAME] is the name of the module. 'TOKEN_HERE' is the hashed combination of the 'magic:auth:config' configuration setting and the user's email, and the 'EMAIL_HERE' is the email address of the user. When checking if the user's 'verified' column is 0 make sure you use the 'long' type.

## Verify email endpoint

Below is a template prompt you can use to generate the verify email endpoint.

```plaintext
HTTP endpoint taking [token] and [email] arguments. The endpoint will hash the 'magic:auth:secret' configuration value and the user's email, and search through the [DATABASE] database and its [TABLE] table for the user, only returning records having 'verified' being 0. If the endpoint finds this user, it should update its 'verified' value to 1. If not, it should throw an exception.
```

The '[DATABASE]' above is your database name, the [TABLE] is your table name. The verify endpoint must be saved as an HTTP GET endpoint.

## Authenticate endpoint

Below is a template prompt you can use to generate authenticate endpoint.

```plaintext
HTTP endpoint taking username and email. Checks if user exists in [DATABASE] database and its [TABLE] table, and if it has the value of 1 for its verified column. If it finds the record, returns a new JWT token with the username and a role of 'guest'.

Notice, the password is cryptographically hashed, and must be checked as such, and the 'verfied' column is of type 'long'.
```

Notice, DO NOT ask the user for a sender's email address for the register endpoint above, since the Hyperlambda generated for sending emails will by default use the server's default from email address and name.

When you have all the required information from the user then continue the process until done!

