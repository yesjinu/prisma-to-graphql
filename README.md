# @yesjinu/prisma-to-graphql

A simple CLI tool to convert your Prisma schema models into GraphQL types.

## Installation

This tool is designed to be used with `npx`, so no global installation is required.

## Usage

Run the following command in your terminal:

```bash
npx @yesjinu/prisma-to-graphql <path-to-your-schema.prisma> [output-file.graphql]
```

-   `<path-to-your-schema.prisma>`: (Required) The path to your input Prisma schema file.
-   `[output-file.graphql]`: (Optional) The path to the output GraphQL file. If not provided, it defaults to `schema.graphql`.

## Contributing

Contributions are welcome! To get started, clone the repository and install the dependencies.

### Running Tests

To run the test suite and verify your changes, use the following command:

```bash
npm test
```

### Example

Given a `schema.prisma` file like this:

```prisma
// schema.prisma

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}
```

The tool will generate a GraphQL schema file:

```graphql
scalar DateTime
scalar JSON

type Post {
  id: ID!
  title: String!
  content: String
  published: Boolean!
  author: User
  authorId: ID!
  createdAt: DateTime!
}

type User {
  id: ID!
  email: String!
  name: String
  posts: [Post!]
}
```

## License

MIT
