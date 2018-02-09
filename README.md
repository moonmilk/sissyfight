# sissyfight

Revival of the 1999 multiplayer game SiSSYFiGHT 2000, rewritten with node.js, SockJS, and CreateJS HTML5 library.

All original code and art are released under the MIT License or the Creative Commons CC-BY License. This repository also incorporates works that have their own licenses. For details, see [licenses.md](licenses.md).

This is an archived repository - we can't accept issues or pull requests here. You are welcome to fork this repo or copy it anywhere else. 

To find collaborators and exchange info about the source code, we recommend the SiSSYFiGHT Facebook group.
We unfortunately can't offer any additional support for use of the code.

## running a sissyfight server

The sissyfight server code runs under node.js. The original server is running on [Heroku](https://www.heroku.com/). 

## external servers

Sissyfight uses MySQL for persistent storage of user and score records, Redis for user sessions, and a service to send out emails, e.g. for password resets. 

### MySQL

We use a MySQL server hosted by [Dreamhost](https://www.dreamhost.com/), but you can run your own or use any commercial MySQL service. To connect your MySQL server to your sissyfight node application, set the environment variable `SISSYFIGHT_DB`:

`SISSYFIGHT_DB=mysql|DB SERVER|DB NAME|DB USER|DB PASSWORD`

where `DB_SERVER` is the domain name of your database server, `DB NAME` is the name of the database, and `DB USER` and `DB PASSWORD` are the username and password for that database. 

In your MySQL database, you can set up the user, score, and text tables according to the structures in [database_tables.sql](database_tables.sql).

### Redis

We use a Redis server hosted by [Redis Labs](https://redislabs.com/), but you can run your own or use any commercial Redis service. To connect your Redis server, set the environment variable `SISSYFIGHT_REDIS`:

`SISSYFIGHT_REDIS=redis|REDIS SERVER|PORT|NAME|AUTH`

`REDIS SERVER` is the domain name of the Redis server, `PORT` is the port number, `NAME` is the username and `AUTH` is the password or authentication token.

### Email

We use [SendGrid](https://sendgrid.com/)'s [Email API](https://sendgrid.com/solutions/email-api/) to send emails, but you can use any email service that is supported by the [Nodemailer](https://nodemailer.com/about/) module. To connect sissyfight to your your email server, set the environment variable `SISSYFIGHT_MAILER`:

`SISSYFIGHT_MAILER=MAILSERVICE|USER|PASSWORD`

`MAILSERVICE` is the name of the email service you are using (see Nodemailer's documentation), and `USER` and `PASSWORD` are your authentication info for the email service.

