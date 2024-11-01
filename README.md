# Stargazer Network: Worker

## Table of Contents

-   [Overview](#overview)
-   [How It Works](#how-it-works)
-   [Getting Started](#getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Installation](#installation)
    -   [Configuration](#configuration)
    -   [Running the Worker](#running-the-worker)
-   [Future Enhancements](#future-enhancements)
-   [Contributing](#contributing)
-   [License](#license)

## Overview

Stargazer Network Worker is a processing node within the Stargazer Network ecosystem, designed to handle LLM inference requests from the gateway. Each worker instance connects to a local interface provider and processes requests from a Redis-based queue system, enabling distributed processing and horizontal scaling. Currently only ollama interface is setup.

## How It Works

To understand the full Architecture. Please checkout the [Stargazer Network Gateway](https://github.com/CptShad/SGNet-Gateway) project first.

1. **Queue Monitoring**: The worker continuously monitors the Redis queue for incoming requests.

2. **Task Processing**:

    - Retrieves task from redis queue only if the node has the requested model supported
    - Validates request parameters
    - Forwards request to local Ollama instance or interface provider
    - Streams responses back through Redis pub/sub

3. **Health Monitoring**:
    - Regular heartbeat to Redis

## Getting Started

### Prerequisites

-   [Bun](https://bun.sh/) runtime
-   [Redis](https://redis.io/) server
-   [Ollama](https://ollama.ai/) installed locally

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/SGNet-Worker.git
    ```

2. Navigate to the project directory:

    ```bash
    cd SGNet-Worker
    ```

3. Install dependencies:
    ```bash
    bun install
    ```

### Configuration

1. Copy the `.env.example` file to `.env`:

    ```bash
    cp .env.example .env
    ```

2. Edit the `.env` file and set the appropriate values for your environment. Make sure to add your loaded models into ACTIVE_MODELS.

### Running the Worker

Start the worker:

```bash
bun run start
```

## Future Enhancements

-   Add support for other interfaces.
-   Add support for Exo.
-   Enhance monitoring and logging capabilities
-   Implement request priority queuing

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](./docs/CONTRIBUTING.md) for more details.

## License

This project is licensed under the [MIT License](LICENSE).
