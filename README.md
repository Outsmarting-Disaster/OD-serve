### Run In NPM


```bash
make install & make start
```

While developing locally, we recommend using the dev.lantern.link domain name to avoid unexpected browser errors. This points to 127.0.0.1.

After starting your server it will be available here: https://dev.lantern.link:9443


### Run in Docker

This command loads the server into a basic Node.js Docker container:

```bash
make stage
```

After starting your container, the server will be available here: https://dev.lantern.link


### Development and Testing
After starting your server as a developer:

```shell
npm install
npm run lint
npm run test
npm run pack
```

### Requirements

A local [Docker](https://www.docker.com/community-edition) environment is required to begin.


### Disclaimer
This repository is under active development and not yet intended for widespread use.
