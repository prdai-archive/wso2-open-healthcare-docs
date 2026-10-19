# WSO2 Open Healthcare Documentation

This is the source documentation of WSO2 Open Healthcare.

## Prerequisites

To run the project locally, install [Node.js](https://nodejs.org/) version 20+ and npm.

## Run project locally (Dev Mode)

**Clone the repo**

```bash
$ git clone https://github.com/wso2/open-healthcare-docs.git
```

**Install the dependencies**

```bash
$ cd open-healthcare-docs/en
$ npm install
```

**Run Docusaurus**

Execute the following command from inside `open-healthcare-docs/en`.

```bash
$ npm run start
```

## Cut a docs version

Run the **Cut docs version** workflow from `main` with the release version (for example `1.0.0`). It snapshots `en/docs` into `versioned_docs` and opens a draft pull request.

The latest released version is served from `/docs`; main remains at `/docs/next`. To cut a version locally, run this from `en`:

```bash
$ npx docusaurus docs:version <version>
```

## License

Licenses this source under the Apache License, Version 2.0 ([LICENSE](LICENSE)), You may not use this file except in compliance with the License.
