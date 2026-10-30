# cyan-ui (archived prototype)

> **Status: archived.** This was an exploratory prototype and is no longer maintained.
> Rivarc is being redesigned from scratch in [rivarc-org/rivarc](https://github.com/rivarc-org/rivarc).

The visual editor for [CyanStack](https://github.com/rivarc-org/CyanStack), a quick,
AI-assisted prototype that tested deploying self-hosted software by connecting
services in a graph.

[Optional: a screenshot or short GIF of the editor. It's the fastest way for a
visitor to understand the idea.]

## What it did

- Shows services as nodes and their connections as edges
- Lets users add services from a catalogue and connect them
- [Anything else it did, e.g. editing service settings or showing deployment status]

Built with React, TypeScript and Vite.

## What carries over to Rivarc

The prototype confirmed that a graph is an understandable way to show how
self-hosted software fits together. Rivarc keeps that idea but changes where the
UI sits: the management UI becomes an ordinary node in the graph, reaching the
runtime through a connection like any other app, instead of a separate tool
standing outside the system.

## Licence

[LICENCE, or "No licence; kept for reference only."]
