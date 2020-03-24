# LED Control Service API

## Part (2/3)

## Intro

This in a repo for a project split into 3 repositories.
Within this repo you can find the program that stands in the middle of the Front-End Application and the ESP controller software.
This project was built on react for training purposes.

## Requirements

-   A Server (This can be anything. Your own PC, a Raspberry PI. Something with small latency.)
    -   At least 512MB of RAM
    -   1 GHz Processor
    -   Basically, able to handle a Redis server
-   A Redis Server
    -   Protected by password
    -   Able to run KeySpace Notifications [Link](https://redis.io/topics/notifications)

KeySpace Notifications are very important as this API requires them to work correctly. Without it we won't know what's going on with the LED's

## Configuration

1. Copy the `.env.example` file and save it as `.env`
2. Set the correct Redist connection details in the Redis section. (Password is setup in the redis-cli).
3. Setup the host and the port you want to use for the API Socket to work on. (Please note: This uses a HTTP socket so it requires to run a lightweight HTTP server).

## Setup

When making this project I assumed that this will be an internal tool for controlling LEDs around my house. This app has no security or authentication system in place so it is fine to run it in either development mode using.

```bash
npm start
```

Ideally run this with nodemon (npm i -g nodemon). This way it will try to restart the application each time you try to make changes to the node App.

```bash
nodemon
```

If anything didn't go worng you should be ready to go to the next repo!
