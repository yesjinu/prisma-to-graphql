#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Convert Prisma model to GraphQL type
 */
function convertPrismaToGraphQL(prismaContent) {
  const lines = prismaContent.split('\n');
  const models = [];
  let currentModel = null;
  let inModel = false;
  let braceCount = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('model ')) {
      const modelName = trimmedLine.split(' ')[1];

      // Skip malformed model declarations
      if (!modelName || modelName === '') {
        continue;
      }

      currentModel = {
        name: modelName,
        fields: [],
        rawContent: [],
      };
      inModel = true;
      braceCount = 0;
    }

    if (inModel) {
      currentModel.rawContent.push(line);

      if (trimmedLine.includes('{')) {
        braceCount += (trimmedLine.match(/\{/g) || []).length;
      }
      if (trimmedLine.includes('}')) {
        braceCount -= (trimmedLine.match(/\}/g) || []).length;

        if (braceCount === 0) {
          models.push(currentModel);
          currentModel = null;
          inModel = false;
        }
      }
    }
  }

  return models.map((model) => convertModelToGraphQL(model));
}

/**
 * Convert individual model to GraphQL type
 */
function convertModelToGraphQL(model) {
  const lines = model.rawContent;
  const fields = [];

  for (let i = 1; i < lines.length - 1; i++) {
    // Skip first and last line (model declaration and closing brace)
    const line = lines[i].trim();

    if (!line || line.startsWith('@@') || line.startsWith('//')) {
      continue;
    }

    const field = parseField(line);
    if (field) {
      fields.push(field);
    }
  }

  const graphqlTypeName = toPascalCase(model.name);

  let graphqlType = `type ${graphqlTypeName} {\n`;

  for (const field of fields) {
    const required = field.nullable ? '' : '!';
    graphqlType += `  ${field.name}: ${field.type}${required}\n`;
  }

  graphqlType += '}';

  return graphqlType;
}

/**
 * Parse a field line from Prisma model
 */
function parseField(line) {
  // Remove comments and attributes
  const cleanLine = line.split('//')[0].split('@')[0].trim();

  if (!cleanLine) return null;

  const parts = cleanLine.split(/\s+/);
  if (parts.length < 2) return null;

  const fieldName = parts[0];
  const fieldType = parts[1];

  // Skip relation fields that don't have proper type definitions
  if (fieldType.includes('@@') || fieldType.includes('@')) {
    return null;
  }

  const nullable = fieldType.includes('?');
  const isArray = fieldType.includes('[]');

  // Check if this is a relation field by looking at the original line
  const isRelationField = line.includes('@relation(');

  // Check if this is an array relation field (like post_category[], post_comment[])
  // These are relations to other models even without @relation decorator
  const cleanFieldType = fieldType.replace('?', '').replace('[]', '');
  const isModelReference = ![
    'Int',
    'String',
    'Boolean',
    'DateTime',
    'Float',
    'Json',
    'Decimal',
  ].includes(cleanFieldType);

  let graphqlType = convertPrismaTypeToGraphQL(cleanFieldType);

  if (isArray) {
    graphqlType = `[${graphqlType}!]`;
  }

  return {
    name: fieldName,
    type: graphqlType,
    nullable: nullable || isRelationField || isModelReference, // Make all relation fields optional
  };
}

/**
 * Convert Prisma type to GraphQL type
 */
function convertPrismaTypeToGraphQL(prismaType) {
  const typeMap = {
    Int: 'ID',
    String: 'String',
    Boolean: 'Boolean',
    DateTime: 'DateTime',
    Float: 'Float',
    Json: 'JSON',
    Decimal: 'Float',
  };

  // If it's a primitive type, convert it
  if (typeMap[prismaType]) {
    return typeMap[prismaType];
  }

  // If it's a model reference, convert to PascalCase
  return toPascalCase(prismaType);
}

/**
 * Convert snake_case to PascalCase
 */
function toPascalCase(str) {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Main function to convert entire Prisma schema
 */
function convertSchema(inputFile, outputFile) {
  try {
    const prismaContent = fs.readFileSync(inputFile, 'utf8');
    const models = convertPrismaToGraphQL(prismaContent);

    let graphqlContent = '';

    // Add common scalars
    graphqlContent += 'scalar DateTime\n';
    graphqlContent += 'scalar JSON\n\n';

    // Add all types
    for (const modelType of models) {
      graphqlContent += modelType + '\n\n';
    }

    fs.writeFileSync(outputFile, graphqlContent);
    console.log(`✅ Converted ${models.length} models to GraphQL types`);
    console.log(`📄 Output written to: ${outputFile}`);
  } catch (error) {
    console.error('❌ Error converting schema:', error.message);
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(
      'Usage: node prisma-to-graphql.js <input-schema.prisma> [output-file.graphql]'
    );
    console.log(
      'Example: node prisma-to-graphql.js libs/caramel-prisma/prisma/schema.prisma'
    );
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || 'apps/mobile/src/schema/models.graphql';

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  convertSchema(inputFile, outputFile);
}

module.exports = {
  convertPrismaToGraphQL,
  convertModelToGraphQL,
  convertSchema,
};
