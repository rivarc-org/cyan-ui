# cyan-ui (archived prototype)

> **Status: archived.** This was an exploratory prototype and is no longer maintained.
> Rivarc is being redesigned from scratch in [rivarc-org/rivarc](https://github.com/rivarc-org/rivarc).

The visual editor for [CyanStack](https://github.com/rivarc-org/CyanStack), a quick,
AI-assisted prototype that tested deploying self-hosted software by connecting
services in a graph.

<img width="1600" height="970" alt="screenshot" src="https://github.com/user-attachments/assets/6588f9b5-7e53-4079-8c8d-c4d7cdd775a3" />


## What it did

- Shows services as nodes and their connections as edges
- Lets users add services from a catalogue and connect them

Built with React, TypeScript and Vite.

## What carries over to Rivarc

The prototype confirmed that a graph is an understandable way to show how
self-hosted software fits together. Rivarc keeps that idea but changes where the
UI sits: the management UI becomes an ordinary node in the graph, reaching the
runtime through a connection like any other app, instead of a separate tool
standing outside the system.


