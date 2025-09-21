# @yesjinu/prisma-to-graphql

A simple CLI tool to convert your Prisma schema models into GraphQL types.

## Installation

This tool is designed to be used with `npx`, so no global installation is required.

## Usage

Run the following command in your terminal. Using `@latest` is recommended to ensure you are always running the most recent version and to avoid potential `npx` caching issues.

```bash
npx @yesjinu/prisma-to-graphql@latest <path-to-your-schema.prisma> [output-file.graphql]
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
model Author {
  id       Int       @id @default(autoincrement())
  email    String    @unique
  name     String?
  posts    Post[]
  comments Comment[]
}

model Post {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  title     String
  content   String?
  published Boolean   @default(false)
  authorId  Int
  author    Author    @relation(fields: [authorId], references: [id])
  comments  Comment[]
}

model Comment {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  text      String
  postId    Int
  authorId  Int
  post      Post     @relation(fields: [postId], references: [id])
  author    Author   @relation(fields: [authorId], references: [id])
}
```

The tool will generate a GraphQL schema file:

```graphql
scalar DateTime
scalar JSON

type Author {
  id: ID!
  email: String!
  name: String
  posts: [Post!]
  comments: [Comment!]
}

type Post {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  title: String!
  content: String
  published: Boolean!
  authorId: ID!
  author: Author
  comments: [Comment!]
}

type Comment {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  text: String!
  postId: ID!
  authorId: ID!
  post: Post
  author: Author
}

```

## License

MIT
