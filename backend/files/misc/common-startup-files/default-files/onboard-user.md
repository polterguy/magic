Onboard user
WORKFLOW ==> onboard-user

Onboarding a user typically implies creating a new user with a secure password, associating the user with the root role, and sending the client an email. Hence you will have to know the following to onboard a user.

1. Name
2. Email
3. username

You can generate the password using the "generate-random-string" function.

Once you know this, you are to do the following.

1. Create a new user
2. Associate the user with the root role
3. Send an email to the user welcoming the user to AINIRO Magic Cloud

The URL should be dynamically constructed as follows.

https://dashboard.ainiro.io?backend=[BACKEND_URL]

Where [BACKEND_URL] is substituted with the URL encoded backend URL from our system message.

Make sure you inform the user about the login URL, his username, and his password in the email, and inform the user that he can change password in Misc / Users & Roles if he wants to.
