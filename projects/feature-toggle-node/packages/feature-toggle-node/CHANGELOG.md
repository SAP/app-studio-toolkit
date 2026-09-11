# 2.1.0 (2026-03-04)

### Features

- Fewer mandatory environment variables. to support "vending machine" flows.

### BREAKING CHANGES

- None

# 2.0.2 (2023-01-09)

### Features

- Updated dependencies 
- Sanitize user input for log

### BREAKING CHANGES

- None

# 2.0.1 (2022-01-23)

### Features

- Added handler on request timeout and invalid json

### BREAKING CHANGES

- None

<a name="2.0.0"></a>

# 2.0.0 (2022-01-19)

### Features

- Cache interval chagned to 15 minutes
- Environment variables support
    - Removed FT_TOKEN, FT_SERVER_ENDPOINT
    - Added LANDSCAPE_INFRASTRUCTURE and FTM_HOST

### BREAKING CHANGES

- New client doesn't support unleash feature toggle anymore
- Support new response from server

<a name="1.0.9"></a>

# 1.0.9 (2021-07-28)

### Features

- Code refactoring
- Support for customHeader. Retrieving authorisation token from FT_TOKEN environment variable

### BREAKING CHANGES

- None

<a name="1.0.8"></a>

# 1.0.8 (2021-01-20)

### Features

- Retrieving the sub account with the TENANT_NAME environment variable and the workspace with the WORKSPACE_ID environment variable instead of the WS_BASE_URL environment variable

### BREAKING CHANGES

- None

<a name="1.0.7"></a>

# 1.0.7 (2021-01-04)

### Features

- Updated dependencies

### BREAKING CHANGES

- None

<a name="1.0.6"></a>

# 1.0.6 (2020-11-02)

### Features

- Added support for "tenant id" strategy 

### BREAKING CHANGES

- None

<a name="1.0.5"></a>

# 1.0.5 (2020-07-23)

### Features

- Added support for "ready" and "registered" events of the unleash-client dependency 

### BREAKING CHANGES

- None

<a name="1.0.4"></a>

# 1.0.4 (2020-07-1)

### Features

- Added support for "environments" and "landscapes" strategies 

### BREAKING CHANGES

- None

<a name="1.0.3"></a>

# 1.0.3 (2020-05-31)

### Features

- updated packages and unleash-client to 3.3.5

### BREAKING CHANGES

- None

<a name="1.0.2"></a>

# 1.0.2 (2020-05-3)

### Features

- Returning false on any failure 

### BREAKING CHANGES

- None


<a name="1.0.1"></a>

# 1.0.1 (2020-04-20)

### Features

- Default and strategies feature toggles support

### BREAKING CHANGES

- None
