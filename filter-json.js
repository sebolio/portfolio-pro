#!/usr/bin/env node

const fs = require("fs");

// ----------------------
// Usage:
// node filter-json.js input.json output.json 'data:{id,Title,Contenido,blog_tags:{Name}}'
// ----------------------

const [, , inputFile, outputFile, selector] = process.argv;

if (!inputFile || !outputFile || !selector) {
  console.log(`
Usage:
  node filter-json.js input.json output.json 'data:{id,Title,Contenido,blog_tags:{Name}}'
`);
  process.exit(1);
}

// ----------------------
// Parser
// ----------------------

function parseSelector(str) {
  let i = 0;

  function skipWhitespace() {
    while (/\s/.test(str[i])) i++;
  }

  function parseKey() {
    skipWhitespace();

    let start = i;

    while (
      i < str.length &&
      /[a-zA-Z0-9_\-$]/.test(str[i])
    ) {
      i++;
    }

    return str.slice(start, i);
  }

  function parseObject() {
    const result = {};

    skipWhitespace();

    if (str[i] !== "{") {
      throw new Error(`Expected { at position ${i}`);
    }

    i++; // skip {

    while (i < str.length) {
      skipWhitespace();

      if (str[i] === "}") {
        i++;
        break;
      }

      const key = parseKey();

      skipWhitespace();

      if (str[i] === ":") {
        i++; // skip :

        skipWhitespace();

        if (str[i] === "{") {
          result[key] = parseObject();
        } else {
          result[key] = true;
        }
      } else {
        result[key] = true;
      }

      skipWhitespace();

      if (str[i] === ",") {
        i++;
      }
    }

    return result;
  }

  const rootKey = parseKey();

  skipWhitespace();

  if (str[i] !== ":") {
    throw new Error(`Expected : after root key`);
  }

  i++;

  skipWhitespace();

  const tree = parseObject();

  return {
    [rootKey]: tree,
  };
}

// ----------------------
// Filtering
// ----------------------

function filterData(data, schema) {
  if (Array.isArray(data)) {
    return data.map(item => filterData(item, schema));
  }

  if (
    typeof data !== "object" ||
    data === null
  ) {
    return data;
  }

  const result = {};

  for (const key of Object.keys(schema)) {
    if (!(key in data)) continue;

    if (schema[key] === true) {
      result[key] = data[key];
    } else {
      result[key] = filterData(
        data[key],
        schema[key]
      );
    }
  }

  return result;
}

// ----------------------
// Main
// ----------------------

try {
  const input = JSON.parse(
    fs.readFileSync(inputFile, "utf8")
  );

  const schema = parseSelector(selector);

  const rootKey = Object.keys(schema)[0];

  const output = {
    [rootKey]: filterData(
      input[rootKey],
      schema[rootKey]
    ),
  };

  fs.writeFileSync(
    outputFile,
    JSON.stringify(output, null, 2)
  );

  console.log(`Saved filtered JSON to ${outputFile}`);
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}