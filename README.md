# Meloc - Concept Relationship Mapping

A proof-of-concept application demonstrating the power of graph databases combined with natural language processing and AI.

## Overview

Meloc is my first demo project exploring the integration of OpenAI's API with Neo4j graph database. This project serves as a conceptual demonstration for understanding and visualizing relationships between different concepts using modern AI technologies.

## Features

- **Semantic Concept Mapping**: Store concepts and their relationships in a graph database
- **AI-Powered Relationship Analysis**: Automatically analyze and determine relationship types between concepts
- **Visualization**: Interactive graph visualization of concept networks
- **Relationship Types**: Support for diverse relationship types (contains, is part of, depends on, etc.)
- **Embedding-Based Similarity**: Utilize OpenAI's embedding models to calculate semantic similarity

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: Neo4j Graph Database
- **AI**: OpenAI API (GPT-4o and text-embedding-3-small models)
- **Frontend**: React with Next.js
- **Visualization**: D3.js for interactive network graphs

## How It Works

1. Concepts are embedded using OpenAI's embedding models
2. Semantic similarity is calculated between concepts
3. AI analyzes potential relationships between similar concepts
4. Relationships are stored in Neo4j graph database
5. The concept network is visualized as an interactive graph

## Learning Goals

This project was created to explore and understand:

- Graph database concepts and Neo4j implementation
- OpenAI API integration and usage
- Vector embeddings for semantic similarity
- Relationship inference between concepts
- Interactive network visualization

## Project Status

This is a proof-of-concept project and not intended for production use. It demonstrates the potential of combining graph databases with modern AI technologies for knowledge representation and exploration.

## Getting Started

### Prerequisites

- Node.js
- Neo4j Database
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see `.env.example`)
4. Start the development server: `npm run dev`

## License

This project is intended for educational purposes. 