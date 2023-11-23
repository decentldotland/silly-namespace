<p align="center">
  <a href="https://onsf.io">
    <img src="https://github.com/decentldotland/media-kit/blob/main/namespace/namespace-logo.svg" height="160">
  </a>
  <h3 align="center"><code>@decentldotland/aikek-resolver</code></h3>
  <p align="center">AIKEK Namespace Resolver</p>
</p>

## Build and run

```console
git pull https://github.com/decentldotland/aikek-resolver.git 

npm install && npm run start
```

## Methods

### Resolve a domain

- `GET /resolve/domain/:domain`


### Resolve an address (return only primary domain)

- `GET /resolve/addr/:addr`

### Fetch all domains owned by an address

- `GET /acc/:addr`

## License

This project is licensed under the [MIT License](./LICENSE)