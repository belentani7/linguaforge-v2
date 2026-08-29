import fs from "node:fs";
const spec = JSON.parse(fs.readFileSync("/tmp/tatoeba-openapi.json", "utf8"));
const path = spec.paths?.["/v1/sentences"];
console.log(
  JSON.stringify(
    {
      parameters: (path?.get?.parameters ?? []).map((parameter) => ({
        name: parameter.name,
        in: parameter.in,
        required: parameter.required,
        schema: parameter.schema,
        description: parameter.description,
      })),
    },
    null,
    2,
  ),
);
